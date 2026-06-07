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
- Frontend: Next.js 15 + Tailwind CSS
- Backend: FastAPI + Supabase + Google Gemini (free tier)
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
- **Supabase project** (free tier)
- **Google Gemini API Key** (completely free generous tier) → https://aistudio.google.com/app/apikey

---

## Quick Start (Web Application)

### 1. Clone the repository

```bash
git clone https://github.com/Anirudh564/Ai_Com.git
cd Ai_Com
```

### 2. Backend Setup (Required for AI features)

**Windows (use PowerShell script):**
```powershell
cd backend
.\start.ps1
```

**Or manual setup (all platforms):**
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase and Gemini API keys

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

uvicorn server:app --reload --port 8000
```

**Set up Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy the URL and anon key
3. In Supabase SQL Editor, run:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID,
  user_id UUID REFERENCES users(id),
  role TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE debates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  topic TEXT,
  user_stance TEXT,
  ai_stance TEXT,
  level INTEGER,
  turns JSONB,
  finished BOOLEAN DEFAULT FALSE,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interviews (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT,
  turns JSONB,
  finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE missions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  title TEXT,
  category TEXT,
  xp INTEGER
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT,
  transcript TEXT,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Start Backend
**Windows:**
```powershell
cd backend
.\start.ps1
```

**Manual:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 4. Frontend (New Terminal)
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Quick Start (Windows shortcut):**
1. Run `.\start.ps1` in `backend/` (auto-installs deps, starts server)
2. Run `npm install && npm run dev` in `web/`
3. Open browser to http://localhost:3000

---

## Getting a Free Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account (free)
3. Click **"Create API key"** (no credit card required)
4. Copy the key (starts with `AIzaSy...`)
5. Paste it into `backend/.env` as `GEMINI_API_KEY`

The app uses **gemini-1.5-flash** by default — fast, high quality, and completely free for normal usage.

(You can also try `gemini-2.0-flash` by setting `GEMINI_MODEL=gemini-2.0-flash` in .env)

---

## Environment Files

Never commit real secrets.

- `backend/.env` — contains Supabase keys + Gemini key + JWT secret
- `web/.env` — contains backend URL

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
| Supabase connection error | Check `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env` |
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
