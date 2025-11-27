@echo off
title Kota Platform Startup
color 0E

echo ========================================
echo   KOTA PLATFORM - STARTUP
echo ========================================
echo.

REM Set Node.js path
set "NODE_PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

node --version
echo.

echo Starting BACKEND server...
start "Kota Backend" cmd /k "cd /d %~dp0 && set PATH=%NODE_PATH%;%PATH% && node server.js"

timeout /t 3 /nobreak >nul

echo Starting FRONTEND server...
start "Kota Frontend" cmd /k "cd /d %~dp0\frontend && set PATH=%NODE_PATH%;%PATH% && npm start"

echo.
echo ========================================
echo   SERVERS STARTING...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Open browser in 30 seconds to http://localhost:3001
echo.
pause

