# Fix "Permission denied" – Deploy Firestore Rules

If the Admin Dashboard shows **Permission denied**, deploy the Firestore rules:

## Option 1: Firebase CLI (recommended)

```bash
firebase deploy --only firestore
```

If you haven't set up Firebase CLI:

1. Install: `npm install -g firebase-tools`
2. Login: `firebase login`
3. In your project folder: `firebase init firestore` (select existing project)
4. Deploy: `firebase deploy --only firestore`

## Option 2: Firebase Console (manual)

1. Open [Firebase Console](https://console.firebase.google.com/project/kotapal-1e8f6/firestore/rules)
2. Copy the contents of `firestore.rules` from this project
3. Paste into the Rules editor
4. Click **Publish**

## After deploying

1. **First admin must be admin@kotapal.com**: Create this user in Firebase Auth (Authentication → Add user) if needed.
2. **Bootstrap** (if config/admins doesn't exist): Log in to admin page with admin@kotapal.com, then click **Bootstrap Admin Config** in the banner.
3. **Add more admins**: Firebase Console → Firestore → `config` collection → `admins` document → add emails to the `emails` array (e.g. `["admin@kotapal.com", "your@email.com"]`).
4. **Security**: Only users in config/admins can access the admin dashboard. Normal users will see "Access denied" when they try to open the admin page.
