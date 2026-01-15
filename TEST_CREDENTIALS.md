# 🌍 Global Test Login Credentials

## ✅ Test User Credentials (Works from ANYWHERE)

These credentials are stored in **Firebase Firestore** and can be accessed from:
- ✅ Any device (mobile, laptop, tablet)
- ✅ Any location (South Africa, USA, Europe, Asia, etc.)
- ✅ Any IP address
- ✅ Any network

---

## 🔐 Login Credentials

**Email:** `test@kotapal.com`  
**Password:** `Test123!@#`

---

## 📝 How to Create the Test User

### Option 1: Using the Script (Recommended)

1. **Make sure your server is running:**
   - The server must be running with Firebase configured
   - Check that `.env` has `FIREBASE_PROJECT_ID=kotapal-1e8f6`

2. **Run the creation script:**
   ```bash
   node create-test-user.js
   ```
   
   Or double-click: `CREATE_GLOBAL_TEST_USER.bat`

3. **The script will:**
   - Initialize Firebase connection
   - Create the test user in Firebase Firestore
   - Display the credentials

### Option 2: Sign Up via Website

1. Go to your website: `https://kotapal.com` (or your domain)
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in the form:
   - **Name:** Test User
   - **Email:** test@kotapal.com
   - **Password:** Test123!@#
   - **Website:** https://test.example.com
   - **Plan:** Select any plan (Pro recommended)
4. Click **"Sign Up"**

---

## ✅ Verify the User is in Firebase

1. Go to: https://console.firebase.google.com/
2. Select project: **kotapal-1e8f6**
3. Click **"Firestore Database"**
4. Click **"users"** collection
5. You should see the user with email: `test@kotapal.com`

---

## 🌐 Test from Different Locations

### From South Africa:
1. Open browser
2. Go to: `https://kotapal.com`
3. Login with: `test@kotapal.com` / `Test123!@#`

### From USA/Europe/Anywhere:
1. Open browser (or use VPN to test from different country)
2. Go to: `https://kotapal.com`
3. Login with: `test@kotapal.com` / `Test123!@#`

### From Mobile Device:
1. Open mobile browser
2. Go to: `https://kotapal.com`
3. Login with: `test@kotapal.com` / `Test123!@#`

---

## 🔍 What This Proves

✅ **Data is stored in Firebase** (cloud database)  
✅ **Accessible from anywhere** (not just local machine)  
✅ **Works across devices** (mobile, laptop, tablet)  
✅ **Works across networks** (different IP addresses)  
✅ **Global accessibility** (any country, any location)

---

## 🛠️ Troubleshooting

### "Account Not Found" Error
- The user hasn't been created yet
- Run `node create-test-user.js` to create it
- Or sign up via the website

### "Incorrect Password" Error
- Make sure you're using: `Test123!@#`
- Password is case-sensitive

### Can't Connect to Server
- Make sure your server is running
- Check that Firebase is properly configured
- Verify `.env` file has correct Firebase credentials

---

## 📧 Alternative Test Credentials

If you want to create additional test users, you can use:

**User 2:**
- Email: `test2@kotapal.com`
- Password: `Test123!@#`

**User 3:**
- Email: `test3@kotapal.com`
- Password: `Test123!@#`

Just sign up with these emails via the website!

---

## ✅ Success Indicators

When you successfully log in, you should see:
- ✅ Dashboard loads
- ✅ Your name appears: "Test User"
- ✅ Plan shows: "Pro Plan" (or whatever plan you selected)
- ✅ All dashboard features work
- ✅ You can create blocks, view analytics, etc.

This confirms that:
- ✅ Authentication works globally
- ✅ Data is stored in Firebase
- ✅ Accessible from anywhere in the world

