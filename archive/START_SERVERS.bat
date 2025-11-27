@echo off
title Kota Platform - Starting Servers...
color 0A

echo ========================================
echo   Kota Platform - Starting Servers
echo ========================================
echo.

REM Add portable Node.js to PATH
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Checking Node.js...
node --version
echo.

echo Starting Backend Server (Port 3000)...
echo Window will stay open so you can see the logs.
echo.
start "Kota Backend - Port 3000" cmd /k "cd /d %~dp0 && set PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && echo Backend Server Starting... && echo. && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul
echo.

echo Starting Frontend Server (Port 3001)...
echo Window will stay open so you can see the logs.
echo.
start "Kota Frontend - Port 3001" cmd /k "cd /d %~dp0 && set PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && cd frontend && echo Frontend Server Starting... && echo. && npm start"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Two new windows have opened:
echo.
echo 1. Backend window - Watch for "Database initialized"
echo 2. Frontend window - Will open browser automatically
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo IMPORTANT: Keep both windows open!
echo Don't close them or the servers will stop.
echo.
echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul
exit

