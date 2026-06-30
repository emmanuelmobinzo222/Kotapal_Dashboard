@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

echo.
echo === KotaPal LIVE deploy (Firebase Hosting + Cloud Functions) ===
echo Project: kotapal-1e8f6
echo.

if not exist "functions\node_modules" (
  echo Installing Cloud Functions dependencies...
  pushd functions
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

echo Checking Firebase login...
call npx firebase-tools projects:list --project kotapal-1e8f6 >nul 2>&1
if errorlevel 1 (
  echo.
  echo Sign in to Firebase once, then this script will deploy automatically.
  call npx firebase-tools login
  if errorlevel 1 exit /b 1
)

echo.
echo Deploying hosting + product lookup functions...
call npx firebase-tools deploy --only functions,hosting --project kotapal-1e8f6
if errorlevel 1 (
  echo Deploy failed.
  pause
  exit /b 1
)

echo.
echo LIVE deploy complete.
echo App: https://kotapal-1e8f6.web.app
echo Product API: https://kotapal-1e8f6.web.app/api/products/search
echo.
pause
