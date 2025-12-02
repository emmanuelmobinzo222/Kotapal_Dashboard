@echo off
echo ========================================
echo   Checking Firebase Configuration
echo ========================================
echo.

cd /d %~dp0

echo 1. Checking firebase-key.json file...
if exist "firebase-key.json" (
    echo    ✓ firebase-key.json found
    echo    File size:
    dir "firebase-key.json" | find "firebase-key.json"
) else (
    echo    ✗ firebase-key.json NOT FOUND!
    echo.
    echo    Please download from Firebase Console and place in this folder.
)

echo.
echo 2. Checking .env configuration...
findstr /C:"FIREBASE_PROJECT_ID" .env
findstr /C:"GOOGLE_APPLICATION_CREDENTIALS" .env

echo.
echo 3. Testing Firebase connection...
set "PATH=%~dp0KotaPal simple\nodejs\node-v20.10.0-win-x64;%PATH%"

node -e "try { const admin = require('firebase-admin'); const creds = require('./firebase-key.json'); console.log('✓ Firebase key is valid JSON'); console.log('Project:', creds.project_id); } catch(e) { console.log('✗ Error:', e.message); }"

echo.
echo ========================================
pause

