@echo off
setlocal
cd /d "%~dp0frontend"

echo ============================================================
echo   BrandWtch - Frontend (the website you open in your browser)
echo   First run installs everything (can take a few minutes).
echo   Keep this window OPEN while using the app.
echo ============================================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo Install the LTS version from https://nodejs.org/ then re-run this file.
    echo.
    pause
    exit /b 1
)

set NEXT_PUBLIC_API_URL=http://localhost:8000

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Dependency install failed. Copy the red text above and send it for help.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Frontend starting at http://localhost:3000
echo   Open that address in your browser once it says "Ready".
echo ============================================================
echo.
call npm run dev

pause
