@echo off
title Kota Platform - Start Dashboard
cls
color 0A

cd /d "%~dp0"

echo ========================================
echo   KOTA PLATFORM - STARTING DASHBOARD
echo ========================================
echo.
echo IMPORTANT: This is a React app that MUST run on a server.
echo You CANNOT open HTML files directly!
echo.
echo.

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [Step 1/2] Starting Backend Server (Port 3000)...
echo.
start "Kota Backend" cmd /k "cd /d %CD% && node server.js"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [Step 2/2] Starting Frontend Server (Port 3001)...
echo.
cd frontend
start "Kota Frontend" cmd /k "cd /d %CD% && npm start"
cd ..

echo.
echo ========================================
echo   SERVERS STARTING!
echo ========================================
echo.
echo Wait 30-60 seconds for frontend to compile...
echo.
echo Then open your browser and go to:
echo.
echo    http://localhost:3001
echo.
echo DO NOT use file:/// paths!
echo.
echo ========================================
echo.
echo Opening browser in 30 seconds...
timeout /t 30 /nobreak >nul
start http://localhost:3001

echo.
echo Browser opened! If you see a blank page, wait a bit longer.
echo.
echo IMPORTANT: Keep both server windows open!
echo.
pause

