# Firebase Setup Guide

This guide will help you connect your website to Firebase so that all user registrations and logins are stored online and users can access their accounts from anywhere.

## ✅ What's Already Done

1. **Backend Firebase Integration**: The server already has Firebase Admin SDK configured
2. **Firestore Database**: User data is stored in Firebase Firestore
3. **Frontend Firebase Config**: Firebase client SDK configuration is set up
4. **Authentication Service**: Firebase Authentication service is integrated

## 📋 Setup Steps

### Step 1: Create .env File

Create a `.env` file in the root directory of your project with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase Configuration
FIREBASE_PROJECT_ID=kotapal-1e8f6
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json

# Frontend URL
FRONTEND_URL=http://localhost:3001
BASE_URL=http://localhost:3000
```

**Note**: The `firebase-key.json` file already exists in your project root, so you don't need to download it again.

### Step 2: Install Firebase in Frontend

Navigate to the frontend directory and install Firebase:

```bash
cd frontend
npm install firebase
```

### Step 3: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kotapal-1e8f6**
3. Navigate to **Authentication** in the left sidebar
4. Click **Get started** if you haven't enabled it yet
5. Go to the **Sign-in method** tab
6. Enable **Email/Password** provider
7. Click **Save**

### Step 4: Verify Firestore Rules

1. In Firebase Console, go to **Firestore Database**
2. Click on the **Rules** tab
3. Ensure you have appropriate security rules. For development, you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own blocks
    match /blocks/{blockId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Add more rules as needed for other collections
  }
}
```

**⚠️ Important**: Update these rules for production to be more restrictive!

### Step 5: Start the Server

1. Make sure your `.env` file is created with the correct values
2. Start the backend server:

```bash
npm start
```

You should see output like:
```
✅ Firebase initialized successfully - Project ID: kotapal-1e8f6
✅ Firestore ready - data will be saved to Firebase
✅ Firebase is now active - all data will be saved to Firebase Firestore
```

### Step 6: Start the Frontend

In a new terminal:

```bash
cd frontend
npm start
```

## 🔍 How It Works

### Registration Flow

1. User fills out the registration form
2. Frontend sends request to backend API (`/api/auth/register`)
3. Backend creates user in Firebase Firestore
4. Backend generates JWT token
5. User data is stored in Firebase and returned to frontend
6. Frontend stores token and user data locally

### Login Flow

1. User enters email and password
2. Frontend sends request to backend API (`/api/auth/login`)
3. Backend verifies credentials against Firebase Firestore
4. Backend generates JWT token
5. User data is returned to frontend
6. Frontend stores token and user data locally

### Fallback Mechanism

The frontend also supports Firebase Authentication directly as a fallback:
- If the backend API is unavailable, it will try Firebase Authentication
- This ensures users can still register/login even if the backend is down
- All data is still stored in Firebase Firestore

## 🧪 Testing

1. **Register a new user**:
   - Go to `/register`
   - Fill out the form
   - Submit
   - Check Firebase Console → Firestore → `users` collection to see the new user

2. **Login**:
   - Go to `/login`
   - Enter your credentials
   - You should be logged in and redirected to dashboard

3. **Verify in Firebase**:
   - Go to Firebase Console → Firestore Database
   - Check the `users` collection
   - You should see all registered users

## 📁 File Structure

```
.
├── .env                          # Environment variables (create this)
├── firebase-key.json             # Firebase Admin SDK credentials (already exists)
├── server.js                     # Backend server with Firebase integration
├── src/
│   └── store.js                  # Firebase Firestore operations
└── frontend/
    └── src/
        ├── config/
        │   └── firebase.js       # Firebase client configuration
        ├── services/
        │   └── firebaseAuth.js   # Firebase Authentication service
        └── hooks/
            └── useAuth.js        # Authentication hook with Firebase support
```

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Never commit `firebase-key.json`** - Keep it secure
3. **Update Firestore rules** for production
4. **Change JWT_SECRET** in production
5. **Use HTTPS** in production

## 🐛 Troubleshooting

### Firebase not initializing

- Check that `.env` file exists and has correct values
- Verify `firebase-key.json` exists in project root
- Check that `FIREBASE_PROJECT_ID` matches your Firebase project

### Users not saving to Firebase

- Check server logs for Firebase initialization messages
- Verify Firestore rules allow writes
- Check that `GOOGLE_APPLICATION_CREDENTIALS` path is correct

### Frontend Firebase errors

- Make sure you ran `npm install firebase` in the frontend directory
- Check browser console for errors
- Verify Firebase config in `frontend/src/config/firebase.js`

## ✅ Verification Checklist

- [ ] `.env` file created with Firebase configuration
- [ ] Firebase installed in frontend (`npm install firebase`)
- [ ] Email/Password authentication enabled in Firebase Console
- [ ] Firestore rules configured
- [ ] Server starts and shows "Firebase initialized successfully"
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] User appears in Firestore `users` collection

## 🎉 Success!

Once all steps are complete, your website is fully connected to Firebase! All user registrations and logins will be stored online, and users can access their accounts from anywhere.

