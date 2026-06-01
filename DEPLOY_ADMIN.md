# Fix "Permission denied" – Admin Dashboard Setup

To see **all users** (including every Firebase Auth user) in the admin dashboard and perform admin actions, deploy Firestore rules and the Cloud Function.

## Super-admins (no config needed)

These emails have full admin access:

- `admin@kotapal.com`
- `wreck@gmail.com`
- `earlhugue@gmail.com`
- `emmanuelmobinzo222@gmail.com`
- `emmanuelmobinzo21@gmail.com`

Sign in with any of these to access the admin dashboard and see **all users** from Firebase Auth.

## Step 1: Deploy Firestore rules and Cloud Function

From the project root (where `firebase.json` is):

```bash
firebase deploy --only firestore
firebase deploy --only functions
```

Or deploy both at once:

```bash
firebase deploy
```

If Firebase CLI is not installed:

```bash
npm install -g firebase-tools
firebase login
firebase use kotapal-1e8f6
firebase deploy --only firestore
firebase deploy --only functions
```

**Note:** The Cloud Function `listAllUsers` lists every user from Firebase Authentication, so the admin dashboard shows all users (new and old) even if they don't have a Firestore document yet.

## Step 2 (optional): Add more admins via config/admins

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database**
2. Create collection `config` (if it doesn't exist)
3. Create document `admins` under `config`
4. Add field `emails` (type: array) with admin email(s)

Super-admins work without this; config/admins is for adding more admins later.

## Step 3: Refresh the admin dashboard

After deploying, refresh the admin page and sign in with `admin@kotapal.com`, `wreck@gmail.com`, or `earlhugue@gmail.com`. You should see **all users** from Firebase Auth and be able to:

- **Suspend** / **Unsuspend** users
- **Delete** users (moved to recycle bin; **Undo** within 30 seconds)
- **Recycle Bin** (Super Admin only: `admin@kotapal.com`) — restore or permanently delete
- **Change plan** for any user

Deploy updated functions for recycle bin cloud actions:

```bash
firebase deploy --only functions,firestore
```
