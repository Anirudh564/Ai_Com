# Windows PowerShell helper to run the backend easily
# Usage: Double-click or run from terminal: ./start.ps1

Write-Host "Starting Elite Communication Mentor Backend..." -ForegroundColor Cyan

# Go to backend folder
Set-Location -Path $PSScriptRoot

# Create venv if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate venv
. .\venv\Scripts\Activate.ps1

# Install requirements
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Check for .env
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy backend\.env.example to backend\.env and fill in your keys." -ForegroundColor Yellow
    Read-Host "Press Enter after you have created the .env file..."
}

# Start the server
Write-Host "Starting FastAPI server on http://localhost:8000 ..." -ForegroundColor Green
uvicorn server:app --reload --port 8000
