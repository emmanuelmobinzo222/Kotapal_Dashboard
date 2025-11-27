# 🚀 QUICK START - Open Landing Page with Login/Signup

## Easiest Way (Double-Click)

**Double-click:** `OPEN_LANDING_PAGE.bat`

This will:
1. Start the backend server (port 3000)
2. Open the landing page in your browser
3. Show the #pricing section

## Manual Way

### Step 1: Start Backend
Double-click: `START_BACKEND.bat`

Wait until you see:
```
✅ Kota Smart Product Platform running on port 3000
```

### Step 2: Open Browser
Double-click: `KotaPal simple\index.html`

Or open directly at:
```
file:///C:/Users/emman/Downloads/wetransfer_kotapal_2025-09-22_1618/KotaPal%20simple/index.html#pricing
```

## Test Login/Signup

### Create Account:
1. Click **"Get Started"** button (big blue button)
2. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: yourpassword
   - Website: https://example.com
   - Plan: Select one
3. Click **"Sign Up"**
4. **You'll be redirected to dashboard!**

### Login:
1. Click **"Login"** (top right)
2. Enter email and password
3. Click **"Sign in"**
4. **You'll see the dashboard!**

## What's Fixed

✅ API connects to: http://localhost:3000  
✅ Login works with backend  
✅ Signup creates users in Firebase  
✅ Redirects to dashboard after auth  
✅ Better error messages  
✅ Console logging for debugging  

## Troubleshooting

### "Failed to fetch" error?

**Make sure backend is running:**
- Look for "Kota Backend" window
- Should say "running on port 3000"
- If not, run `START_BACKEND.bat`

### Open browser console (F12)
You'll see logs like:
```
API_BASE set to: http://localhost:3000
POST Request: http://localhost:3000/api/auth/login
Response status: 200
Success: { user: {...}, token: "..." }
```

### Still having issues?

Check:
1. Backend console for errors
2. Browser console (F12) for API errors
3. Network tab to see request/response

---

## ✅ READY!

Double-click `OPEN_LANDING_PAGE.bat` and start testing!
