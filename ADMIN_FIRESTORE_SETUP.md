# Admin Dashboard – Firestore Setup

The admin dashboard is connected to Firebase Firestore. Follow these steps to enable it.

## 1. Deploy Firestore Rules

Deploy the security rules to your Firebase project:

```bash
firebase deploy --only firestore
```

Or copy the contents of `firestore.rules` into **Firebase Console → Firestore → Rules** and publish.

## 2. Create First Admin User

**Option A – Create Admin from Login Page (recommended)**

1. Open `admin.html` (or click **Admin login** from the main app)
2. Enter your email (e.g. `admin@kotapal.com`) and a password (at least 6 characters)
3. Click **Sign In**
4. If you see "Invalid credentials", a **Create Admin Account** button will appear
5. Click **Create Admin Account** – this creates the user in Firebase Auth, adds them to `config/admins`, and creates their profile in `users/{uid}` so they appear in User Management

**Option B – Manual setup**

- Use the main app's **Sign Up** form to register `admin@kotapal.com` with your desired password
- Then add the email to Firestore: create document `config/admins` with field `emails: ["admin@kotapal.com"]`

## 3. Enable Firestore

1. Go to **Firebase Console → Firestore Database**
2. Create a database if needed (start in production or test mode)
3. The `users`, `blocks`, and `config` collections are created automatically

## 4. Data Flow

- **Main app**: On signup/login, user data is written to `users/{uid}`. Blocks are written to `blocks` when created or updated.
- **Admin dashboard**: Logs in with Firebase Auth, reads from `users` and `blocks`, and manages admins via `config/admins`. When an admin logs in, their profile is automatically synced to `users/{uid}` so they appear in User Management.

## 5. Add More Admins

1. Log in to the admin dashboard
2. Go to **Settings**
3. Under **Admin Users**, enter the new admin's email and click **Add Admin**
4. The user must already have an account (sign up from the main app first) before they can log in as admin

## 6. Admin Login

- **URL**: `admin.html` or click **Admin login** in the main app's login modal
- **Email**: Any email in the `config/admins` list (or `admin@kotapal.com` as fallback)
- **Password**: The password set when the user was created

## 7. Troubleshooting: "No users found"

If User Management shows "No users found" even though users exist:

1. **Deploy Firestore rules**: Run `firebase deploy --only firestore` to ensure the latest rules are active.
2. **Check config/admins**: In Firebase Console → Firestore → `config` collection → `admins` document, ensure your admin email (exactly as you log in) is in the `emails` array. Add both variants (e.g. `Admin@example.com` and `admin@example.com`) if you use mixed case when logging in.
3. **Users collection**: Users are written to `users/{uid}` when they sign up or log in via the main app. Ensure users have signed up at least once through the main app.
4. **Refresh**: Click the **Refresh** button in the admin header to reload data from Firestore.
