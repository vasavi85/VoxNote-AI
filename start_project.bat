@echo off
TITLE VoxNote AI - Speech-to-Text & Smart Notes Generator
COLOR 0B

echo =========================================================================
echo                       VOXNOTE AI LAUNCHER
echo      Multilingual Audio Transcription & Smart Notes Generator
echo               Powered by Gnani AI Prisma v3.0 STT
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "VoxNote Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "VoxNote Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================================
echo  VoxNote AI is booting up!
echo.
echo  * Frontend: http://localhost:5173
echo  * Backend API: http://127.0.0.1:8000
echo  * API Documentation (Swagger): http://127.0.0.1:8000/docs
echo.
echo  Make sure GNANI_API_KEY is configured in backend/.env for live STT.
echo =========================================================================
pause
