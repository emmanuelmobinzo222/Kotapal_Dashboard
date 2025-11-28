@echo off
title Kota Backend Server
color 0B
echo ========================================
echo   KOTA BACKEND SERVER
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

echo Starting Backend Server on port 3000...
echo Press Ctrl+C to stop
echo.

node server.js

pause
