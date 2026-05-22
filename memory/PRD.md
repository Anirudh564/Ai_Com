# Aether — Elite Communication Mentor (PRD v1)

## Vision
An AI-powered communication transformation mentor mobile app for ambitious college students and young professionals. Acts as a real elite coach — never generic, always precise.

## Stack
- Frontend: Expo SDK 54, React Native, expo-router (file-based routing)
- Backend: FastAPI (Python)
- DB: MongoDB
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via emergentintegrations + Emergent Universal LLM Key
- Auth: JWT (bcrypt) — email/password

## MVP Features (shipped)
- **Auth** — Signup, login, JWT-protected APIs, persistent secure token storage
- **Dashboard (Home)** — Streak ring, XP bar, level, today's missions, latest scores, totals
- **Train tab** — Daily missions (8 seed drills rotating by date), categories, completion + XP
- **Debate Arena** — Topics, stance toggle (for/against), 6 difficulty levels, live turns with Claude opponent, per-turn fallacy detection, in-the-moment coaching tip, cross-examination, final debate scorecard (logic, persuasion, calmness, rebuttal)
- **Analyze Speech** — Paste transcript + context + duration → AI scorecard (8 score axes), strengths, weaknesses, mistake quotes with fixes, recommended drills, next steps
- **Mentor Chat (Aether)** — Multi-turn Claude conversation, persistent session via secure storage, new session reset
- **Mock Interview** — 5 types (HR/college/leadership/internship/stress), 5-question simulated session with per-answer evaluation (clarity/confidence/structure/STAR usage)
- **Mission detail screen** — Instructions + how-to-do-well + mark complete (+XP, streak update)
- **Feedback detail screen** — Full scorecard rendering
- **Design** — "Elite Obsidian" dark theme, zinc base, electric blue accent, amber XP, emerald success, rose critique

## Key API Endpoints
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/mentor/chat`, `GET /api/mentor/history`
- `POST /api/speech/analyze`, `GET /api/speech/reports`, `GET /api/speech/reports/{id}`
- `POST /api/debate/start`, `POST /api/debate/turn`, `POST /api/debate/{id}/finish`, `GET /api/debate/{id}`, `GET /api/debate`, `GET /api/debate/topics/suggest`
- `POST /api/interview/start`, `POST /api/interview/answer`, `GET /api/interview/{id}`
- `GET /api/missions/today`, `POST /api/missions/complete`
- `GET /api/dashboard/stats`

## Roadmap (deferred from MVP)
- Audio/video file upload + Whisper transcription pipeline → speech analyze
- On-device body language analysis (MediaPipe)
- PDF curriculum upload + RAG-based drill extraction
- Analytics charts (line/heatmap) with trend graphs
- Logical fallacy library deep-dive
- Onboarding flow (weakness self-assessment)
- Push notifications for streaks
- Privacy controls panel + data export/delete
- Group discussion simulation
