# ✅ Offline Login Setup - Complete Guide

## What Was Configured

The application is now **100% offline-capable** for login and authentication. Here's what was set up:

### 1. ✅ Local JSON Database (Offline-First)
- All user data is stored locally in `data/data.json`
- No internet connection required for login/registration
- Works completely offline

### 2. ✅ Automatic Fallback
- If Firebase/Supabase are configured but unavailable (offline), automatically uses local database
- No errors or failures when offline
- Seamless transition between online/offline modes

### 3. ✅ Default Test User
A test user is pre-configured for quick access:

**Email**: `john.doe@example.com`  
**Password**: `password` (default - you can change this)

## How to Use Offline Login

### Step 1: Start the Servers (No Internet Required)

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 2: Access Login Page

Open: **http://localhost:3001/login**

### Step 3: Login Options

#### Option A: Use Test Account
- **Email**: `john.doe@example.com`
- **Password**: `password`

#### Option B: Create New Account
1. Click "Create a new account"
2. Fill in your details
3. Choose a plan
4. Click "Create account"
5. You'll be logged in automatically

## Offline Features That Work

✅ **User Registration** - Create new accounts offline  
✅ **User Login** - Login with existing accounts  
✅ **Password Authentication** - Secure password hashing (bcrypt)  
✅ **JWT Tokens** - Session management  
✅ **User Profile** - View and edit profile  
✅ **Dashboard** - Access dashboard  
✅ **Blocks Management** - Create/edit/delete blocks  
✅ **Data Persistence** - All data saved to `data/data.json`  

## Data Storage Location

All offline data is stored in:
```
data/data.json
```

This file contains:
- Users (email, password hash, profile)
- Blocks (product blocks you create)
- Integrations (affiliate network settings)
- Clicks (analytics data)
- Analytics metrics

## Creating a New User Offline

1. Go to: http://localhost:3001/register
2. Fill in:
   - Name
   - Email
   - Password
   - Website (optional)
   - Plan (Starter, Pro, Creator Plus, or Agency)
3. Click "Create account"
4. You'll be automatically logged in

## Changing the Test User Password

The test user password is hashed. To change it:

1. **Option 1**: Create a new account with your preferred email
2. **Option 2**: Edit `data/data.json` and replace the password hash
   - Use an online bcrypt generator to hash your new password
   - Replace the `password` field for user `user_123`

## Verifying Offline Mode

When you start the server, you should see:
```
✓ Local JSON database ready (offline-capable)
Database initialized - using: Local JSON
✓ Offline login supported with local database
```

If you see "Firebase" or "Supabase", that's fine - it will still work offline and fall back to local storage.

## Testing Offline Login

1. **Disconnect from internet** (or turn off WiFi)
2. **Start both servers** (they'll work fine offline)
3. **Open**: http://localhost:3001/login
4. **Login** with test account or create new account
5. **Everything works!** ✅

## Troubleshooting

### "Database initialization error"
**Solution**: This is normal if Firebase/Supabase aren't configured. The app automatically uses local database.

### "Cannot connect to API"
**Cause**: Backend server not running

**Solution**: 
```bash
npm start
```

### "Failed to fetch"
**Cause**: Frontend can't reach backend

**Solution**: 
1. Make sure backend is running on port 3000
2. Check: http://localhost:3000 should show API info
3. Frontend should be on port 3001

### Data Not Persisting
**Cause**: `data/` folder doesn't exist or isn't writable

**Solution**:
1. Check that `data/data.json` exists
2. If not, the server will create it automatically
3. Make sure the folder is writable

## Security Notes

- Passwords are hashed using bcrypt (industry standard)
- JWT tokens are used for session management
- All data is stored locally (no cloud sync when offline)
- When you go online, you can optionally sync to Firebase/Supabase

## Going Online Later

If you want to use Firebase/Supabase when online:

1. Configure in `.env` file:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
   ```

2. The app will automatically use Firebase when available
3. Falls back to local database when offline
4. **Your local data is always preserved**

---

**Status**: ✅ **100% OFFLINE CAPABLE** - Login works completely offline!

