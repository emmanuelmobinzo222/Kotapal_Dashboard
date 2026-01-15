# Database Quick Start Guide

## Current Status

Your app is **currently using Local JSON database** (default). This is fine for development but not suitable for production.

## Quick Setup: Firebase Firestore (Recommended)

### Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "kota-platform"
4. Click through the setup (skip Analytics for now)
5. Wait for project creation

### Step 2: Enable Firestore (2 minutes)

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a location (US Central recommended)
5. Click "Enable"

### Step 3: Get Service Account Key (3 minutes)

1. Click gear icon → "Project settings"
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Rename it to `firebase-key.json`
6. Place it in your project root

### Step 4: Update .env (1 minute)

Open your `.env` file and add:

```env
FIREBASE_PROJECT_ID=kota-platform  # Your project ID from Firebase
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
```

### Step 5: Restart Server

Stop your current server (Ctrl+C) and restart:

```bash
npm start
```

You should see:
```
✓ Firebase initialized successfully
Database initialized - using: Firebase
```

### Step 6: Test

1. Register a new user on your app
2. Open Firebase Console → Firestore Database
3. You should see your user in the `users` collection!

## Quick Setup: Supabase (Alternative)

### Step 1: Create Supabase Project (3 minutes)

1. Go to https://supabase.com/
2. Sign up (free)
3. Click "New Project"
4. Name it "kota-platform"
5. Set a database password (save it!)
6. Select region
7. Click "Create new project"

### Step 2: Get API Credentials (1 minute)

1. Wait for project to finish creating
2. Click "Settings" → "API"
3. Copy these values:
   - **URL**: `https://xxxxx.supabase.co`
   - **service_role** key (secret)

### Step 3: Create Database Tables (5 minutes)

1. In Supabase, click "SQL Editor"
2. Copy and paste the SQL from `SUPABASE_SETUP.md` (scroll to "Create Database Tables" section)
3. Click "Run"
4. Wait for "Success" message

### Step 4: Update .env (1 minute)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Step 5: Restart Server

```bash
npm start
```

You should see:
```
✓ Supabase initialized successfully
Database initialized - using: Supabase
```

## Important Notes

1. **Only configure ONE database** (Firebase OR Supabase, not both)
2. **Don't commit your `firebase-key.json`** to Git (add to .gitignore)
3. **Test mode in Firebase** expires after 30 days - update security rules for production
4. Both databases have **generous free tiers** suitable for production

## Verification

After setup, check the server logs on startup:

✅ **Success:**
```
✓ Firebase initialized successfully
Database initialized - using: Firebase
```

❌ **Still using local:**
```
Firebase not configured. Using local JSON database.
Database initialized - using: Local JSON
```

## Need Help?

- **Firebase**: See `FIREBASE_SETUP.md` for detailed instructions
- **Supabase**: See `SUPABASE_SETUP.md` for detailed instructions  
- **Comparison**: See `DATABASE_COMPARISON.md` to choose

## Current Database: Local JSON

Your app works perfectly with local JSON for now! Upgrade to Firebase or Supabase when you're ready for production.

