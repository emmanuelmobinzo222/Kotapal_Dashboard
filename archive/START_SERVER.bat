@echo off
title Kota Platform - Backend + Frontend
color 0A

echo ========================================
echo   Kota Platform - Starting Servers
echo ========================================
echo.

cd /d %~dp0
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Starting Backend Server (Port 3000)...
start "Kota Backend" cmd /k "cd /d %CD% && set PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && node server.js"

echo Waiting 8 seconds for backend to start...
timeout /t 8 /nobreak >nul

echo Starting Frontend (Port 3001)...
start "Kota Frontend" cmd /k "cd /d %CD%\frontend && set PATH=%~dp0..\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && npm start"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Keep both windows open!
echo.
timeout /t 3 /nobreak >nul

