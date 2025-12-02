@echo off
title Kota Platform - Complete Startup
cls
color 0B

cd /d %~dp0
set "NODE_PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64"

echo ========================================
echo   KOTA PLATFORM - STARTING EVERYTHING
echo ========================================
echo.
echo This will start BOTH servers for you.
echo.
echo Press Ctrl+C to cancel or...
pause
echo.

echo [1/2] Starting BACKEND Server (Port 3000)...
start "Kota Backend Server" cmd /k "cd /d %CD% && set PATH=%CD%\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && echo BACKEND STARTING... && node server.js"

echo Waiting 8 seconds for backend to initialize...
timeout /t 8 /nobreak >nul
echo.

echo [2/2] Starting FRONTEND Server (Port 3001)...
start "Kota Frontend Server" cmd /k "cd /d %CD%\frontend && set PATH=%CD%\..\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && echo FRONTEND STARTING... && npm start"

echo.
echo ========================================
echo   SERVERS ARE STARTING!
echo ========================================
echo.
echo Wait 30 seconds for frontend to compile...
echo Then go to: http://localhost:3001
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3001

echo.
echo Opening browser now...
echo.
echo IMPORTANT: Keep both server windows open!
echo.
timeout /t 3 /nobreak >nul
echo Press any key to close this window...
pause >nul

