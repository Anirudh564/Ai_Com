# Elite Communication Mentor (Aether)

AI-powered communication coach for students & young professionals.

**Features**: Daily missions, AI mentor chat, speech analysis, debate sparring, mock interviews, XP/streaks, progress dashboard.

Built with:
- **Backend**: FastAPI + MongoDB + Google Gemini (free tier)
- **Frontend**: Expo React Native (works on Web, iOS, Android)

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** + **Yarn** (the project uses Yarn)
- **MongoDB** (local or MongoDB Atlas)
- **Google Gemini API Key** (completely free generous tier) → https://aistudio.google.com/app/apikey

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
# Edit .env and add your GEMINI_API_KEY (get free key at https://aistudio.google.com/app/apikey)

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
- Node.js 18+ + Yarn (`corepack enable && corepack prepare yarn@stable --activate`)
- MongoDB running locally (`mongod`) or use free MongoDB Atlas
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

# Create venv + install (first time)
python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload --port 8000
```
Backend is ready at **http://localhost:8000**

### 4. Frontend (New Terminal)
```bash
cd frontend
cp .env.example .env     # (default already points to localhost:8000)

yarn install
npx expo start
```

- Press `w` → open in browser
- Press `a` → Android emulator
- Scan QR with Expo Go app on your phone

### 5. Test the AI Features
1. Sign up / log in (any email + password)
2. Go to **Mentor** tab → chat with Aether (Gemini)
3. Go to **Analyze** → record or paste speech → get Gemini analysis
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

| Problem                              | Solution |
|--------------------------------------|----------|
| `ModuleNotFoundError: google`        | Run `pip install -r requirements.txt` inside backend venv |
| MongoDB connection error             | Make sure MongoDB is running locally or use Atlas connection string |
| Frontend can't reach backend         | Check `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` and that backend is running |
| Splash screen error                  | Fixed in this repo (uses splash-image.png) |
| Yarn not found                       | Install Yarn: `corepack enable && corepack prepare yarn@stable --activate` |
| Port 8000 already in use             | Kill the process or change port in uvicorn command |
| Gemini returns empty / slow replies  | Check your GEMINI_API_KEY is valid and has quota at https://aistudio.google.com |

---

## Original Tech Notes

- AI layer was migrated from Anthropic Claude → Google Gemini (free tier) in May 2026. All references cleaned.
- All internal function contracts were preserved — zero changes needed in frontend or other backend logic.
- The project is now 100% runnable with zero paid API keys.

---

**Fully free, production-quality local setup as of 2026.**
