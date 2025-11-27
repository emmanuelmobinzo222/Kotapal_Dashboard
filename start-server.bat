@echo off
echo ========================================
echo   Kota Platform - Server Startup
echo ========================================
echo.

REM Add portable Node.js to PATH for this session
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Checking Node.js...
node --version
echo.

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Checking frontend dependencies...
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo ========================================
echo   Global PART: COMPLETED
echo ========================================
echo.

REM Start backend in a new window
echo Starting Backend Server on port 3000...
start "Kota Backend - Port 3000" cmd /k "node server.js"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in another new window
echo Starting Frontend Server on port 3001...
cd frontend
start "Kota Frontend - Port 3001" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo   Setup Completed!
echo ========================================
echo.
echo Backend running at: http://localhost:3000
echo Frontend running at: http://localhost:3001
echo.
echo Press any key to exit this window.
echo Note: The servers will continue running in their windows.
echo.
pause

