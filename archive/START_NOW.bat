@echo off
title KOTA - START NOW!
color 0A
cls

echo ========================================
echo   KOTA PLATFORM - STARTING NOW!
echo ========================================
echo.

REM Set Node.js path
set "NODE_PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo [1/3] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)
echo Node.js version:
node --version
echo.

echo [2/3] Starting Backend Server...
start "KOTA BACKEND - Port 3000" cmd /k "cd /d %~dp0 && set PATH=%NODE_PATH%;%PATH% && node server.js"

timeout /t 8 /nobreak >nul

echo [3/3] Opening Login Page...
start "" "%~dp0KotaPal simple\index.html#pricing"

echo.
echo ========================================
echo   ✅ BACKEND STARTED!
echo   ✅ BROWSER OPENED!
echo ========================================
echo.
echo DO THIS NOW:
echo ----------------------------------------
echo 1. Wait for "running on port 3000" in backend window
echo 2. In browser, click "Get Started" or "Login"
echo 3. Enter your details and click "Sign Up" or "Sign in"
echo 4. YOU'LL BE LOGGED IN!
echo ----------------------------------------
echo.
echo Backend: http://localhost:3000
echo Landing Page: file:///...
echo.
pause

