# Firebase Config Example

This shows you exactly what your Firebase config should look like after you configure it.

## ❌ BEFORE (Current - Not Working)

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## ✅ AFTER (What It Should Look Like)

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz",
    authDomain: "kotapal-abc123.firebaseapp.com",
    projectId: "kotapal-abc123",
    storageBucket: "kotapal-abc123.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

## 📝 What Each Value Looks Like

- **apiKey**: Starts with "AIzaSy" followed by letters and numbers (about 39 characters)
- **authDomain**: Your project ID + ".firebaseapp.com"
- **projectId**: Usually your project name with numbers/letters (e.g., "kotapal-abc123")
- **storageBucket**: Usually your project ID + ".appspot.com"
- **messagingSenderId**: A long number (e.g., "123456789012")
- **appId**: Starts with "1:" followed by numbers, "web:", and more characters

## 🔍 Where to Find These Values

1. **Firebase Console**: https://console.firebase.google.com/
2. **Project Settings** (gear icon ⚙️)
3. **General tab**
4. **Scroll to "Your apps"**
5. **Click on your web app** (or create one)
6. **Copy the config object** - it shows all 6 values!

## ⚠️ Important Notes

- **All values must be in quotes** (strings)
- **No extra spaces** before or after the values
- **Replace ALL 6 values** - don't leave any "YOUR_" placeholders
- **Case sensitive** - copy exactly as shown in Firebase Console

## ✅ Quick Check

After updating, make sure:
- [ ] No "YOUR_" text remains
- [ ] All 6 values are replaced
- [ ] Values are in quotes
- [ ] Commas are correct
- [ ] File is saved

Then refresh your browser and try signing up!
