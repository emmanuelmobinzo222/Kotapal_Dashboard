# Test Login and Signup - Complete Guide

## ✅ Backend is Running!

Your backend server is confirmed running on port 3000.

## Testing Steps

### 1. Open the Website
Go to: **http://localhost:3001**

### 2. Test Registration

1. Click **"Create a new account"** or **"Register"**
2. Fill in the form:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** test123456
   - **Confirm Password:** test123456
   - **Website:** (leave empty or add any URL)
   - **Plan:** Select "Starter" (Free)
3. Click **"Create account"**

**Expected Result:**
- ✅ Success toast message: "Account created successfully!"
- ✅ Redirected to Dashboard
- ✅ No errors

**If Error:**
- Check backend window for error message
- Copy the error and report it

### 3. Verify in Firebase

1. Go to: https://console.firebase.google.com/
2. Select project: **kotapal-1e8f6**
3. Click **"Firestore Database"**
4. Click **"users"** collection
5. You should see your registered user!

### 4. Test Login

1. Logout (if still logged in)
2. Go to login page: **http://localhost:3001/login**
3. Enter:
   - **Email:** test@example.com
   - **Password:** test123456
4. Click **"Sign in"**

**Expected Result:**
- ✅ Success toast message: "Welcome back!"
- ✅ Redirected to Dashboard
- ✅ Can see your data

### 5. Test Logout

1. Click **Logout** button
2. Should be redirected to login page
3. Session cleared

---

## Troubleshooting

### Registration Error: "User already exists"
- User was already created
- Try different email like: test2@example.com
- Or go directly to login

### Login Error: "Incorrect password"
- Make sure you're using the password you registered with
- Try registering a new account with a new email

### "Failed to fetch" Error
- Backend not running
- Check backend window
- Run: `.\START.bat`

### Can't Access Website
- Frontend not running
- Check frontend window shows "Compiled successfully!"
- Go to: http://localhost:3001

---

## Quick Test Credentials

Use these to test quickly:

**Register:**
- Email: test@example.com
- Password: test123456

**Login:**
- Email: test@example.com
- Password: test123456

---

## Current Status

✅ **Backend:** Running on port 3000  
✅ **Firebase:** Configured and connected  
✅ **Authentication:** Ready to test  
⏳ **Frontend:** Should be opening at http://localhost:3001  

**If frontend not running, double-click `START.bat`**

---

## Success Indicators

✅ Can register new account  
✅ Can login with credentials  
✅ Can logout  
✅ Data appears in Firebase  
✅ No console errors  
✅ Toast notifications work  

**All working? Perfect! Your authentication system is fully functional!** 🎉

