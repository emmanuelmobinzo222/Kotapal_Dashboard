# 🔧 Fixing Login Error

## The Problem

You're getting: `auth/invalid-credential` error

This happens because:
1. You created an account with localStorage (not Firebase)
2. Now trying to login with Firebase (different system)
3. Firebase doesn't have that user account

## Solution: Use localStorage for existing users

The login already checks localStorage first! Here's what to do:

### Option 1: Use localStorage (Works Now)

**If you signed up before:**
1. Make sure you use the **exact same** email and password
2. The system checks localStorage first
3. It should work without Firebase

### Option 2: Sign up with Firebase (New Users)

**For new signups:**
1. Enable Email/Password in Firebase Console first
2. Then sign up - it will create a Firebase account
3. Then login will work with Firebase

## Steps to Enable Firebase Auth

1. Go to: https://console.firebase.google.com/
2. Select: kotapal-1e8f6
3. Go to: Authentication
4. Click: Get Started (if first time)
5. Go to: Sign-in method
6. Enable: Email/Password
7. Click: Save

## Testing

### Test localStorage login:
1. Use the same email/password you signed up with
2. Click Login
3. Should work without Firebase

### Test Firebase signup (after enabling):
1. Enable Email/Password in Firebase Console
2. Sign up with NEW credentials
3. Login with those credentials
4. Should work with Firebase

## What Changed

The login now:
1. Checks localStorage first (your old accounts work)
2. Tries Firebase second (for new accounts)
3. Falls back gracefully if Firebase fails

---

**Your existing localStorage accounts still work!** Just use the same email/password you signed up with.

