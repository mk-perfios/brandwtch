@echo off
setlocal
cd /d "%~dp0backend"

echo ============================================================
echo   BrandWtch - Backend
echo   First run installs everything (can take a few minutes).
echo   Keep this window OPEN while using the app.
echo ============================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not on PATH.
    echo Install it from https://www.python.org/downloads/ and
    echo tick "Add python.exe to PATH" during install, then re-run this file.
    echo.
    pause
    exit /b 1
)

if not exist venv (
    echo Creating Python environment...
    python -m venv venv
)

echo Installing dependencies...
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install -r requirements-lite.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Dependency install failed. Copy the red text above and send it for help.
    pause
    exit /b 1
)

REM Lite mode: built-in SQLite database, no Redis/Celery server.
set DATABASE_URL=sqlite+aiosqlite:///./brandwtch.db
set SECRET_KEY=local-dev-secret-change-me
set USE_CELERY=false

echo.
echo ============================================================
echo   Backend running at http://localhost:8000
echo   (Leave this window open. Now run run-frontend.bat)
echo ============================================================
echo.
venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

pause
