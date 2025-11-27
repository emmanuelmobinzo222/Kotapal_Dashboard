@echo off
echo ========================================
echo   Checking Server Status
echo ========================================
echo.

set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

echo Checking if backend is running on port 3000...
curl -s http://localhost:3000 2>nul
if errorlevel 1 (
    echo Backend is NOT running
    echo.
    echo Starting backend server...
    start "Kota Backend" cmd /k "set PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH% && npm start"
    timeout /t 3 /nobreak
    echo.
    echo Backend should be starting...
) else (
    echo Backend IS running! ✓
)

echo.
echo ========================================
echo   Status Check Complete
echo ========================================
pause

