// Firebase Configuration
// Replace these values with your Firebase project configuration
// Get these from: Firebase Console > Project Settings > General > Your apps

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
// Note: This will be initialized in the HTML files using the CDN version
// This file is for reference - actual initialization happens in HTML

// To get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select an existing one
// 3. Go to Project Settings (gear icon)
// 4. Scroll down to "Your apps" section
// 5. Click on the web app icon (</>) or add a web app
// 6. Copy the config object values

// Enable Email/Password authentication in Firebase Console:
// 1. Go to Authentication > Sign-in method
// 2. Enable "Email/Password" provider
// 3. Optionally enable "Email link (passwordless sign-in)" if desired
