# Firebase Client-Side Setup

## Configuration Needed

The HTML file needs Firebase configuration. You need to:

1. Get Firebase Web App configuration from Firebase Console
2. Update the config in `KotaPal simple/index.html`

## Steps to Get Firebase Config:

1. Go to: https://console.firebase.google.com/
2. Select project: **kotapal-1e8f6**
3. Click the gear icon → **Project settings**
4. Scroll down to **"Your apps"** section
5. If no web app exists, click **"Add app"** → Web (</> icon)
6. Register app with nickname (e.g., "kotapal-web")
7. Copy the configuration object

## Update HTML File:

Find this section in `KotaPal simple/index.html`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "kotapal-1e8f6.firebaseapp.com",
    projectId: "kotapal-1e8f6",
    storageBucket: "kotapal-1e8f6.firebasestorage.app",
    messagingSenderId: "116874636136061943425",
    appId: "YOUR_APP_ID_HERE"
};
```

Replace with your actual config from Firebase Console.

## Enable Email/Password Auth in Firebase:

1. Go to Firebase Console → Authentication
2. Click **"Get started"** if not enabled
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **Save**

---

Once configured, signup and login will use Firebase!

