# Debug Login Issue

## 🔍 To Diagnose the Problem

### Step 1: Check Console for Detailed Logs

When you try to login, the console should show:

```
🔐 LOGIN STARTED
Email: [your email]
Password: [your password]

Checking localStorage...
Login attempt: { email: "...", hasToken: true/false }
Stored user object: { email: "...", hasPassword: true/false }
```

### Step 2: Check What's in localStorage

Open console (F12) and type:

```javascript
// Check if user exists
const user = localStorage.getItem('kotaUser');
console.log('Stored user:', user);

// Parse it
const userObj = JSON.parse(user);
console.log('User object:', userObj);
console.log('User email:', userObj.email);
console.log('User has password:', !!userObj.password);
```

### Step 3: What You Should See

**IF YOU SIGNED UP WITH FIREBASE:**
```javascript
// User should have these fields:
{
  id: "abc123...",        // Firebase UID
  email: "your@email.com",
  password: "yourpassword",
  name: "Your Name",
  plan: "starter"
}
```

**IF YOU SIGNED UP WITH LOCALSTORAGE:**
```javascript
{
  id: "user_1234567890",
  email: "your@email.com",
  password: "yourpassword",
  name: "Your Name",
  plan: "starter"
}
```

### Step 4: Common Issues

**Issue 1: "No user in localStorage"**
- Solution: Sign up first!

**Issue 2: "Email mismatch"**
- Check console for exact emails being compared
- Try entering email exactly as you signed up

**Issue 3: "Password mismatch"**
- Check console for password comparison
- Try re-entering password exactly

**Issue 4: "Firebase authentication error"**
- Check Firebase Console
- Make sure Email/Password auth is enabled
- Make sure user was created in Firebase

### Step 5: Quick Test - Create New User

1. Clear localStorage:
```javascript
localStorage.clear()
```

2. Sign up with simple credentials:
- Email: test@test.com
- Password: test123
- Name: Test User

3. Check console for success messages

4. Login with same credentials

## 📊 Console Messages to Look For

### Good Sign (Login Should Work):
```
✅ LOGIN SUCCESS VIA LOCALSTORAGE
```
OR
```
✅ Firebase authentication successful: abc123...
```

### Bad Signs (Login Will Fail):
```
❌ Email mismatch!
❌ Password mismatch!
❌ Firebase login error: auth/invalid-credential
❌ All login methods failed!
```

## 🔧 Quick Fixes

### Fix 1: Re-signup
1. Open console: `localStorage.clear()`
2. Sign up again
3. Try login

### Fix 2: Check Firebase
1. Go to: https://console.firebase.google.com/
2. Project: kotapal-1e8f6
3. Authentication → Do you see your user?
4. If not, Firebase didn't create the user

### Fix 3: Manual localStorage Check
```javascript
// Clear everything
localStorage.clear()

// Sign up manually
const testUser = {
  id: 'user_test',
  email: 'test@test.com',
  password: 'test123',
  name: 'Test User',
  plan: 'starter',
  createdAt: new Date().toISOString()
}

localStorage.setItem('kotaUser', JSON.stringify(testUser))
localStorage.setItem('kotaToken', 'test_token')

// Now try logging in with test@test.com / test123
```

---

**Tell me what you see in the console when you try to login!**

