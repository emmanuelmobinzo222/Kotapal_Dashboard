@echo off
echo ========================================
echo   Opening Kotapal Landing Page
echo ========================================
echo.

REM First, start the backend
echo Starting backend server...
start "Kota Backend" cmd /k "cd /d %~dp0 && .\START_BACKEND.bat"

timeout /t 5 /nobreak >nul

REM Open the HTML file in default browser
echo Opening landing page in browser...
start "" "%~dp0KotaPal simple\index.html#pricing"

echo.
echo ========================================
echo   Landing Page Opened!
echo ========================================
echo.
echo Backend: Starting on port 3000
echo Browser: Landing page should open in a moment
echo.
echo You can now:
echo - Click "Get Started" to create account
echo - Click "Login" to sign in
echo.
pause

