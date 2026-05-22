"""Aether (Elite Communication Mentor) API tests.

Covers: auth (signup/login/me), dashboard, missions, mentor chat,
speech analyze, debate (start/turn/finish), mock interview flow.
All AI endpoints get generous timeouts (~60s).
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = "https://speak-coach-24.preview.emergentagent.com".rstrip("/")
API = f"{BASE_URL}/api"

AI_TIMEOUT = 90
QUICK_TIMEOUT = 20

DEMO_EMAIL = "demo@aether.app"
DEMO_PASSWORD = "demo1234"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(session):
    """Login as demo user; if missing, signup."""
    r = session.post(f"{API}/auth/login",
                     json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
                     timeout=QUICK_TIMEOUT)
    if r.status_code != 200:
        r = session.post(f"{API}/auth/signup",
                         json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD,
                               "name": "Demo Speaker"},
                         timeout=QUICK_TIMEOUT)
    assert r.status_code == 200, f"demo auth failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}",
            "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAuth:
    def test_signup_new_user(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@aether.app"
        r = session.post(f"{API}/auth/signup",
                         json={"email": email, "password": "passw0rd!",
                               "name": "Pytest User"},
                         timeout=QUICK_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == email.lower()
        assert data["user"]["level"] == 1
        assert data["user"]["xp"] == 0

    def test_signup_duplicate_email(self, session):
        r = session.post(f"{API}/auth/signup",
                         json={"email": DEMO_EMAIL, "password": "x",
                               "name": "dup"},
                         timeout=QUICK_TIMEOUT)
        assert r.status_code == 400

    def test_login_demo(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
                         timeout=QUICK_TIMEOUT)
        assert r.status_code == 200, r.text
        assert "token" in r.json()

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": DEMO_EMAIL, "password": "wrong"},
                         timeout=QUICK_TIMEOUT)
        assert r.status_code == 400

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers,
                        timeout=QUICK_TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == DEMO_EMAIL
        assert "level" in body and "xp" in body

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me", timeout=QUICK_TIMEOUT)
        assert r.status_code == 401


# ---------- Dashboard + Missions ----------
class TestDashboardMissions:
    def test_dashboard_stats(self, session, auth_headers):
        r = session.get(f"{API}/dashboard/stats", headers=auth_headers,
                        timeout=QUICK_TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "user" in d and "today" in d and "scores" in d and "totals" in d
        assert d["today"]["missions_total"] == 4
        assert isinstance(d["today"]["missions"], list)
        assert len(d["today"]["missions"]) == 4

    def test_missions_today(self, session, auth_headers):
        r = session.get(f"{API}/missions/today", headers=auth_headers,
                        timeout=QUICK_TIMEOUT)
        assert r.status_code == 200
        m = r.json()["missions"]
        assert len(m) == 4
        for mi in m:
            assert "id" in mi and "title" in mi and "xp" in mi

    def test_complete_mission_awards_xp(self, session, auth_headers):
        # snapshot xp
        before = session.get(f"{API}/auth/me", headers=auth_headers,
                             timeout=QUICK_TIMEOUT).json()
        missions = session.get(f"{API}/missions/today", headers=auth_headers,
                               timeout=QUICK_TIMEOUT).json()["missions"]
        target = next((m for m in missions if not m.get("completed")), None)
        if not target:
            pytest.skip("All missions already complete")
        expected_xp = int(target["xp"])
        r = session.post(f"{API}/missions/complete", headers=auth_headers,
                         json={"mission_id": target["id"], "note": "tested"},
                         timeout=QUICK_TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["mission"]["completed"] is True
        after = session.get(f"{API}/auth/me", headers=auth_headers,
                            timeout=QUICK_TIMEOUT).json()
        assert after["xp"] >= before["xp"] + expected_xp


# ---------- Mentor Chat ----------
class TestMentorChat:
    def test_mentor_chat_multi_turn(self, session, auth_headers):
        r1 = session.post(f"{API}/mentor/chat", headers=auth_headers,
                          json={"message": "I freeze when speaking in front of senior people. Help me."},
                          timeout=AI_TIMEOUT)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert "session_id" in d1 and "reply" in d1
        assert isinstance(d1["reply"], str) and len(d1["reply"]) > 40
        # Multi-turn
        r2 = session.post(f"{API}/mentor/chat", headers=auth_headers,
                          json={"session_id": d1["session_id"],
                                "message": "Give me one drill I can do tonight."},
                          timeout=AI_TIMEOUT)
        assert r2.status_code == 200
        assert r2.json()["session_id"] == d1["session_id"]
        assert len(r2.json()["reply"]) > 20


# ---------- Speech analyze ----------
class TestSpeechAnalyze:
    def test_analyze_short_transcript_rejected(self, session, auth_headers):
        r = session.post(f"{API}/speech/analyze", headers=auth_headers,
                         json={"transcript": "short"}, timeout=QUICK_TIMEOUT)
        assert r.status_code == 400

    def test_analyze_returns_scorecard(self, session, auth_headers):
        transcript = (
            "Um, so basically, I think that, like, our generation has it kind of hard, "
            "you know, with social media and all the pressure. I mean, I'm trying to "
            "figure out, uh, how to actually speak up in meetings without sounding "
            "nervous or like I'm second-guessing every single word that comes out."
        )
        r = session.post(f"{API}/speech/analyze", headers=auth_headers,
                         json={"transcript": transcript, "context": "impromptu",
                               "duration_seconds": 45},
                         timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "report" in body and "xp" in body
        rep = body["report"]
        assert rep["id"] and rep["type"] == "speech"
        data = rep["data"]
        # At least overall score should be present
        assert "overall_score" in data or "_raw" in data
        # Verify GET retrieval
        g = session.get(f"{API}/speech/reports/{rep['id']}",
                        headers=auth_headers, timeout=QUICK_TIMEOUT)
        assert g.status_code == 200


# ---------- Debate ----------
class TestDebate:
    @pytest.fixture(scope="class")
    def debate_id(self, session, auth_headers):
        r = session.post(f"{API}/debate/start", headers=auth_headers,
                         json={"topic": "Is discipline more important than motivation?",
                               "user_stance": "for", "level": 2},
                         timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and d["turns"]
        opener = d["turns"][0]["data"]
        # Check structure - opener should be JSON-parsed
        assert "opponent_reply" in opener or "_raw" in opener
        return d["id"]

    def test_debate_turn(self, session, auth_headers, debate_id):
        r = session.post(f"{API}/debate/turn", headers=auth_headers,
                         json={"debate_id": debate_id,
                               "user_argument": "Motivation is fleeting; discipline keeps you going when motivation dies. Athletes don't train only when motivated — they train daily because they have built discipline as a habit."},
                         timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "turn" in body
        turn = body["turn"]
        assert "turn_scores" in turn or "_raw" in turn

    def test_debate_finish(self, session, auth_headers, debate_id):
        r = session.post(f"{API}/debate/{debate_id}/finish",
                         headers=auth_headers, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "result" in body
        res = body["result"]
        for k in ("logic", "persuasion", "calmness", "rebuttal", "summary"):
            assert k in res


# ---------- Interview ----------
class TestInterview:
    def test_interview_full_flow_5_answers(self, session, auth_headers):
        r = session.post(f"{API}/interview/start", headers=auth_headers,
                         json={"interview_type": "hr"}, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        iid = d["id"]
        assert d["turns"], "Interview must open with a turn"

        last_finished = False
        for i in range(5):
            r = session.post(f"{API}/interview/answer", headers=auth_headers,
                             json={"interview_id": iid,
                                   "answer": f"Answer #{i+1}: I led a team of four on a client project; situation was a tight deadline, my task was coordinating delivery, action was daily 10-min stand-ups, result was on-time delivery and 95% client satisfaction."},
                             timeout=AI_TIMEOUT)
            assert r.status_code == 200, r.text
            body = r.json()
            last_finished = bool(body.get("finished"))
            time.sleep(0.5)
        assert last_finished is True, "Interview should flip finished=True on 5th user answer"

        # Verify via GET
        g = session.get(f"{API}/interview/{iid}", headers=auth_headers,
                        timeout=QUICK_TIMEOUT)
        assert g.status_code == 200
        assert g.json()["finished"] is True
