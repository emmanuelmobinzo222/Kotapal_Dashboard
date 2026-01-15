# Firebase Setup - Complete Step-by-Step Guide

## Overview
This guide will walk you through setting up Firebase Firestore for your Kota Platform in about 10-15 minutes.

## Prerequisites
- Google account (Gmail)
- Kota Platform project files

---

## PART 1: Create Firebase Project

### Step 1: Go to Firebase Console
1. Open your browser
2. Go to: https://console.firebase.google.com/
3. Sign in with your Google account

### Step 2: Create New Project
1. Click the **"Add project"** button (or "+" icon)
2. **Project name**: Enter `kota-platform` (or any name you prefer)
3. Click **"Continue"**

### Step 3: Google Analytics (Optional)
1. You'll see "Configure Google Analytics for this project"
2. **Toggle it OFF** (not needed for this setup)
   - Or leave it ON if you want analytics later
3. Click **"Create project"**

### Step 4: Wait for Setup
1. Wait 30-60 seconds for Firebase to create your project
2. You'll see "Your new project is ready"
3. Click **"Continue"**

---

## PART 2: Enable Firestore Database

### Step 5: Navigate to Firestore
1. In the Firebase Console, look at the left sidebar
2. Click **"Build"** (if menu is collapsed, click the ≡ icon)
3. Click **"Firestore Database"**

### Step 6: Create Database
1. You'll see "Cloud Firestore"
2. Click **"Create database"** button

### Step 7: Security Rules
1. **Select "Start in test mode"** (for development)
   - This allows reads/writes for 30 days
   - We'll add proper security rules later
2. Click **"Next"**

### Step 8: Choose Location
1. **Select a location** closest to you or your users:
   - `us-central` (United States)
   - `europe-west` (Europe)
   - `asia-south1` (Asia)
   - Or choose closest to you
2. Click **"Enable"**
3. Wait 1-2 minutes for database to be created

✅ **Database created!** You should see the Firestore interface

---

## PART 3: Get Service Account Key

### Step 9: Open Project Settings
1. In the Firebase Console, look at the top left
2. Click the **gear icon** (⚙️) next to "Project Overview"
3. Select **"Project settings"**

### Step 10: Generate Private Key
1. Click the **"Service accounts"** tab
2. You'll see "Service accounts for server SDKs"
3. Click **"Generate new private key"** button
4. A popup will appear: "This will allow anyone with this key to read and write your database"
5. Click **"Generate key"**

### Step 11: Download Key File
1. A JSON file will download automatically
2. The filename will be something like: `kota-platform-xxxxxxxxxxxx-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **IMPORTANT:** Keep this file safe and secret!

---

## PART 4: Add Key to Your Project

### Step 12: Rename the File
1. Find the downloaded JSON file (usually in your Downloads folder)
2. Rename it to: `firebase-key.json`
3. Make it simple and easy to remember

### Step 13: Move to Project Directory
1. Copy `firebase-key.json`
2. Paste it into your Kota Platform folder:
   ```
   C:\Users\emman\Downloads\wetransfer_kotapal_2025-09-22_1618\firebase-key.json
   ```

### Step 14: Add to .gitignore (IMPORTANT!)
1. Open your project in a text editor
2. Find or create a file called `.gitignore`
3. Add this line:
   ```
   firebase-key.json
   ```
4. Save the file

⚠️ **NEVER commit this key to Git/GitHub - it gives full access to your database!**

---

## PART 5: Get Your Project ID

### Step 15: Copy Project ID
1. Still in Firebase Console → Project settings
2. Look for **"Project ID"** under the "General" tab
3. It looks like: `kota-platform` or `kota-platform-12345`
4. **Copy this value** - you'll need it in the next step

---

## PART 6: Configure Environment Variables

### Step 16: Update .env File
1. In your Kota Platform folder, find the `.env` file
2. Open it in a text editor (Notepad, VS Code, etc.)
3. Look for these lines:
   ```env
   FIREBASE_PROJECT_ID=your-firebase-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
   ```
4. Update them:
   ```env
   # Replace with YOUR Project ID from Step 15
   FIREBASE_PROJECT_ID=kota-platform
   
   # Path to your key file (should be correct already)
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
   ```
5. Save the file

### Step 17: Verify Your .env File
Your `.env` file should now have:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FIREBASE_PROJECT_ID=kota-platform  # Your actual project ID
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
FRONTEND_URL=http://localhost:3001
```

---

## PART 7: Start Your Application

### Step 18: Install Dependencies (if not done)
Open PowerShell in your project folder and run:
```powershell
npm install
```

### Step 19: Start the Server
```powershell
.\start-server.bat
```

Or manually:
```powershell
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Step 20: Check for Success
When the server starts, you should see:
```
✓ Firebase initialized successfully
Database initialized - using: Firebase
```

If you see this, **Firebase is working!** ✅

If you see:
```
Firebase not configured. Using local JSON database.
Database initialized - using: Local JSON
```

Then check:
- Did you update the `.env` file correctly?
- Is `firebase-key.json` in the right location?
- Is the Project ID correct?

---

## PART 8: Test Your Setup

### Step 21: Test Database Connection
1. Make sure both servers are running
2. Go to: http://localhost:3001
3. **Register a new account**
4. Fill in the registration form
5. Click "Create account"

### Step 22: Verify in Firebase Console
1. Go back to Firebase Console
2. Click **"Firestore Database"** in the left sidebar
3. You should see:
   - A collection called **"users"**
   - Your new user data inside!

### Step 23: Test More Features
1. Create a SmartBlock
2. Go back to Firebase Console
3. You should see a **"blocks"** collection
4. Your data is being saved to Firebase! 🎉

---

## PART 9: Security Rules (For Production)

### Step 24: Update Security Rules
After 30 days, test mode expires. Update the rules:

1. In Firebase Console, go to **"Firestore Database"**
2. Click the **"Rules"** tab
3. Replace the code with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && 
                             request.auth.uid == userId;
       }
       
       // Blocks belong to users
       match /blocks/{blockId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
       }
       
       // Allow authenticated users to access their data
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. Click **"Publish"**

⚠️ **Important for Production:** These are basic rules. Update them based on your security needs.

---

## Troubleshooting

### Error: "Cannot find module firebase-admin"
**Solution:**
```powershell
npm install
```

### Error: "Permission denied" or "Unauthorized"
**Solution:**
- Check your service account key is correct
- Verify Project ID in `.env` matches Firebase Console
- Make sure `firebase-key.json` exists in project root

### Error: "Collection doesn't exist"
**Solution:**
- This is normal! Collections are created automatically when you add data
- Try creating a user first

### Still using Local JSON?
**Solution:**
1. Stop the server (Ctrl+C)
2. Check `.env` file has correct values
3. Check `firebase-key.json` exists
4. Restart the server

---

## Success Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Service account key downloaded
- [ ] `firebase-key.json` in project folder
- [ ] `.env` file updated with Project ID
- [ ] Added `firebase-key.json` to `.gitignore`
- [ ] Server shows "✓ Firebase initialized successfully"
- [ ] Can register users and see them in Firebase Console
- [ ] Database working with real-time data

---

## Next Steps

✅ **You're all set!** Your app is now using Firebase Firestore.

### What happens now:
1. **All data is saved to Firebase** (not local JSON)
2. **Data persists across server restarts**
3. **You can see data in Firebase Console** in real-time
4. **Multiple users can use the app** simultaneously
5. **Data is backed up automatically** by Google

### Monitoring:
- Check Firebase Console to see your data
- Monitor usage in Firebase Console → "Usage and billing"
- Free tier is generous (50K reads, 20K writes per day)

### When you need to scale:
- Firebase automatically scales
- Upgrade plan only when you exceed free tier
- Very affordable pricing for higher usage

---

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Kota Platform Docs: See other .md files in project
- Firebase Support: https://firebase.google.com/support

---

**🎉 Congratulations! Firebase is now configured and working!**

