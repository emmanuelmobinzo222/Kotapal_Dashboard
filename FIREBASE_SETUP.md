# Firebase Hosting Setup Guide

This guide will help you set up Firebase Hosting for your KotaPal Dashboard.

## Prerequisites

1. A Firebase account (sign up at https://firebase.google.com)
2. Firebase CLI installed locally (optional, for manual deployment)
3. A Firebase project created

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard
4. Note your **Project ID** (you'll need this later)

## Step 2: Configure Firebase Project ID

Edit the `.firebaserc` file and replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Step 3: Initialize Firebase Hosting (Local Setup)

If you want to deploy manually from your local machine:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (if not already done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## Step 4: Set Up GitHub Actions (Automatic Deployment)

### Option A: Using Firebase Service Account (Recommended)

1. **Get Firebase Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file (keep it secure!)

2. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire contents of the service account JSON file
     - `FIREBASE_PROJECT_ID`: Your Firebase project ID

3. **Deploy:**
   - The workflow will automatically deploy on push to `main` or `master` branch
   - Or manually trigger it from the Actions tab

### Option B: Using Firebase Token (Alternative)

1. **Get Firebase Token:**
   ```bash
   firebase login:ci
   ```
   Copy the token that's displayed

2. **Add GitHub Secret:**
   - Go to GitHub repository → Settings → Secrets
   - Add secret: `FIREBASE_TOKEN` with the token value

3. **Update workflow file:**
   - Edit `.github/workflows/firebase-deploy.yml`
   - Replace the service account method with token authentication

## Step 5: Custom Domain (Optional)

If you want to use a custom domain (kotapal.com):

1. Go to Firebase Console → Hosting → Add custom domain
2. Enter your domain: `kotapal.com`
3. Follow the DNS verification steps
4. Firebase will provide DNS records to add to your domain registrar

## Configuration Files

- `firebase.json`: Firebase Hosting configuration
- `.firebaserc`: Firebase project ID mapping
- `.firebaseignore`: Files to exclude from deployment
- `.github/workflows/firebase-deploy.yml`: Automatic deployment workflow

## Manual Deployment

If you prefer to deploy manually:

```bash
firebase deploy --only hosting
```

## Troubleshooting

### Error: "Project not found"
- Make sure your `.firebaserc` file has the correct project ID
- Verify you're logged in: `firebase login`

### Error: "Permission denied"
- Check that your Firebase account has the correct permissions
- For GitHub Actions, verify the service account has the right roles

### Custom Domain Issues
- Ensure DNS records are properly configured
- Wait for DNS propagation (can take up to 48 hours)
- Check Firebase Console for domain verification status

## Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
