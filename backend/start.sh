#!/bin/bash
# Mac / Linux helper to run the backend easily
# Usage: chmod +x start.sh && ./start.sh

set -e

echo "Starting Elite Communication Mentor Backend..."

cd "$(dirname "$0")"

# Create venv if missing
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Warn about .env
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Please copy backend/.env.example to backend/.env and fill your keys."
    read -p "Press Enter after creating .env file..."
fi

echo "Starting FastAPI server on http://localhost:8000 ..."
uvicorn server:app --reload --port 8000
