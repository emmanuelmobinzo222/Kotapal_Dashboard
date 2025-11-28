@echo off
title Kota Platform - Simple Start
cls
color 0A

cd /d "%~dp0"

echo ========================================
echo   KOTA PLATFORM - SIMPLE START
echo ========================================
echo.
echo This will start BOTH servers for you.
echo.
echo IMPORTANT: 
echo - DO NOT close the windows that open
echo - Wait 30-60 seconds for everything to start
echo - Browser will open automatically
echo.
pause
echo.

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Or make sure Node.js is in your system PATH.
    echo.
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server (Port 3000)...
echo.
start "Kota Backend - DO NOT CLOSE" cmd /k "cd /d %CD% && echo ======================================== && echo   BACKEND SERVER - DO NOT CLOSE THIS WINDOW && echo ======================================== && echo. && node server.js"

echo Waiting 8 seconds for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo [2/2] Starting Frontend Server (Port 3001)...
echo.
cd frontend
start "Kota Frontend - DO NOT CLOSE" cmd /k "cd /d %CD% && echo ======================================== && echo   FRONTEND SERVER - DO NOT CLOSE THIS WINDOW && echo ======================================== && echo. && echo Wait for 'Compiled successfully!' message && echo. && npm start"
cd ..

echo.
echo ========================================
echo   SERVERS ARE STARTING!
echo ========================================
echo.
echo Two windows just opened:
echo   1. "Kota Backend" - Backend server
echo   2. "Kota Frontend" - Frontend server
echo.
echo IMPORTANT: Keep BOTH windows open!
echo.
echo Waiting 30 seconds for frontend to compile...
echo Then your browser will open automatically.
echo.
timeout /t 30 /nobreak >nul

echo.
echo Opening browser now...
start http://localhost:3001

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Your browser should now be open at:
echo   http://localhost:3001
echo.
echo If you see a blank page, wait 30 more seconds
echo and refresh (F5).
echo.
echo To login:
echo   1. Click "Create a new account" OR
echo   2. Use test account: test@example.com / test123
echo.
echo REMEMBER: Keep both server windows open!
echo.
pause

