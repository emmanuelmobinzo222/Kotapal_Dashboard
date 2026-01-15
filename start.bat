@echo off
title Starting Kota Platform...
cls
color 0A

cd /d "%~dp0"

echo ========================================
echo   KOTA PLATFORM - STARTING...
echo ========================================
echo.

REM Add Node.js to PATH
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
    echo.
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Starting BACKEND SERVER...
echo.
start "Kota Backend" cmd /k "cd /d %CD% && set PATH=%CD%\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && node server.js"

echo Waiting 8 seconds for backend to start...
timeout /t 8 /nobreak >nul

echo Starting FRONTEND...
echo.
start "Kota Frontend" cmd /k "cd /d %CD%\frontend && set PATH=%CD%\..\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && npm start"

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3001
echo.
echo IMPORTANT: Keep both server windows open!
echo.
echo Press any key to close this window...
pause >nul
