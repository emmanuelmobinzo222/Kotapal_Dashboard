@echo off
title Starting Kota Platform - Firebase Connected!
cd /d %~dp0

set "NODE_PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo ========================================
echo   KOTA PLATFORM WITH FIREBASE
echo ========================================
echo.
echo Starting Backend with Firebase...
echo.
start "BACKEND - Firebase" cmd /k "cd /d %CD% && set PATH=%NODE_PATH%;%PATH% && node server.js"

timeout /t 10 /nobreak >nul

echo Starting Frontend...
echo.
start "FRONTEND" cmd /k "cd /d %CD%\frontend && set PATH=%NODE_PATH%;%PATH% && npm start"

echo.
echo ========================================
echo   CHECK THE TWO WINDOWS!
echo ========================================
echo.
echo BACKEND window should show:
echo   ✓ Firebase initialized successfully
echo   Database initialized - using: Firebase
echo   Running on port 3000
echo.
echo FRONTEND window will compile...
echo Then open: http://localhost:3001
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3001
echo.
pause

