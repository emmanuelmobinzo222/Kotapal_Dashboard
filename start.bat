@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  echo Download it from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist .env (
  echo Creating .env from .env.example...
  copy /Y .env.example .env >nul
  echo.
  echo Edit .env and set your product lookup key.
  echo Or paste the key in the app under Settings -^> Integrations.
  echo.
)

echo Starting KotaPal on http://localhost:3000
echo.
call npm start
