@echo off
echo ========================================
echo   Kota Platform - Simple Start
echo ========================================
echo.

echo Make sure you're in the project directory:
cd /d %~dp0
echo Current directory: %CD%
echo.

echo Starting Backend Server...
echo This will run in a new window.
start "Kota Backend Server" cmd /k "cd /d %CD% && \"KotaPal simple\nodejs\node-v20.10.0-win-x64\npm.cmd\" start"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "Kota Frontend Server" cmd /k "cd /d %CD%\frontend && \"..\KotaPal simple\nodejs\node-v20.10.0-win-x64\npm.cmd\" start"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Backend will be at: http://localhost:3000
echo Frontend will be at: http://localhost:3001
echo.
echo Watch the two new windows for any errors.
echo.
pause

