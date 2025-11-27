# 🔍 DEBUG LOGIN - Follow These Steps

## Quick Fix Instructions

### Step 1: Clear Everything
Open browser console (F12) and type:
```javascript
localStorage.clear()
```
Press Enter

### Step 2: Sign Up
1. Open `KotaPal simple/index.html`
2. Click "Get Started"
3. Fill form with:
   - Name: **Test User**
   - Email: **test@email.com**
   - Password: **password123**
   - Website: (optional)
   - Plan: Select any
4. Click "Sign Up"
5. **Check console** - should show: "Creating user in localStorage:" with your password

### Step 3: Check What Was Stored
In console, type:
```javascript
JSON.parse(localStorage.getItem('kotaUser'))
```
Press Enter

You should see your user object with the email and password!

### Step 4: Login
1. Click "Login"
2. Enter:
   - Email: **test@email.com**
   - Password: **password123**
3. Click "Login"
4. **Watch the console!**

### Step 5: Read Console Messages

**Look for:**
- "Login attempt:" - shows what you're logging in with
- "Stored user object:" - shows what's in localStorage
- "Email match:" - true or false
- "Password mismatch!" - if passwords don't match
- "LOGIN SUCCESS" - if it worked!

## What to Check in Console

**If you see "Password mismatch":**
- Check the "stored" vs "input" values
- Make sure you're using the EXACT same password

**If you see "Email mismatch":**
- Check the emails match exactly
- System converts to lowercase automatically

**If you see "LOGIN SUCCESS":**
- ✅ It worked! You're logged in!

## Quick Test

Try this in console:
```javascript
// Check user
const user = JSON.parse(localStorage.getItem('kotaUser'));
console.log('User:', user);

// Test login
const email = 'test@email.com';
const password = 'password123';

console.log('Email match:', user.email === email.toLowerCase().trim());
console.log('Password match:', user.password === password);
```

---

## 🚨 OPEN CONSOLE (F12) NOW!

The console will tell you exactly what's wrong with the login!

