# Admin Dashboard – Firestore Setup

The admin dashboard is connected to Firebase Firestore. Follow these steps to enable it.

## 1. Deploy Firestore Rules

Deploy the security rules to your Firebase project:

```bash
firebase deploy --only firestore
```

Or copy the contents of `firestore.rules` into **Firebase Console → Firestore → Rules** and publish.

## 2. Create Admin User

Create an admin account in Firebase Authentication:

1. Open the main KotaPal app and click **Login** → **Admin login**
2. Or go to **Firebase Console → Authentication → Users**
3. Add a user with email `admin@kotapal.com` and password `Admin123!` (or your chosen password)

Alternatively, use the main app’s **Sign Up** form to register `admin@kotapal.com` with your desired password.

## 3. Enable Firestore

1. Go to **Firebase Console → Firestore Database**
2. Create a database if needed (start in production or test mode)
3. The `users` and `blocks` collections are created automatically when users sign up and create blocks

## 4. Data Flow

- **Main app**: On signup/login, user data is written to `users/{uid}`. Blocks are written to `blocks` when created or updated.
- **Admin dashboard**: Logs in with Firebase Auth and reads from `users` and `blocks` in Firestore.

## 5. Admin Login

- **URL**: `admin.html` or click **Admin login** in the main app’s login modal
- **Email**: `admin@kotapal.com` (must exist in Firebase Auth)
- **Password**: The password you set when creating the admin user
