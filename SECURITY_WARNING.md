# ⚠️ SECURITY WARNING

## Your Firebase Service Account Key Has Been Exposed

**IMMEDIATE ACTION REQUIRED:**

You have shared your Firebase service account private key in a conversation. This key provides full access to your Firebase project.

### Steps to Secure Your Project:

1. **Generate a New Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: **kotapal-1e8f6**
   - Settings ⚙️ → Project Settings → Service Accounts
   - Click **"Generate new private key"**
   - **Delete the old key** if possible

2. **Update GitHub Secret:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Update `FIREBASE_SERVICE_ACCOUNT` with the NEW JSON content
   - Delete the old secret and create a new one

3. **Revoke the Old Key (if possible):**
   - In Firebase Console → IAM & Admin → Service Accounts
   - Find the service account: `firebase-adminsdk-fbsvc@kotapal-1e8f6.iam.gserviceaccount.com`
   - Delete the old key

### Why This Matters:

- Anyone with this key can:
  - Deploy to your Firebase Hosting
  - Access your Firestore database
  - Modify your Firebase configuration
  - Access all Firebase services

### Best Practices:

- **Never** share service account keys in:
  - Chat conversations
  - Code repositories (even private ones)
  - Email
  - Public forums

- Always use GitHub Secrets for sensitive data
- Rotate keys regularly
- Use the principle of least privilege

---

**This file should be deleted after you've secured your account.**
