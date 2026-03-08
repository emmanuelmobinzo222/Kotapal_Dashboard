# Fix "Permission denied" – Admin Dashboard Setup

To see **all users** in the admin dashboard, you must deploy Firestore rules and add your admin email.

## Step 1: Deploy Firestore rules

From the project root (where `firebase.json` is):

```bash
firebase deploy --only firestore
```

If Firebase CLI is not installed:

```bash
npm install -g firebase-tools
firebase login
firebase use kotapal-1e8f6
firebase deploy --only firestore
```

## Step 2: Add your admin email to config/admins

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database**
2. Create collection `config` (if it doesn’t exist)
3. Create document `admins` under `config`
4. Add field `emails` (type: array) with your admin email(s), e.g.:
   - `["admin@kotapal.com", "your@email.com"]`

**Important:** Use the exact email you use to sign in. Add both `Your@Email.com` and `your@email.com` if you’re unsure about case.

## Step 3: First admin (admin@kotapal.com)

If `config/admins` does not exist yet, only `admin@kotapal.com` can read it. Options:

- **A)** Sign up as `admin@kotapal.com` in the main app, then add that email to `config/admins` in Firestore
- **B)** Create `config/admins` manually in Firebase Console with `emails: ["admin@kotapal.com"]`, then sign up as that user

## Step 4: Refresh the admin dashboard

After deploying rules and updating `config/admins`, refresh the admin page and sign in again. You should see all users from the database.
