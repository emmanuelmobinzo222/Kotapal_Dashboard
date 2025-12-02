@echo off
echo Starting Kota Frontend...
echo.

cd /d %~dp0

REM Add Node.js to PATH for this session
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

cd frontend

echo Node.js version:
node --version
echo.

echo Starting frontend on port 3001...
echo.

REM Start the frontend
npm start

pause

