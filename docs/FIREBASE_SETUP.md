# Firebase Setup Guide

## Overview
Firebase Firestore is a NoSQL cloud database that provides real-time data synchronization, scalability, and offline support.

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "kota-platform")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (test mode for development)
4. Select a location (choose closest to your users)
5. Click "Enable"

### 3. Generate Service Account Key

1. Go to Project Settings (gear icon) → "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Save it in your project root as `firebase-key.json` (add to .gitignore!)

### 4. Configure Environment Variables

Add to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json

# OR Use Base64 encoded key for deployment
# FIREBASE_ADMIN_SDK_KEY=base64-encoded-service-account-json
```

### 5. Create Firestore Collections

Firestore will automatically create collections when you first add data. The app uses these collections:

- `users` - User accounts and profiles
- `blocks` - SmartBlocks created by users
- `integrations` - Affiliate integrations
- `clicks` - Click tracking analytics
- `passwordResetTokens` - Password reset tokens
- `analytics` - Aggregated analytics data

### 6. Set Firestore Security Rules (Production)

Go to Firestore Database → Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Blocks belong to users
    match /blocks/{blockId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
    }
    
    // Other collections
    match /integrations/{integrationId} {
      allow read, write: if request.auth != null;
    }
    
    match /clicks/{clickId} {
      allow read: if request.auth != null;
      allow write: if true; // Public for click tracking
    }
    
    match /{document=**} {
      allow read, write: if false; // Deny everything else by default
    }
  }
}
```

## Migration from Local JSON

The app automatically falls back to local JSON if Firebase is not configured. To migrate:

1. Start the server with Firebase configured
2. Data will be written to Firestore
3. Existing local data will remain but won't be used

## Testing

Check Firebase Console → Firestore Database to see your data appearing in real-time.

## Benefits

- **Scalability**: Handles millions of documents
- **Real-time**: Automatic synchronization
- **Offline**: Works without internet
- **Security**: Role-based access control
- **Performance**: Fast querying and indexing

## Troubleshooting

**Error: "Permission denied"**
- Check service account key is valid
- Verify FIREBASE_PROJECT_ID matches your project

**Error: "Cannot find module firebase-admin"**
- Run: `npm install`

**Data not appearing**
- Check Firestore rules allow writes
- Verify collections are created
- Check server logs for errors

