# How to Test the Database is Working

## Quick Start - Test Everything

### Step 1: Start Backend Server
1. **Double-click**: `run-backend.bat`
2. Wait for it to say: "Kota Smart Product Platform running on port 3000"
3. **Keep this window open!**

### Step 2: Start Frontend
1. **Double-click**: `run-frontend.bat` (in a new window)
2. Your browser should open automatically to http://localhost:3001
3. **Keep this window open!**

### Step 3: Test Database Connection

#### Test 1: Register a New Account
1. On the website (http://localhost:3001), click "Register" or "Create account"
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123456
   - Choose a plan (any plan)
3. Click "Create account"

**If it works:**
- You'll be logged in and redirected to dashboard
- Database is working! ✅

**If you see error:**
- Check the backend window for error messages
- Database might not be configured

#### Test 2: Check Data in Database

**If using Local JSON:**
- Data is saved in `data/data.json` file
- Open it to see your user

**If using Firebase:**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click "Firestore Database"
4. Click "users" collection
5. You should see your registered user!

**If using Supabase:**
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "users" table
4. You should see your user!

#### Test 3: Create a SmartBlock
1. After logging in, go to "SmartBlocks" or "Create Block"
2. Fill in the form
3. Click "Create"

**Check database again** - you should see a new "blocks" collection/table!

---

## What You Should See

### Backend Window Shows:
```
Database initialized - using: Firebase
(or Supabase or Local JSON)

Kota Smart Product Platform running on port 3000
API Documentation: http://localhost:3000/api/docs
```

### Frontend Website:
- Login page loads
- Can register new user
- Can login
- Dashboard works
- Can create blocks

### Database Has Data:
- users collection/table with your user
- blocks collection/table when you create blocks

---

## Troubleshooting

### "Failed to fetch" Error
**Problem:** Backend not running  
**Solution:** Make sure `run-backend.bat` is running and shows "running on port 3000"

### Registration/Login Doesn't Work
**Problem:** Database issue  
**Check backend window** for errors like:
- "Firebase initialization failed"
- "Cannot connect to database"
- Any red error messages

### Can't Create Blocks
**Problem:** Authentication or database issue  
**Solution:** 
1. Make sure you're logged in
2. Check backend window for errors
3. Check browser console (F12) for errors

---

## Current Database Status

Your app is currently using: **Local JSON Database**

This is good for testing! To use Firebase or Supabase:
1. Follow Firebase setup guide
2. Update .env file
3. Restart backend

---

## Quick Database Test Summary

1. ✅ Start backend → See "Database initialized"
2. ✅ Start frontend → Website loads
3. ✅ Register user → No errors
4. ✅ Login → Works
5. ✅ Create block → Saves to database
6. ✅ Check database → See your data

**All working? Your database is configured and working!** 🎉

