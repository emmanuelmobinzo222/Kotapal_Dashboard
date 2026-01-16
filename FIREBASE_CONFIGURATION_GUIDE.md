# Firebase Configuration Guide - Quick Setup

## ⚠️ IMPORTANT: Configure Firebase Before Use

Your application is ready, but **Firebase must be configured** before users can sign up, login, or reset passwords.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if you haven't enabled it yet
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. **Enable** the first toggle (Email/Password)
6. Click **"Save"**

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app, click the **web icon** (`</>`) to add one
5. Register your app (give it a nickname like "KotaPal Web")
6. **Copy the Firebase configuration object**

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Update index.html

1. Open `index.html` in your editor
2. Find the `firebaseConfig` object (around line 2121)
3. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Add Authorized Domains (For Production)

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **"Authorized domains"**
3. Add your production domain (e.g., `yourusername.github.io`)
4. Localhost is automatically authorized for development

## Step 6: Test

1. Open `index.html` in your browser
2. Click "Login" or "Get Started"
3. Try signing up with a test email
4. Check the browser console (F12) for any errors

## Common Issues & Solutions

### "Firebase is not configured"
- **Solution**: Update the `firebaseConfig` object in `index.html` with your Firebase project values

### "Sign up failed: auth/operation-not-allowed"
- **Solution**: Enable Email/Password authentication in Firebase Console > Authentication > Sign-in method

### "Network error" or "Failed to fetch"
- **Solution**: 
  - Check your internet connection
  - Verify Firebase config values are correct
  - Check browser console for specific errors

### Password reset email not received
- **Solution**:
  - Check spam/junk folder
  - Verify email address is correct
  - Wait a few minutes (emails can be delayed)
  - Check Firebase Console > Authentication > Users to see if user exists

### "Invalid API key"
- **Solution**: Make sure you copied the entire API key correctly (no extra spaces or characters)

## Testing Checklist

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Firebase config updated in `index.html`
- [ ] Test sign up with a new email
- [ ] Test login with created account
- [ ] Test password reset
- [ ] Check browser console for errors

## Security Notes

- **Never commit your Firebase config to public repositories** in production
- For production, consider using environment variables or a config service
- The API key is safe to expose in client-side code (Firebase has security rules)

## Need Help?

- Check browser console (F12) for error messages
- See `FIREBASE_SETUP.md` for detailed instructions
- Firebase Documentation: https://firebase.google.com/docs/auth/web/start
