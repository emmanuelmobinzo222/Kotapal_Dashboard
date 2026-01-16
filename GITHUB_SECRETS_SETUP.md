# GitHub Secrets Setup Guide

This guide will help you set up GitHub Secrets for automatic Firebase deployments.

## Firebase Project Information

- **Project ID**: `KotaPal-1e8f6`
- **Auth Domain**: `KotaPal-1e8f6.firebaseapp.com`

## Method 1: Using Firebase Service Account (Recommended)

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **KotaPal-1e8f6**
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **Project Settings**
5. Go to the **Service Accounts** tab
6. Click **Generate new private key**
7. Click **Generate key** in the confirmation dialog
8. A JSON file will download - **keep this file secure!**

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

4. Add the first secret:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Open the downloaded JSON file and copy its **entire contents** (all of it, including the curly braces)
   - Click **Add secret**

5. Add the second secret:
   - **Name**: `FIREBASE_PROJECT_ID`
   - **Value**: `KotaPal-1e8f6`
   - Click **Add secret**

### Step 3: Verify Setup

- The workflow file `.github/workflows/firebase-deploy.yml` is already configured
- It will automatically deploy on push to `main` or `master` branch
- You can also manually trigger it from the **Actions** tab

---

## Method 2: Using Firebase Token (Alternative)

### Step 1: Get Firebase Token

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login and get token:
   ```bash
   firebase login:ci
   ```

3. Copy the token that's displayed (it will look like a long string)

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

4. Add the first secret:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the token you copied
   - Click **Add secret**

5. Add the second secret:
   - **Name**: `FIREBASE_PROJECT_ID`
   - **Value**: `KotaPal-1e8f6`
   - Click **Add secret**

### Step 3: Update Workflow

If using token method, you'll need to use the `firebase-deploy-token.yml` workflow instead:
- Rename `.github/workflows/firebase-deploy-token.yml` to `firebase-deploy.yml` (backup the original first)
- Or keep both and disable the service account one

---

## Quick Checklist

- [ ] Firebase project ID updated in `.firebaserc` ✅ (Already done)
- [ ] Service account JSON downloaded (Method 1) OR Firebase token obtained (Method 2)
- [ ] `FIREBASE_SERVICE_ACCOUNT` secret added to GitHub (Method 1) OR `FIREBASE_TOKEN` secret added (Method 2)
- [ ] `FIREBASE_PROJECT_ID` secret added to GitHub with value `KotaPal-1e8f6`
- [ ] Test deployment by pushing to `main`/`master` branch or manually triggering workflow

## Testing the Deployment

1. Make a small change to your repository
2. Commit and push to `main` or `master` branch
3. Go to **Actions** tab in GitHub
4. You should see the "Deploy to Firebase Hosting" workflow running
5. Once complete, your site will be live at:
   - `https://KotaPal-1e8f6.web.app`
   - `https://KotaPal-1e8f6.firebaseapp.com`
   - Or your custom domain if configured

## Troubleshooting

### Error: "Project not found"
- Verify the project ID in `.firebaserc` matches `KotaPal-1e8f6`
- Check that the `FIREBASE_PROJECT_ID` secret is set correctly

### Error: "Permission denied" or "Authentication failed"
- Verify the service account JSON is complete (all content copied)
- For token method, ensure the token hasn't expired (tokens can expire)
- Check that the service account has the "Firebase Hosting Admin" role

### Error: "Secret not found"
- Ensure secrets are named exactly:
  - `FIREBASE_SERVICE_ACCOUNT` (for Method 1)
  - `FIREBASE_TOKEN` (for Method 2)
  - `FIREBASE_PROJECT_ID` (for both methods)

### Workflow not triggering
- Check that you're pushing to `main` or `master` branch
- Verify the workflow file exists at `.github/workflows/firebase-deploy.yml`
- Check the Actions tab for any error messages

## Security Notes

⚠️ **Important Security Reminders:**
- Never commit the service account JSON file to your repository
- Never commit Firebase tokens to your repository
- The `.gitignore` file is already configured to exclude these files
- If you accidentally commit sensitive data, rotate your keys immediately

## Next Steps

After setting up secrets:
1. Push a test commit to trigger deployment
2. Configure custom domain (kotapal.com) in Firebase Console if needed
3. Set up preview channels for pull requests (optional)
