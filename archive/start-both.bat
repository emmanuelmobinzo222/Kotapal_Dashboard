@echo off
echo Starting Kota Platform...
echo.
echo Make sure you have run: npm install
echo.

REM Start backend in a new window
start "Kota Backend Server" cmd /k "npm start"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in another new window
start "Kota Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
pause

