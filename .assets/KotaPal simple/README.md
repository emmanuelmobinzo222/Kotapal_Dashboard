# KotaPal Backend Setup

## Prerequisites
1. Install Node.js from https://nodejs.org (LTS version recommended)
2. Open Command Prompt or PowerShell as Administrator

## Installation & Running

1. Navigate to the project directory:
   ```bash
   cd "C:\Users\emman\Downloads\wetransfer_kotapal_2025-09-22_1618\KotaPal simple"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

4. The server will run on http://localhost:3000

## Features
- User registration and login
- JWT authentication
- JSON file database (data.json)
- Plan-based routing
- Offline fallback support

## API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/user/profile - Get user profile
- GET /api/blocks - Get user blocks
- POST /api/blocks - Create new block
- And more...

## Database
- Uses JSON file storage (data.json) by default
- Can be configured to use Firebase Firestore
- Data persists between server restarts
