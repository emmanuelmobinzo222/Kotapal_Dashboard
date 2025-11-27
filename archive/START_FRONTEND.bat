@echo off
title Kota Frontend Server
color 0A
echo ========================================
echo   KOTA FRONTEND SERVER
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

echo Navigating to frontend directory...
cd frontend

echo.
echo Starting Frontend Server on port 3001...
echo Press Ctrl+C to stop
echo.

npm start

pause

