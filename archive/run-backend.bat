@echo off
echo Starting Kota Backend Server...
echo.

cd /d %~dp0

REM Add Node.js to PATH for this session
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Node.js version:
node --version
echo.

echo Starting server on port 3000...
echo.

REM Start the server
node server.js

pause

