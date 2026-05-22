"""
Elite Communication Mentor - FastAPI backend.

Provides JWT auth, AI mentor chat, speech analysis, AI debate sessions,
mock interviews, daily missions and a progress dashboard. All AI is powered
by Claude Sonnet 4.5 through the EMERGENT_LLM_KEY via emergentintegrations.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
JWT_EXPIRE_DAYS = 30

CLAUDE_PROVIDER = "anthropic"
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Elite Communication Mentor API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("ecm")

security = HTTPBearer(auto_error=False)


# ---------------- Models ----------------
def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class SignupReq(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    level: int
    xp: int
    streak_days: int
    last_active: Optional[str] = None
    created_at: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class ChatTurnReq(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatTurnRes(BaseModel):
    session_id: str
    reply: str


class SpeechAnalyzeReq(BaseModel):
    transcript: str
    context: Optional[str] = None  # e.g. "impromptu", "interview", "presentation"
    duration_seconds: Optional[int] = None


class DebateStartReq(BaseModel):
    topic: str
    user_stance: Literal["for", "against"] = "for"
    level: int = Field(default=2, ge=1, le=6)


class DebateTurnReq(BaseModel):
    debate_id: str
    user_argument: str


class InterviewStartReq(BaseModel):
    interview_type: Literal["hr", "college", "leadership", "internship", "stress"] = "hr"


class InterviewAnswerReq(BaseModel):
    interview_id: str
    answer: str


class MissionCompleteReq(BaseModel):
    mission_id: str
    note: Optional[str] = None


# ---------------- Auth helpers ----------------
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
    user = await db.users.find_one({"id": uid}, {"_id": 0})
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


# ---------------- LLM helpers ----------------
MENTOR_SYSTEM = (
    "You are 'Aether', an elite communication transformation mentor for ambitious "
    "college students and young professionals. You are calm, intelligent, professional, "
    "supportive, structured, honest, analytical and growth-oriented. You NEVER give "
    "generic motivational fluff. You give precise corrections, explain WHY problems "
    "happen, explain HOW to fix them with measurable steps, and assign concrete drills. "
    "Keep replies tight: 3–6 short paragraphs or a labelled bullet structure. Address "
    "the user by name when natural."
)


def make_chat(system: str, session_id: str, model: str = CLAUDE_MODEL) -> LlmChat:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system)
    chat.with_model(CLAUDE_PROVIDER, model)
    return chat


async def llm_json(system: str, prompt: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    """Ask the LLM for strict JSON and parse it. Falls back gracefully."""
    chat = make_chat(system, session_id or new_id())
    raw = await chat.send_message(UserMessage(text=prompt))
    text = raw if isinstance(raw, str) else str(raw)
    # Extract JSON block defensively
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        chunk = text[start : end + 1]
        try:
            return json.loads(chunk)
        except Exception:
            pass
    return {"_raw": text}


# ---------------- Auth endpoints ----------------
@api.post("/auth/signup", response_model=AuthOut)
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
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
    await db.users.insert_one(user)
    user.pop("_id", None)
    return AuthOut(token=create_token(uid), user=user_to_out(user))


@api.post("/auth/login", response_model=AuthOut)
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    await _touch_streak(user)
    return AuthOut(token=create_token(user["id"]), user=user_to_out(user))


@api.get("/auth/me", response_model=UserOut)
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
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_active": utcnow().isoformat(), "streak_days": new_streak}},
    )
    user["streak_days"] = new_streak
    user["last_active"] = utcnow().isoformat()


async def _award_xp(user_id: str, xp: int) -> dict:
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {}
    new_xp = user.get("xp", 0) + xp
    new_level = 1 + new_xp // 250
    await db.users.update_one({"id": user_id}, {"$set": {"xp": new_xp, "level": new_level}})
    return {"xp": new_xp, "level": new_level, "awarded": xp}


# ---------------- Mentor Chat ----------------
@api.post("/mentor/chat", response_model=ChatTurnRes)
async def mentor_chat(req: ChatTurnReq, user: dict = Depends(get_current_user)):
    sid = req.session_id or new_id()
    # Persist user msg
    await db.chat_messages.insert_one({
        "id": new_id(),
        "session_id": sid,
        "user_id": user["id"],
        "role": "user",
        "content": req.message,
        "created_at": utcnow().isoformat(),
    })
    # Build context: pull last 20 messages for this session
    history = await db.chat_messages.find(
        {"session_id": sid, "user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(40)
    convo_brief = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-10:-1]
    )
    system = (
        f"{MENTOR_SYSTEM} The user's name is {user['name']}."
        " Use the prior conversation context if provided to stay coherent."
    )
    prompt = (
        (f"Prior context:\n{convo_brief}\n\n" if convo_brief else "")
        + f"User: {req.message}\n\nRespond as Aether."
    )
    chat = make_chat(system, sid)
    reply = await chat.send_message(UserMessage(text=prompt))
    reply_text = reply if isinstance(reply, str) else str(reply)
    await db.chat_messages.insert_one({
        "id": new_id(),
        "session_id": sid,
        "user_id": user["id"],
        "role": "assistant",
        "content": reply_text,
        "created_at": utcnow().isoformat(),
    })
    return ChatTurnRes(session_id=sid, reply=reply_text)


@api.get("/mentor/history")
async def mentor_history(session_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {"user_id": user["id"]}
    if session_id:
        q["session_id"] = session_id
    msgs = await db.chat_messages.find(q, {"_id": 0}).sort("created_at", 1).to_list(500)
    return {"messages": msgs}


# ---------------- Speech Analysis ----------------
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


@api.post("/speech/analyze")
async def analyze_speech(req: SpeechAnalyzeReq, user: dict = Depends(get_current_user)):
    if len(req.transcript.strip()) < 20:
        raise HTTPException(status_code=400, detail="Transcript too short")
    prompt = (
        f"Context: {req.context or 'general speech'}\n"
        f"Duration (s): {req.duration_seconds or 'unknown'}\n"
        f"Transcript:\n\"\"\"\n{req.transcript.strip()}\n\"\"\"\n\n"
        "Return STRICT JSON only."
    )
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
    await db.reports.insert_one(report)
    awarded = await _award_xp(user["id"], 30)
    report.pop("_id", None)
    return {"report": report, "xp": awarded}


@api.get("/speech/reports")
async def list_reports(user: dict = Depends(get_current_user)):
    reports = await db.reports.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"reports": reports}


@api.get("/speech/reports/{report_id}")
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    r = await db.reports.find_one({"id": report_id, "user_id": user["id"]}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Not found")
    return r


# ---------------- Debate Engine ----------------
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


@api.post("/debate/start")
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
    await db.debates.insert_one(doc)
    # AI opens with a challenge
    system = DEBATE_SYSTEM_TEMPLATE.format(
        stance=req.user_stance, topic=req.topic, level=req.level
    )
    opener = await llm_json(
        system,
        "The debate is just starting. The user has not yet spoken. Open with a strong "
        "opposing thesis statement (opponent_reply), one cross-examination question "
        "directed at the user's stance, an initial coaching_tip for how to respond, "
        "fallacies_detected = [], and turn_scores all set to 0.",
        session_id=did,
    )
    doc["turns"].append({"role": "ai", "data": opener, "ts": utcnow().isoformat()})
    await db.debates.update_one({"id": did}, {"$set": {"turns": doc["turns"]}})
    doc.pop("_id", None)
    return doc


@api.post("/debate/turn")
async def debate_turn(req: DebateTurnReq, user: dict = Depends(get_current_user)):
    d = await db.debates.find_one({"id": req.debate_id, "user_id": user["id"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Debate not found")
    system = DEBATE_SYSTEM_TEMPLATE.format(
        stance=d["user_stance"], topic=d["topic"], level=d["level"]
    )
    # Build short history
    history_lines = []
    for t in d["turns"][-6:]:
        if t["role"] == "ai":
            history_lines.append(f"AI: {t['data'].get('opponent_reply', '')}")
        else:
            history_lines.append(f"USER: {t.get('content', '')}")
    prompt = (
        "Debate history (most recent last):\n"
        + "\n".join(history_lines)
        + f"\n\nNew USER turn:\n{req.user_argument}\n\n"
        "Analyse the user's argument, respond as the opposing debater, and return STRICT JSON only."
    )
    data = await llm_json(system, prompt, session_id=req.debate_id)
    d["turns"].append({"role": "user", "content": req.user_argument, "ts": utcnow().isoformat()})
    d["turns"].append({"role": "ai", "data": data, "ts": utcnow().isoformat()})
    await db.debates.update_one({"id": req.debate_id}, {"$set": {"turns": d["turns"]}})
    awarded = await _award_xp(user["id"], 15)
    return {"debate_id": req.debate_id, "turn": data, "xp": awarded}


@api.post("/debate/{debate_id}/finish")
async def debate_finish(debate_id: str, user: dict = Depends(get_current_user)):
    d = await db.debates.find_one({"id": debate_id, "user_id": user["id"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Debate not found")
    # Aggregate scores
    logic, persuasion, calm, rebuttal, count = 0, 0, 0, 0, 0
    fallacies = []
    for t in d["turns"]:
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
    summary_system = (
        "You are an elite debate coach. Given the debate transcript, produce STRICT JSON: {"
        '"debate_score": int 0-100, "verdict": str (1 sentence), '
        '"top_strengths": [str], "top_weaknesses": [str], '
        '"transformation_focus": [str] (3 concrete drills to assign)}'
    )
    transcript = "\n".join(
        (f"AI: {t['data'].get('opponent_reply', '')}" if t["role"] == "ai"
         else f"USER: {t.get('content', '')}")
        for t in d["turns"]
    )
    summary = await llm_json(
        summary_system,
        f"Topic: {d['topic']}\nUser stance: {d['user_stance']}\n\n{transcript}",
    )
    result = {
        "logic": avg(logic),
        "persuasion": avg(persuasion),
        "calmness": avg(calm),
        "rebuttal": avg(rebuttal),
        "fallacies": list(set(fallacies)),
        "summary": summary,
    }
    await db.debates.update_one(
        {"id": debate_id}, {"$set": {"finished": True, "result": result}}
    )
    awarded = await _award_xp(user["id"], 60)
    return {"debate_id": debate_id, "result": result, "xp": awarded}


@api.get("/debate/{debate_id}")
async def debate_get(debate_id: str, user: dict = Depends(get_current_user)):
    d = await db.debates.find_one({"id": debate_id, "user_id": user["id"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Not found")
    return d


@api.get("/debate")
async def debate_list(user: dict = Depends(get_current_user)):
    items = await db.debates.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"debates": items}


@api.get("/debate/topics/suggest")
async def suggest_topics():
    return {
        "topics": [
            "Should social media be regulated for under-18 users?",
            "Is AI helping or harming student learning?",
            "Is discipline more important than motivation?",
            "Should college attendance be optional?",
            "Are grades overrated in measuring potential?",
            "Is remote work better than in-office work?",
            "Should startups prioritise growth over profitability?",
            "Is failure a better teacher than success?",
        ]
    }


# ---------------- Mock Interview ----------------
INTERVIEW_SYSTEM_TEMPLATE = (
    "You are 'Aether-Interview', conducting a {interview_type} mock interview. "
    "Ask one question at a time. After each user answer, provide a brief evaluation. "
    "Always return STRICT JSON only: {{"
    '"question": str (next question to ask, leave empty if interview ending), '
    '"evaluation": {{"clarity": 0-100, "confidence": 0-100, "structure": 0-100, '
    '"star_usage": 0-100, "notes": str (2-3 sentence honest critique)}}, '
    '"finished": bool}}'
)


@api.post("/interview/start")
async def interview_start(req: InterviewStartReq, user: dict = Depends(get_current_user)):
    iid = new_id()
    system = INTERVIEW_SYSTEM_TEMPLATE.format(interview_type=req.interview_type)
    opener = await llm_json(
        system,
        "Start the interview with a warm but professional opening question. "
        "Set evaluation scores all to 0 and notes to 'Interview started.', finished=false.",
        session_id=iid,
    )
    doc = {
        "id": iid,
        "user_id": user["id"],
        "type": req.interview_type,
        "turns": [{"role": "ai", "data": opener, "ts": utcnow().isoformat()}],
        "finished": False,
        "created_at": utcnow().isoformat(),
    }
    await db.interviews.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/interview/answer")
async def interview_answer(req: InterviewAnswerReq, user: dict = Depends(get_current_user)):
    d = await db.interviews.find_one({"id": req.interview_id, "user_id": user["id"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Not found")
    system = INTERVIEW_SYSTEM_TEMPLATE.format(interview_type=d["type"])
    history_lines = []
    for t in d["turns"][-6:]:
        if t["role"] == "ai":
            history_lines.append(f"INTERVIEWER: {t['data'].get('question', '')}")
        else:
            history_lines.append(f"CANDIDATE: {t.get('content', '')}")
    turn_count = sum(1 for t in d["turns"] if t["role"] == "user") + 1
    end_hint = (
        " This is question 5 — wrap up the interview after evaluating; set finished=true and question to ''."
        if turn_count >= 5 else ""
    )
    prompt = (
        "Interview so far:\n" + "\n".join(history_lines)
        + f"\n\nCANDIDATE answer:\n{req.answer}\n\nEvaluate and ask the next question." + end_hint
    )
    data = await llm_json(system, prompt, session_id=req.interview_id)
    # Deterministic server-side finish after 5th user answer (don't rely on the LLM)
    if turn_count >= 5:
        data["finished"] = True
        data["question"] = ""
    d["turns"].append({"role": "user", "content": req.answer, "ts": utcnow().isoformat()})
    d["turns"].append({"role": "ai", "data": data, "ts": utcnow().isoformat()})
    finished = bool(data.get("finished"))
    update = {"turns": d["turns"]}
    if finished:
        update["finished"] = True
    await db.interviews.update_one({"id": req.interview_id}, {"$set": update})
    awarded = await _award_xp(user["id"], 25 if not finished else 80)
    return {"interview_id": req.interview_id, "turn": data, "finished": finished, "xp": awarded}


@api.get("/interview/{interview_id}")
async def interview_get(interview_id: str, user: dict = Depends(get_current_user)):
    d = await db.interviews.find_one({"id": interview_id, "user_id": user["id"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Not found")
    return d


# ---------------- Daily Missions ----------------
SEED_MISSIONS = [
    {"slug": "mirror-3min", "title": "3-Minute Mirror Talk", "category": "Confidence",
     "duration_min": 3, "xp": 20,
     "description": "Speak to yourself in the mirror for 3 minutes about your day. Watch your eyes — keep contact.",
     "framework": "Free-form"},
    {"slug": "pause-drill", "title": "3-Second Pause Drill", "category": "Pacing",
     "duration_min": 5, "xp": 25,
     "description": "Read a paragraph aloud, inserting a deliberate 3-second pause after every sentence.",
     "framework": "Pause control"},
    {"slug": "prep-story", "title": "PREP Story", "category": "Structure",
     "duration_min": 5, "xp": 30,
     "description": "Tell a 90-second story about a recent challenge using Point → Reason → Example → Point.",
     "framework": "PREP"},
    {"slug": "filler-hunt", "title": "Filler-Word Hunt", "category": "Articulation",
     "duration_min": 4, "xp": 20,
     "description": "Record yourself answering 'Tell me about yourself'. Count every 'um/uh/like/you know'.",
     "framework": "Self-audit"},
    {"slug": "assert-no", "title": "Assertive No Practice", "category": "Assertiveness",
     "duration_min": 4, "xp": 25,
     "description": "Practice 5 ways to say 'no' firmly without apologising. Vary tone and posture.",
     "framework": "Acknowledge + Hold"},
    {"slug": "modulation", "title": "Voice Modulation Drill", "category": "Voice",
     "duration_min": 5, "xp": 25,
     "description": "Read a news headline 3 ways: monotone, then with rising urgency, then with calm authority.",
     "framework": "Tonal range"},
    {"slug": "star-answer", "title": "STAR Interview Answer", "category": "Interview",
     "duration_min": 6, "xp": 30,
     "description": "Answer 'Tell me about a conflict you handled' using Situation → Task → Action → Result.",
     "framework": "STAR"},
    {"slug": "disagreement", "title": "Calm Disagreement Drill", "category": "Debate",
     "duration_min": 5, "xp": 30,
     "description": "Pick a statement you disagree with. Respond calmly using 'I see your point, and …'.",
     "framework": "Acknowledge + Hold"},
]


async def _ensure_user_missions_today(user_id: str) -> List[dict]:
    today = utcnow().date().isoformat()
    existing = await db.missions.find(
        {"user_id": user_id, "date": today}, {"_id": 0}
    ).to_list(20)
    if existing:
        return existing
    # Choose 4 missions deterministically rotating by day
    day_index = utcnow().toordinal()
    picks = [SEED_MISSIONS[(day_index + i) % len(SEED_MISSIONS)] for i in range(4)]
    docs = []
    for p in picks:
        docs.append({
            "id": new_id(),
            "user_id": user_id,
            "date": today,
            "completed": False,
            "completed_at": None,
            **p,
        })
    if docs:
        await db.missions.insert_many([d.copy() for d in docs])
    return docs


@api.get("/missions/today")
async def missions_today(user: dict = Depends(get_current_user)):
    items = await _ensure_user_missions_today(user["id"])
    for i in items:
        i.pop("_id", None)
    return {"missions": items}


@api.post("/missions/complete")
async def missions_complete(req: MissionCompleteReq, user: dict = Depends(get_current_user)):
    m = await db.missions.find_one({"id": req.mission_id, "user_id": user["id"]}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Mission not found")
    if m.get("completed"):
        return {"mission": m, "xp": {"awarded": 0}}
    await db.missions.update_one(
        {"id": req.mission_id},
        {"$set": {"completed": True, "completed_at": utcnow().isoformat(), "note": req.note}},
    )
    await _touch_streak(await db.users.find_one({"id": user["id"]}, {"_id": 0}))
    awarded = await _award_xp(user["id"], int(m.get("xp", 20)))
    m["completed"] = True
    m["completed_at"] = utcnow().isoformat()
    return {"mission": m, "xp": awarded}


# ---------------- Dashboard ----------------
@api.get("/dashboard/stats")
async def dashboard(user: dict = Depends(get_current_user)):
    today_missions = await _ensure_user_missions_today(user["id"])
    done = sum(1 for m in today_missions if m.get("completed"))
    # Latest 5 reports for trend — project only fields needed for trend rendering
    recent = await db.reports.find(
        {"user_id": user["id"]},
        {
            "_id": 0,
            "created_at": 1,
            "data.overall_score": 1,
            "data.confidence_score": 1,
            "data.structure_score": 1,
            "data.voice_score": 1,
        },
    ).sort("created_at", -1).to_list(10)
    trend = []
    for r in reversed(recent):
        d = r.get("data") or {}
        trend.append({
            "date": r.get("created_at"),
            "overall": d.get("overall_score", 0),
            "confidence": d.get("confidence_score", 0),
            "structure": d.get("structure_score", 0),
            "voice": d.get("voice_score", 0),
        })
    # Latest scores snapshot
    latest = trend[-1] if trend else {"overall": 0, "confidence": 0, "structure": 0, "voice": 0}
    debate_count = await db.debates.count_documents({"user_id": user["id"]})
    interview_count = await db.interviews.count_documents({"user_id": user["id"]})
    return {
        "user": user_to_out(user).dict(),
        "today": {
            "missions_total": len(today_missions),
            "missions_done": done,
            "missions": today_missions,
        },
        "scores": latest,
        "trend": trend,
        "totals": {
            "debates": debate_count,
            "interviews": interview_count,
            "reports": len(recent),
        },
    }


# ---------------- Misc ----------------
@api.get("/")
async def root():
    return {"service": "Elite Communication Mentor", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
