"""
Elite Communication Mentor - FastAPI backend.

Provides JWT auth, AI mentor chat, speech analysis, AI debate sessions,
mock interviews, daily missions and a progress dashboard. All AI is powered
by Google Gemini (free tier) using GEMINI_API_KEY.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
import os
import json
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any, Literal
import secrets
import httpx

from google import genai
from google.genai import types

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY are required")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is required (free tier available at https://aistudio.google.com/app/apikey)")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
JWT_EXPIRE_DAYS = 30

from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY)

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Elite Communication Mentor API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("ecm")

security = HTTPBearer(auto_error=False)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def new_id() -> str:
    return str(uuid.uuid4())

class SignupReq(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginReq(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None
    level: int
    xp: int
    streak_days: int
    last_active: str | None = None
    created_at: str

class AuthOut(BaseModel):
    token: str
    user: UserOut

class ChatTurnReq(BaseModel):
    session_id: str | None = None
    message: str

class ChatTurnRes(BaseModel):
    session_id: str
    reply: str

class SpeechAnalyzeReq(BaseModel):
    transcript: str
    context: str | None = None
    duration_seconds: int | None = None

class DebateStartReq(BaseModel):
    topic: str
    user_stance: str = "for"
    level: int = 2

class DebateTurnReq(BaseModel):
    debate_id: str
    user_argument: str

class InterviewStartReq(BaseModel):
    interview_type: str = "hr"

class InterviewAnswerReq(BaseModel):
    interview_id: str
    answer: str

class MissionCompleteReq(BaseModel):
    mission_id: str
    note: str | None = None

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any, Literal

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(utcnow().timestamp()),
        "exp": int((utcnow() + timedelta(days=JWT_EXPIRE_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = supabase.table("users").select("*").eq("id", uid).single().execute().data
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def user_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        level=u.get("level", 1),
        xp=u.get("xp", 0),
        streak_days=u.get("streak_days", 0),
        last_active=u.get("last_active"),
        created_at=u.get("created_at"),
    )

MENTOR_SYSTEM = (
    "You are 'Aether', an elite communication transformation mentor for ambitious "
    "college students and young professionals. You are calm, intelligent, professional, "
    "supportive, structured, honest, analytical and growth-oriented. You NEVER give "
    "generic motivational fluff. You give precise corrections, explain WHY problems "
    "happen, explain HOW to fix them with measurable steps, and assign concrete drills. "
    "Keep replies tight: 3–6 short paragraphs or a labelled bullet structure. Address "
    "the user by name when natural."
)

async def call_gemini(system: str, user_prompt: str, model: Optional[str] = None) -> str:
    response = await gemini_client.aio.models.generate_content(
        model=model or GEMINI_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=2048,
        ),
    )
    return response.text or ""

async def llm_json(system: str, prompt: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    try:
        response = await gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=2048,
                response_mime_type="application/json",
            ),
        )
        text = response.text or ""
        try:
            return json.loads(text)
        except Exception:
            pass
    except Exception:
        pass
    fallback = await call_gemini(system, prompt)
    start = fallback.find("{")
    end = fallback.rfind("}")
    if start != -1 and end != -1 and end > start:
        chunk = fallback[start : end + 1]
        try:
            return json.loads(chunk)
        except Exception:
            pass
    return {"_raw": fallback}

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

@app.get("/api/auth/google/url")
async def google_auth_url():
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return {"auth_url": f"{SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to={FRONTEND_URL}/auth/callback"}

@app.get("/api/auth/callback")
async def auth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            f"{SUPABASE_URL}/auth/v1/token",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            data={"provider": "google", "code": code}
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code")
        token_data = token_resp.json()
    
    access_token = token_data.get("access_token")
    user_data = token_data.get("user", {})
    
    uid = user_data.get("id")
    if not uid:
        raise HTTPException(status_code=400, detail="Failed to get user")
    
    db_user = supabase.table("users").select("*").eq("id", uid).single().execute().data
    
    if not db_user:
        db_user = {
            "id": uid,
            "email": user_data.get("email", ""),
            "name": user_data.get("user_metadata", {}).get("name", "Google User"),
            "level": 1,
            "xp": 0,
            "streak_days": 0,
            "created_at": utcnow().isoformat(),
        }
        supabase.table("users").insert(db_user).execute()
    
    return AuthOut(token=create_token(uid), user=user_to_out(db_user))

@app.post("/api/auth/signup", response_model=AuthOut)
async def signup(req: SignupReq):
    existing = supabase.table("users").select("id").eq("email", req.email.lower()).single().execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = new_id()
    user = {
        "id": uid,
        "email": req.email.lower(),
        "name": req.name.strip(),
        "password_hash": hash_password(req.password),
        "level": 1,
        "xp": 0,
        "streak_days": 1,
        "last_active": utcnow().isoformat(),
        "created_at": utcnow().isoformat(),
        "weaknesses": [],
    }
    supabase.table("users").insert(user).execute()
    return AuthOut(token=create_token(uid), user=user_to_out(user))

@app.post("/api/auth/login", response_model=AuthOut)
async def login(req: LoginReq):
    user = supabase.table("users").select("*").eq("email", req.email.lower()).single().execute().data
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    await _touch_streak(user)
    return AuthOut(token=create_token(user["id"]), user=user_to_out(user))

@app.get("/api/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user_to_out(user)

async def _touch_streak(user: dict):
    last = user.get("last_active")
    today = utcnow().date()
    new_streak = user.get("streak_days", 0)
    if last:
        try:
            last_d = datetime.fromisoformat(last).date()
            if last_d == today:
                pass
            elif (today - last_d).days == 1:
                new_streak += 1
            else:
                new_streak = 1
        except Exception:
            new_streak = max(1, new_streak)
    else:
        new_streak = 1
    supabase.table("users").update({
        "last_active": utcnow().isoformat(),
        "streak_days": new_streak
    }).eq("id", user["id"]).execute()
    user["streak_days"] = new_streak
    user["last_active"] = utcnow().isoformat()

async def _award_xp(user_id: str, xp: int) -> dict:
    user = supabase.table("users").select("*").eq("id", user_id).single().execute().data
    if not user:
        return {}
    new_xp = user.get("xp", 0) + xp
    new_level = 1 + new_xp // 250
    supabase.table("users").update({"xp": new_xp, "level": new_level}).eq("id", user_id).execute()
    return {"xp": new_xp, "level": new_level, "awarded": xp}

@app.post("/api/mentor/chat", response_model=ChatTurnRes)
async def mentor_chat(req: ChatTurnReq, user: dict = Depends(get_current_user)):
    sid = req.session_id or new_id()
    supabase.table("chat_messages").insert({
        "id": new_id(),
        "session_id": sid,
        "user_id": user["id"],
        "role": "user",
        "content": req.message,
        "created_at": utcnow().isoformat(),
    }).execute()
    history = supabase.table("chat_messages").select("*").eq("session_id", sid).eq("user_id", user["id"]).order("created_at", 1).limit(40).execute().data or []
    convo_brief = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history[-10:-1])
    system = f"{MENTOR_SYSTEM} The user's name is {user['name']}."
    prompt = (f"Prior context:\n{convo_brief}\n\n" if convo_brief else "") + f"User: {req.message}\n\nRespond as Aether."
    reply_text = await call_gemini(system, prompt)
    supabase.table("chat_messages").insert({
        "id": new_id(),
        "session_id": sid,
        "user_id": user["id"],
        "role": "assistant",
        "content": reply_text,
        "created_at": utcnow().isoformat(),
    }).execute()
    return ChatTurnRes(session_id=sid, reply=reply_text)

@app.get("/api/mentor/history")
async def mentor_history(session_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = supabase.table("chat_messages").select("*").eq("user_id", user["id"])
    if session_id:
        q = q.eq("session_id", session_id)
    msgs = q.order("created_at", 1).limit(500).execute().data or []
    return {"messages": msgs}

SPEECH_SYSTEM = (
    "You are an elite speech & communication analyst. Given a transcript of the user's "
    "speech, output STRICT JSON only (no prose, no markdown fence) with this schema: {"
    '"overall_score": int 0-100, "voice_score": int, "confidence_score": int, '
    '"body_language_score": int, "structure_score": int, "charisma_score": int, '
    '"assertiveness_score": int, "public_speaking_score": int, '
    '"strengths": [str], "weaknesses": [str], '
    '"mistakes": [{"quote": str, "issue": str, "fix": str}], '
    '"recommended_drills": [{"name": str, "why": str, "how": str}], '
    '"next_steps": [str], "headline": str (1-sentence verdict)}. '
    "Infer voice/body language signals from linguistic cues (filler words, hedging, "
    "run-on sentences, repetition, emotional intensity, pacing markers). Be precise, "
    "honest, never generic."
)

@app.post("/api/speech/analyze")
async def analyze_speech(req: SpeechAnalyzeReq, user: dict = Depends(get_current_user)):
    if len(req.transcript.strip()) < 20:
        raise HTTPException(status_code=400, detail="Transcript too short")
    prompt = (f"Context: {req.context or 'general speech'}\nDuration (s): {req.duration_seconds or 'unknown'}\nTranscript:\n\"\"\"\n{req.transcript.strip()}\n\"\"\"\n\nReturn STRICT JSON only.")
    data = await llm_json(SPEECH_SYSTEM, prompt)
    report_id = new_id()
    report = {
        "id": report_id,
        "user_id": user["id"],
        "type": "speech",
        "context": req.context,
        "transcript": req.transcript,
        "data": data,
        "created_at": utcnow().isoformat(),
    }
    supabase.table("reports").insert(report).execute()
    awarded = await _award_xp(user["id"], 30)
    return {"report": report, "xp": awarded}

@app.get("/api/speech/reports")
async def list_reports(user: dict = Depends(get_current_user)):
    reports = supabase.table("reports").select("*").eq("user_id", user["id"]).order("created_at", 1).limit(50).execute().data or []
    return {"reports": reports}

@app.get("/api/speech/reports/{report_id}")
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    r = supabase.table("reports").select("*").eq("id", report_id).eq("user_id", user["id"]).single().execute().data
    if not r:
        raise HTTPException(404, "Not found")
    return r

DEBATE_SYSTEM_TEMPLATE = (
    "You are 'Aether-Debate', an elite debate sparring partner & coach. The user takes "
    "the stance '{stance}' on the topic: '{topic}'. You take the OPPOSING stance and "
    "intelligently challenge them. Difficulty level {level}/6 — higher means sharper "
    "rebuttals, tighter cross-examination, faster pace, and more pressure. NEVER agree "
    "trivially. ALWAYS respond with STRICT JSON only: {{"
    '"opponent_reply": str (your debate response, 2-4 sentences, focused), '
    '"cross_examination": str (one sharp follow-up question), '
    '"coaching_tip": str (1 actionable, in-the-moment tip for the user), '
    '"fallacies_detected": [str] (names of any logical fallacies in the user turn), '
    '"turn_scores": {{"logic": 0-100, "persuasion": 0-100, "calmness": 0-100, "rebuttal": 0-100}}}}'
)

@app.post("/api/debate/start")
async def debate_start(req: DebateStartReq, user: dict = Depends(get_current_user)):
    did = new_id()
    doc = {
        "id": did,
        "user_id": user["id"],
        "topic": req.topic,
        "user_stance": req.user_stance,
        "ai_stance": "against" if req.user_stance == "for" else "for",
        "level": req.level,
        "turns": [],
        "created_at": utcnow().isoformat(),
        "finished": False,
    }
    supabase.table("debates").insert(doc).execute()
    system = DEBATE_SYSTEM_TEMPLATE.format(stance=req.user_stance, topic=req.topic, level=req.level)
    opener = await llm_json(system, "The debate is just starting. The user has not yet spoken. Open with a strong opposing thesis statement.")
    supabase.table("debates").update({"turns": [{"role": "ai", "data": opener, "ts": utcnow().isoformat()}]}).eq("id", did).execute()
    return {**doc, "turns": [opener]}

@app.post("/api/debate/turn")
async def debate_turn(req: DebateTurnReq, user: dict = Depends(get_current_user)):
    d = supabase.table("debates").select("*").eq("id", req.debate_id).eq("user_id", user["id"]).single().execute().data
    if not d:
        raise HTTPException(404, "Debate not found")
    system = DEBATE_SYSTEM_TEMPLATE.format(stance=d["user_stance"], topic=d["topic"], level=d["level"])
    history_lines = []
    for t in d.get("turns", [])[-6:]:
        if t["role"] == "ai":
            history_lines.append(f"AI: {t['data'].get('opponent_reply', '')}")
        else:
            history_lines.append(f"USER: {t.get('content', '')}")
    prompt = "Debate history (most recent last):\n" + "\n".join(history_lines) + f"\n\nNew USER turn:\n{req.user_argument}\n\nAnalyse the user's argument, respond as the opposing debater."
    data = await llm_json(system, prompt)
    d["turns"].append({"role": "user", "content": req.user_argument, "ts": utcnow().isoformat()})
    d["turns"].append({"role": "ai", "data": data, "ts": utcnow().isoformat()})
    supabase.table("debates").update({"turns": d["turns"]}).eq("id", req.debate_id).execute()
    awarded = await _award_xp(user["id"], 15)
    return {"debate_id": req.debate_id, "turn": data, "xp": awarded}

@app.post("/api/debate/{debate_id}/finish")
async def debate_finish(debate_id: str, user: dict = Depends(get_current_user)):
    d = supabase.table("debates").select("*").eq("id", debate_id).eq("user_id", user["id"]).single().execute().data
    if not d:
        raise HTTPException(404, "Debate not found")
    logic, persuasion, calm, rebuttal, count = 0, 0, 0, 0, 0
    fallacies = []
    for t in d.get("turns", []):
        if t["role"] == "ai":
            ts = t["data"].get("turn_scores") or {}
            if any(ts.values()):
                logic += ts.get("logic", 0)
                persuasion += ts.get("persuasion", 0)
                calm += ts.get("calmness", 0)
                rebuttal += ts.get("rebuttal", 0)
                count += 1
            fallacies.extend(t["data"].get("fallacies_detected", []) or [])
    avg = lambda v: int(v / count) if count else 0
    transcript = "\n".join((f"AI: {t['data'].get('opponent_reply', '')}" if t["role"] == "ai" else f"USER: {t.get('content', '')}") for t in d["turns"])
    summary = await llm_json("You are an elite debate coach. Produce STRICT JSON.", f"Topic: {d['topic']}\nUser stance: {d['user_stance']}\n\n{transcript}")
    result = {
        "logic": avg(logic), "persuasion": avg(persuasion), "calmness": avg(calm), "rebuttal": avg(rebuttal),
        "fallacies": list(set(fallacies)), "summary": summary
    }
    supabase.table("debates").update({"finished": True, "result": result}).eq("id", debate_id).execute()
    awarded = await _award_xp(user["id"], 60)
    return {"debate_id": debate_id, "result": result, "xp": awarded}

@app.get("/api/debate/{debate_id}")
async def debate_get(debate_id: str, user: dict = Depends(get_current_user)):
    d = supabase.table("debates").select("*").eq("id", debate_id).eq("user_id", user["id"]).single().execute().data
    if not d:
        raise HTTPException(404, "Not found")
    return d

@app.get("/api/debate")
async def debate_list(user: dict = Depends(get_current_user)):
    items = supabase.table("debates").select("*").eq("user_id", user["id"]).order("created_at", 1).limit(50).execute().data or []
    return {"debates": items}

@app.get("/api/debate/topics/suggest")
async def suggest_topics():
    return {"topics": ["Should social media be regulated for under-18 users?", "Is AI helping or harming student learning?", "Is discipline more important than motivation?", "Should college attendance be optional?", "Are grades overrated in measuring potential?", "Is remote work better than in-office work?", "Should startups prioritise growth over profitability?", "Is failure a better teacher than success?"]}

INTERVIEW_SYSTEM_TEMPLATE = (
    "You are 'Aether-Interview', conducting a {interview_type} mock interview. "
    "Ask one question at a time. After each user answer, provide a brief evaluation. "
    "Always return STRICT JSON only: {{"
    '"question": str (next question to ask, leave empty if interview ending), '
    '"evaluation": {{"clarity": 0-100, "confidence": 0-100, "structure": 0-100, '
    '"star_usage": 0-100, "notes": str (2-3 sentence honest critique)}}, '
    '"finished": bool}}'
)

@app.post("/api/interview/start")
async def interview_start(req: InterviewStartReq, user: dict = Depends(get_current_user)):
    iid = new_id()
    system = INTERVIEW_SYSTEM_TEMPLATE.format(interview_type=req.interview_type)
    opener = await llm_json(system, "Start the interview with a warm but professional opening question.")
    doc = {
        "id": iid, "user_id": user["id"], "type": req.interview_type,
        "turns": [{"role": "ai", "data": opener, "ts": utcnow().isoformat()}],
        "finished": False, "created_at": utcnow().isoformat()
    }
    supabase.table("interviews").insert(doc).execute()
    return doc

@app.post("/api/interview/answer")
async def interview_answer(req: InterviewAnswerReq, user: dict = Depends(get_current_user)):
    d = supabase.table("interviews").select("*").eq("id", req.interview_id).eq("user_id", user["id"]).single().execute().data
    if not d:
        raise HTTPException(404, "Not found")
    system = INTERVIEW_SYSTEM_TEMPLATE.format(interview_type=d["type"])
    history_lines = []
    for t in d.get("turns", [])[-6:]:
        if t["role"] == "ai":
            history_lines.append(f"INTERVIEWER: {t['data'].get('question', '')}")
        else:
            history_lines.append(f"CANDIDATE: {t.get('content', '')}")
    turn_count = sum(1 for t in d["turns"] if t["role"] == "user") + 1
    end_hint = " This is question 5 — wrap up the interview after evaluating; set finished=true and question to ''." if turn_count >= 5 else ""
    prompt = "Interview so far:\n" + "\n".join(history_lines) + f"\n\nCANDIDATE answer:\n{req.answer}\n\nEvaluate and ask the next question." + end_hint
    data = await llm_json(system, prompt)
    if turn_count >= 5:
        data["finished"] = True
        data["question"] = ""
    d["turns"].append({"role": "user", "content": req.answer, "ts": utcnow().isoformat()})
    d["turns"].append({"role": "ai", "data": data, "ts": utcnow().isoformat()})
    finished = bool(data.get("finished"))
    update = {"turns": d["turns"]}
    if finished:
        update["finished"] = True
    supabase.table("interviews").update(update).eq("id", req.interview_id).execute()
    awarded = await _award_xp(user["id"], 25 if not finished else 80)
    return {"interview_id": req.interview_id, "turn": data, "finished": finished, "xp": awarded}

@app.get("/api/interview/{interview_id}")
async def interview_get(interview_id: str, user: dict = Depends(get_current_user)):
    d = supabase.table("interviews").select("*").eq("id", interview_id).eq("user_id", user["id"]).single().execute().data
    if not d:
        raise HTTPException(404, "Not found")
    return d

SEED_MISSIONS = [
    {"slug": "mirror-3min", "title": "3-Minute Mirror Talk", "category": "Confidence", "duration_min": 3, "xp": 20, "description": "Speak to yourself in the mirror for 3 minutes about your day.", "framework": "Free-form"},
    {"slug": "pause-drill", "title": "3-Second Pause Drill", "category": "Pacing", "duration_min": 5, "xp": 25, "description": "Read a paragraph aloud, inserting a deliberate 3-second pause after every sentence.", "framework": "Pause control"},
]

@app.get("/api/missions/today")
async def missions_today(user: dict = Depends(get_current_user)):
    today = utcnow().date().isoformat()
    items = supabase.table("missions").select("*").eq("user_id", user["id"]).eq("date", today).order("created_at", 1).limit(20).execute().data or []
    if items:
        return {"missions": items}
    day_index = utcnow().toordinal()
    picks = [SEED_MISSIONS[(day_index + i) % len(SEED_MISSIONS)] for i in range(min(4, len(SEED_MISSIONS)))]
    docs = [{"id": new_id(), "user_id": user["id"], "date": today, "completed": False, "completed_at": None, **p} for p in picks]
    if docs:
        supabase.table("missions").insert(docs).execute()
    return {"missions": docs}

@app.post("/api/missions/complete")
async def missions_complete(req: MissionCompleteReq, user: dict = Depends(get_current_user)):
    m = supabase.table("missions").select("*").eq("id", req.mission_id).eq("user_id", user["id"]).single().execute().data
    if not m:
        raise HTTPException(404, "Mission not found")
    if m.get("completed"):
        return {"mission": m, "xp": {"awarded": 0}}
    supabase.table("missions").update({"completed": True, "completed_at": utcnow().isoformat(), "note": req.note}).eq("id", req.mission_id).execute()
    await _touch_streak(await supabase.table("users").select("*").eq("id", user["id"]).single().execute().data)
    awarded = await _award_xp(user["id"], int(m.get("xp", 20)))
    m["completed"] = True
    m["completed_at"] = utcnow().isoformat()
    return {"mission": m, "xp": awarded}

@app.get("/api/dashboard/stats")
async def dashboard(user: dict = Depends(get_current_user)):
    today = utcnow().date().isoformat()
    today_missions = supabase.table("missions").select("*").eq("user_id", user["id"]).eq("date", today).execute().data or []
    done = sum(1 for m in today_missions if m.get("completed"))
    recent = supabase.table("reports").select("created_at,data").eq("user_id", user["id"]).order("created_at", 1).limit(10).execute().data or []
    trend = []
    for r in reversed(recent):
        d = r.get("data") or {}
        trend.append({"date": r.get("created_at"), "overall": d.get("overall_score", 0), "confidence": d.get("confidence_score", 0), "structure": d.get("structure_score", 0), "voice": d.get("voice_score", 0)})
    latest = trend[-1] if trend else {"overall": 0, "confidence": 0, "structure": 0, "voice": 0}
    debate_count = supabase.table("debates").count().eq("user_id", user["id"]).execute().count or 0
    interview_count = supabase.table("interviews").count().eq("user_id", user["id"]).execute().count or 0
    return {
        "user": user_to_out(user).dict(),
        "today": {"missions_total": len(today_missions), "missions_done": done, "missions": today_missions},
        "scores": latest, "trend": trend,
        "totals": {"debates": debate_count, "interviews": interview_count, "reports": len(recent)},
    }

@app.get("/")
async def root():
    return {"service": "Elite Communication Mentor", "status": "ok"}

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown():
    pass