# Admin Dashboard Setup

To see **all registered users** in the admin dashboard, deploy Firestore rules and the Cloud Function.

## Step 1: Deploy

From the project root:

```bash
firebase deploy --only firestore
firebase deploy --only functions
```

Or: `firebase deploy`

## Step 2: Add your admin email

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database**
2. Create collection `config` (if needed)
3. Create document `admins` under `config`
4. Add field `emails` (type: **array**) with your email(s), e.g.:
   ```
   ["admin@kotapal.com", "wreck@gmail.com", "your@email.com"]
   ```

**Super-admins** (work without config/admins): `admin@kotapal.com`, `wreck@gmail.com`, `earlhugue@gmail.com`, `emmanuelmobinzo222@gmail.com`, `emmanuelmobinzo21@gmail.com`

## Step 3: Sign in

Refresh the admin page and sign in with an email in the list. You will see **all users** from Firebase Auth.
