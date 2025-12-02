@echo off
title Kota Frontend - PORT 3001
cd /d "%~dp0"

set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo ========================================
echo KOTA FRONTEND - PORT 3001
echo ========================================
echo.

cd frontend

echo Starting frontend...
echo DO NOT CLOSE THIS WINDOW!
echo.

npm start

echo.
pause

