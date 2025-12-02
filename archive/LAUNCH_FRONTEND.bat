@echo off
title Kota Frontend Server
cd /d %~dp0

set "PATH=%~dp0..\KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Starting Frontend on http://localhost:3001
echo Please wait - this may take 30-60 seconds...
echo.

npm start

