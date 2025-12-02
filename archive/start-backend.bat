@echo off
title Kota Backend - PORT 3000
cd /d "%~dp0"

set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo ========================================
echo KOTA BACKEND SERVER - PORT 3000
echo ========================================
echo.
echo Starting server...
echo DO NOT CLOSE THIS WINDOW!
echo.
echo If you see errors, check the message below.
echo.

node server.js

echo.
echo Server stopped. Press any key to exit...
pause

