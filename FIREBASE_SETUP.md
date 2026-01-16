# Firebase Authentication Setup Guide

This guide will help you configure Firebase Authentication for the KOTA PAL application.

## Prerequisites

1. A Google account
2. Access to Firebase Console (https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "KotaPal")
   - Choose whether to enable Google Analytics (optional)
   - Click "Create project"

## Step 2: Add a Web App to Your Firebase Project

1. In your Firebase project, click the web icon (`</>`) or "Add app" > "Web"
2. Register your app:
   - Enter an app nickname (e.g., "KotaPal Web")
   - You can skip Firebase Hosting setup for now
   - Click "Register app"
3. **Copy the Firebase configuration object** - you'll need these values:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## Step 3: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Email/Password**
3. Enable the first toggle (Email/Password)
4. Optionally enable "Email link (passwordless sign-in)" if desired
5. Click **Save**

## Step 4: Configure Your Application

### Update Firebase Configuration

You need to update the Firebase configuration in **two files**:

1. **`index.html`** - Find the `firebaseConfig` object (around line 1277)
2. **`dashboard.html`** - Find the `firebaseConfig` object (around line 978)

Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
    projectId: "YOUR_ACTUAL_PROJECT_ID",
    storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID"
};
```

### Important Notes

- **Both files must have the same configuration**
- Keep your API keys secure - never commit them to public repositories
- For production, consider using environment variables or a config service

## Step 5: Configure Authorized Domains (Optional but Recommended)

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `yourdomain.com`)
3. Localhost is automatically authorized for development

## Step 6: Test the Authentication

1. Open `index.html` in your browser
2. Click "Login" or "Get Started"
3. Try creating a new account:
   - Enter your name, email, and password (minimum 6 characters)
   - Click "Sign Up"
4. You should be redirected to the dashboard
5. Test password reset:
   - Click "Forgot Password?"
   - Enter your email
   - Check your email for the reset link

## Features Implemented

✅ **User Sign Up**
- Email and password registration
- Display name support
- Automatic profile creation

✅ **User Login**
- Email and password authentication
- Session persistence
- Automatic redirect to dashboard

✅ **Password Reset**
- Email-based password reset
- Secure reset link generation
- User-friendly error messages

✅ **Dashboard Protection**
- Automatic authentication check
- Redirect to login if not authenticated
- User profile display

✅ **Logout**
- Secure sign out
- Session cleanup
- Redirect to home page

## Security Best Practices

1. **Never expose your Firebase config in client-side code for production**
   - Consider using environment variables
   - Use Firebase App Check for additional security

2. **Enable Firebase App Check** (Recommended)
   - Go to Firebase Console > App Check
   - Register your app
   - This helps protect your backend resources

3. **Set up Firebase Security Rules**
   - Configure Firestore/Realtime Database rules
   - Restrict access based on authentication

4. **Use HTTPS in Production**
   - Firebase requires HTTPS for production domains
   - Localhost is exempt for development

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've initialized Firebase with the correct config
- Verify all config values are correct

### "Firebase: Error (auth/email-already-in-use)"
- The email is already registered
- Use "Forgot Password" to reset, or use a different email

### "Firebase: Error (auth/weak-password)"
- Password must be at least 6 characters
- Add more characters to meet the requirement

### "Firebase: Error (auth/user-not-found)"
- No account exists with that email
- Sign up first, or check the email address

### Password Reset Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes (emails can be delayed)
- Check Firebase Console > Authentication > Users to see if the user exists

## Next Steps

1. **Set up Firestore Database** (Optional)
   - Store user profiles and preferences
   - Track user activity and analytics

2. **Add Email Verification** (Optional)
   - Send verification emails
   - Require verified emails for certain actions

3. **Implement Social Login** (Optional)
   - Google Sign-In
   - Facebook Login
   - Other providers

4. **Add User Profile Management**
   - Update display name
   - Change password
   - Update email address

## Support

For Firebase-specific issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Support](https://firebase.google.com/support)

For application-specific issues, check the browser console for error messages.
