@echo off
title Starting Kota Platform
cd /d %~dp0

set "NODE_PATH=%~dp0archive\KotaPal simple\nodejs\node-v20.10.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo ========================================
echo   KOTA PLATFORM
echo ========================================
echo.
echo Starting Backend Server...
echo.
start "BACKEND Server" cmd /k "cd /d %CD% && set PATH=%NODE_PATH%;%PATH% && node server.js"

timeout /t 10 /nobreak >nul

echo Starting Frontend Server...
echo.
start "FRONTEND Server" cmd /k "cd /d %CD%\frontend && set PATH=%NODE_PATH%;%PATH% && npm start"

echo.
echo ========================================
echo   SERVERS STARTING
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Please wait 30-60 seconds for servers to start...
echo Then the browser will open automatically.
echo.
timeout /t 30 /nobreak >nul
start http://localhost:3001
echo.
echo Browser opened! If it shows connection error, wait a bit longer.
echo.
pause

