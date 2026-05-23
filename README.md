# Elite Communication Mentor (Aether)

AI-powered communication coach for students & young professionals.

**Features**: Daily missions, AI mentor chat, speech analysis, debate sparring, mock interviews, XP/streaks, progress dashboard.

Built with:
- **Backend**: FastAPI + MongoDB + Anthropic Claude
- **Frontend**: Expo React Native (works on Web, iOS, Android)

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** + **Yarn** (the project uses Yarn)
- **MongoDB** (local or MongoDB Atlas)
- **Anthropic API Key** (free tier available) → https://console.anthropic.com/

---

## Quick Start (Any Laptop)

### 1. Clone the repository

```bash
git clone https://github.com/Anirudh564/Ai_Com.git
cd Ai_Com
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env and add your keys (especially ANTHROPIC_API_KEY)

# Windows
.\start.ps1

# Mac / Linux
chmod +x start.sh
./start.sh
```

Or run manually:

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Backend will run at **http://localhost:8000**

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Copy environment file
cp .env.example .env
# (default points to http://localhost:8000 — good for local dev)

# Install dependencies
yarn install

# Start Expo
npx expo start
```

- Press `w` → open in web browser
- Press `a` → Android emulator
- Press `i` → iOS simulator (Mac only)
- Scan QR with **Expo Go** app on your phone

---

## Getting an Anthropic API Key (Required for AI features)

1. Go to https://console.anthropic.com/
2. Sign up / log in
3. Create an API key
4. Paste it into `backend/.env` as `ANTHROPIC_API_KEY`

The app uses **Claude 3.5 Sonnet** by default (excellent for coaching).

---

## Environment Files

Never commit real secrets.

- `backend/.env` — contains Mongo + Anthropic key + JWT secret
- `frontend/.env` — contains backend URL

Both are already in `.gitignore`.

---

## Project Structure

```
Ai_Com/
├── backend/                 # FastAPI server
│   ├── server.py
│   ├── requirements.txt
│   ├── .env.example
│   └── start.ps1 / start.sh
├── frontend/                # Expo app
│   ├── app/                 # Screens (expo-router)
│   ├── src/
│   └── package.json
├── README.md
└── .gitignore
```

---

## Common Issues & Fixes

| Problem                        | Solution |
|--------------------------------|----------|
| `ModuleNotFoundError: anthropic` | Run `pip install -r requirements.txt` inside backend venv |
| MongoDB connection error       | Make sure MongoDB is running locally or use Atlas connection string |
| Frontend can't reach backend   | Check `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` and that backend is running |
| Splash screen error            | Fixed in this repo (uses splash-image.png) |
| Yarn not found                 | Install Yarn: `corepack enable && corepack prepare yarn@stable --activate` |
| Port 8000 already in use       | Kill the process or change port in uvicorn command |

---

## How to Get This Running on a Completely New Laptop (Step-by-Step)

1. Install Python 3.10+, Node.js 18+, Yarn, MongoDB (or use Atlas free tier)
2. Get Anthropic API key
3. Clone repo
4. `cd backend` → copy `.env.example` → fill keys → run `start.ps1` or `start.sh`
5. In new terminal: `cd frontend` → copy `.env.example` → `yarn install` → `npx expo start`
6. Done.

---

## Original Tech Notes

- All AI calls now use the official `anthropic` Python SDK (safe, no third-party wrappers).
- The original project was generated via Emergent platform and has been cleaned for public/open use.

---

**Made runnable and secure for any laptop in 2026.**
