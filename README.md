# Elite Communication Mentor (Aether)

**A fully-free AI communication coach for students & young professionals.**

---

## Project Summary

A modern web application built with Next.js that provides:

- **AI Mentor Chat**: Conversational coaching with Aether (Gemini-powered)
- **Speech Analysis**: AI-powered transcript analysis with detailed feedback
- **Debate Sparring**: Real-time debate practice with AI opponent
- **Mock Interviews**: HR, college, leadership, internship, and stress interviews
- **Daily Missions**: Structured communication drills with XP/streaks
- **Progress Dashboard**: Track scores and improvement trends

**Tech Stack:**
- Frontend: Next.js 15 + Tailwind CSS + ShadCN UI
- Backend: FastAPI + MongoDB (or Supabase) + Google Gemini (free tier)
- Deployment: Vercel (frontend), Render/Railway (backend)

### Features

| Feature | Description |
|---------|-------------|
| **AI Mentor Chat** | Chat with Aether, your personalized communication coach |
| **Speech Analysis** | Upload transcripts for detailed feedback on voice, structure, confidence |
| **Debate Sparring** | Practice arguments against an AI opponent with fallacies detection |
| **Mock Interviews** | 5-question interview simulations (HR, college, leadership, etc.) |
| **Daily Missions** | 4 rotating daily drills (confidence, pacing, structure, articulation) |
| **XP & Streaks** | Earn points, level up, and maintain daily streaks |
| **Progress Dashboard** | Track metrics and improvement over time |

### Daily Missions (Examples)

- 3-Minute Mirror Talk (Confidence)
- Pause Drill (Pacing)
- PREP Story (Structure)
- Filler-Word Hunt (Articulation)
- Voice Modulation (Tone control)
- STAR Interview Answer (Interview prep)

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** + **npm**
- **MongoDB** (local or MongoDB Atlas)
- **Google Gemini API Key** (completely free generous tier) → https://aistudio.google.com/app/apikey

---

## Quick Start (Web Application)

### 1. Clone the repository

```bash
git clone https://github.com/Anirudh564/Ai_Com.git
cd Ai_Com
```

### 2. Backend Setup (Required for AI features)

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Create venv + install
python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload --port 8000
```

Backend will run at **http://localhost:8000**

### 3. Frontend Setup

```bash
cd web
cp .env.example .env
# Edit .env with your backend URL

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Getting a Free Gemini API Key (Required for AI features)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account (free)
3. Click **"Create API key"** (no credit card required)
4. Copy the key (starts with `AIzaSy...`)
5. Paste it into `backend/.env` as `GEMINI_API_KEY`

The app uses **gemini-1.5-flash** by default — fast, high quality, and completely free for normal usage.

(You can also try `gemini-2.0-flash` by setting `GEMINI_MODEL=gemini-2.0-flash` in .env)

---

## Final SOP — Run the Project Locally (Step-by-Step)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ + npm
- MongoDB running locally (`mongod`) or use free MongoDB Atlas or Supabase
- Google Gemini API key (free) — see section above

### 2. Clone & Setup
```bash
git clone https://github.com/Anirudh564/Ai_Com.git
cd Ai_Com
```

### 3. Backend (One Terminal)
```bash
cd backend
cp .env.example .env
# ← Edit .env and put your real GEMINI_API_KEY

python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

uvicorn server:app --reload --port 8000
```
Backend is ready at **http://localhost:8000**

### 4. Frontend (New Terminal)
```bash
cd web
cp .env.example .env     # Edit with your backend URL
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test the AI Features
1. Sign up / log in (any email + password)
2. Go to **Mentor** tab → chat with Aether (Gemini)
3. Go to **Analyze** → paste speech transcript → get Gemini analysis
4. Go to **Debate** → start a real debate with Gemini opponent
5. Go to **Interview** → do a full mock interview with Gemini

Everything now runs 100% on free Google Gemini. No Claude, no payments.

---

## Switching Models Later (Optional)

In `backend/.env` you can set:
```
GEMINI_MODEL=gemini-2.0-flash
```
Restart the backend. The entire app (mentor, debate, interview, speech) will instantly use the new model.

---

## Environment Files

Never commit real secrets.

- `backend/.env` — contains Mongo + Gemini key + JWT secret
- `frontend/.env` — contains backend URL

Both are already in `.gitignore`.

---

## Project Structure

```
Ai_Com/
├── backend/                 # FastAPI server
│   ├── server.py            # Main API with all endpoints
│   ├── requirements.txt
│   ├── .env.example
│   └── start.ps1 / start.sh
├── web/                     # Next.js web application
│   ├── app/                 # Pages (Next.js app router)
│   │   ├── api/             # API routes
│   │   ├── auth/            # Auth pages (login, signup)
│   │   ├── dashboard/       # Dashboard page
│   │   ├── mentor/          # AI mentor chat
│   │   ├── analyze/         # Speech analysis
│   │   ├── debate/          # Debate practice
│   │   ├── interview/       # Mock interviews
│   │   └── missions/        # Daily missions
│   ├── components/          # UI components
│   │   └── ui/              # ShadCN-style components
│   ├── lib/                 # Utilities (api, supabase client)
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

---

## Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/auth/signup` | POST | Register user (email, password, name) |
| `/api/auth/login` | POST | Login, returns JWT token |
| `/api/auth/me` | GET | Get current user profile |
| `/api/mentor/chat` | POST | Send message to Aether mentor |
| `/api/mentor/history` | GET | Get chat history |
| `/api/speech/analyze` | POST | Analyze speech transcript |
| `/api/speech/reports` | GET | List speech reports |
| `/api/debate/start` | POST | Start a debate |
| `/api/debate/turn` | POST | Submit debate argument |
| `/api/debate/{id}/finish` | POST | Finish debate, get summary |
| `/api/debate` | GET | List debates |
| `/api/debate/topics/suggest` | GET | Get debate topic suggestions |
| `/api/interview/start` | POST | Start mock interview |
| `/api/interview/answer` | POST | Submit interview answer |
| `/api/interview/{id}` | GET | Get interview state |
| `/api/missions/today` | GET | Get today's 4 daily missions |
| `/api/missions/complete` | POST | Mark mission complete |
| `/api/dashboard/stats` | GET | User progress dashboard |

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| `Module not found` | Run `npm install` in the `web/` directory |
| MongoDB connection error | Make sure MongoDB is running locally or use Atlas/Supabase |
| Frontend can't reach backend | Check `NEXT_PUBLIC_BACKEND_URL` in `web/.env` and that backend is running |
| npm install fails | Delete `node_modules` and `package-lock.json`, then reinstall |
| Port 3000 in use | Kill the process or change port in `next.config.js` |
| Gemini returns empty | Check your `GEMINI_API_KEY` is valid at https://aistudio.google.com |

---

## Original Tech Notes

- AI layer was migrated from Anthropic Claude → Google Gemini (free tier) in May 2026. All references cleaned.
- All internal function contracts were preserved — zero changes needed in frontend or other backend logic.
- The project is now 100% runnable with zero paid API keys.

---

**Fully free, production-quality local setup as of 2026.**
