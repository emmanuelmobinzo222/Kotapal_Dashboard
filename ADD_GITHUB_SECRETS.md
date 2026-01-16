# How to Add GitHub Secrets - Step by Step Guide

This guide will walk you through adding the required secrets to your GitHub repository.

## Prerequisites

Before adding secrets, you need to get your Firebase Service Account key.

### Step 1: Get Firebase Service Account Key

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Make sure you're logged in with the account that owns the project

2. **Select Your Project**
   - Click on **KotaPal-1e8f6** from the project list

3. **Open Project Settings**
   - Click the **gear icon (⚙️)** next to "Project Overview" (top left)
   - Select **Project Settings** from the dropdown

4. **Go to Service Accounts Tab**
   - Click on the **Service Accounts** tab at the top

5. **Generate Private Key**
   - Click the button: **"Generate new private key"**
   - A warning dialog will appear - click **"Generate key"**
   - A JSON file will automatically download to your computer
   - **Important**: Keep this file secure! Don't share it or commit it to Git.

6. **Open the Downloaded JSON File**
   - Find the downloaded file (usually in your Downloads folder)
   - It will be named something like: `kotapal-1e8f6-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
   - Open it with a text editor (Notepad, VS Code, etc.)
   - **Copy the entire contents** - you'll need this in the next step

---

## Step 2: Add Secrets to GitHub

### Method 1: Via GitHub Website (Recommended)

1. **Go to Your Repository**
   - Navigate to your GitHub repository in a web browser
   - Make sure you're logged in and have admin/owner permissions

2. **Open Repository Settings**
   - Click on the **Settings** tab (at the top of the repository page)
   - If you don't see "Settings", you don't have admin access - ask the repository owner

3. **Navigate to Secrets**
   - In the left sidebar, scroll down to **"Secrets and variables"**
   - Click on **"Actions"** (under Secrets and variables)

4. **Add First Secret: FIREBASE_SERVICE_ACCOUNT**
   - Click the **"New repository secret"** button (top right)
   - **Name**: Type exactly: `FIREBASE_SERVICE_ACCOUNT`
     - ⚠️ **Important**: The name must match exactly (case-sensitive)
   - **Secret**: Paste the **entire contents** of the JSON file you downloaded
     - This should start with `{` and end with `}`
     - Include everything - it's a long JSON object
   - Click **"Add secret"**

5. **Add Second Secret: FIREBASE_PROJECT_ID**
   - Click **"New repository secret"** again
   - **Name**: Type exactly: `FIREBASE_PROJECT_ID`
   - **Secret**: Type exactly: `KotaPal-1e8f6`
     - ⚠️ **Important**: This must match your Firebase project ID exactly
   - Click **"Add secret"**

6. **Verify Secrets Are Added**
   - You should now see both secrets listed:
     - `FIREBASE_SERVICE_ACCOUNT`
     - `FIREBASE_PROJECT_ID`
   - You can see when they were created, but you cannot see their values (for security)

---

### Method 2: Via GitHub CLI (Advanced)

If you have GitHub CLI installed, you can add secrets from the command line:

```bash
# Add FIREBASE_SERVICE_ACCOUNT secret
# First, save your service account JSON to a file, then:
gh secret set FIREBASE_SERVICE_ACCOUNT < service-account-key.json

# Add FIREBASE_PROJECT_ID secret
gh secret set FIREBASE_PROJECT_ID --body "KotaPal-1e8f6"
```

---

## Step 3: Verify Setup

After adding the secrets, you can verify everything is set up correctly:

1. **Check the Secrets List**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - You should see both secrets listed

2. **Test the Workflow**
   - Make a small change to your repository (or just push the current state)
   - Push to the `main` or `master` branch
   - Go to the **Actions** tab in your repository
   - You should see a workflow run called "Deploy to Firebase Hosting"
   - Click on it to see the deployment progress

---

## Visual Guide (What You'll See)

### In Firebase Console:
```
Firebase Console
├── Project: KotaPal-1e8f6
    └── Settings (⚙️)
        └── Project Settings
            └── Service Accounts tab
                └── [Generate new private key] button
```

### In GitHub:
```
Your Repository
├── Settings (tab at top)
    └── Secrets and variables (left sidebar)
        └── Actions
            └── [New repository secret] button
                ├── Secret 1: FIREBASE_SERVICE_ACCOUNT
                └── Secret 2: FIREBASE_PROJECT_ID
```

---

## Common Issues & Solutions

### Issue: "Settings" tab is not visible
**Solution**: You need admin/owner permissions on the repository. Ask the repository owner to add you as a collaborator with admin access, or have them add the secrets.

### Issue: "Generate new private key" button is disabled
**Solution**: 
- Make sure you're the project owner or have the "Firebase Admin" role
- Try refreshing the page
- Check if you're in the correct Firebase project

### Issue: Secret value is too long / won't paste
**Solution**: 
- Make sure you're copying the ENTIRE JSON file contents
- Try copying in smaller chunks if your browser has issues
- The JSON should be on multiple lines - that's normal

### Issue: Workflow fails with "Secret not found"
**Solution**:
- Double-check the secret names are EXACTLY:
  - `FIREBASE_SERVICE_ACCOUNT` (case-sensitive)
  - `FIREBASE_PROJECT_ID` (case-sensitive)
- Make sure there are no extra spaces before/after the names
- Verify the secrets are in the correct repository

### Issue: Workflow fails with "Authentication failed"
**Solution**:
- Verify the service account JSON is complete (starts with `{` and ends with `}`)
- Make sure you copied the entire file, not just part of it
- Try generating a new service account key

### Issue: Can't find the downloaded JSON file
**Solution**:
- Check your Downloads folder
- The file name will be something like: `kotapal-1e8f6-firebase-adminsdk-xxxxx.json`
- If you can't find it, generate a new one (the old one won't work if you delete it)

---

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit the service account JSON file to Git**
   - It's already in `.gitignore`, but double-check
   - If you accidentally committed it, rotate the key immediately

2. **Don't share the service account key**
   - Treat it like a password
   - Only add it as a GitHub secret, nowhere else

3. **Rotate keys if compromised**
   - If you think the key was exposed, generate a new one in Firebase Console
   - Update the GitHub secret with the new key

4. **Use repository secrets, not environment secrets**
   - Repository secrets are scoped to your repo (which is what you want)
   - Environment secrets are for more complex setups

---

## Quick Checklist

Use this checklist to make sure you've completed everything:

- [ ] Opened Firebase Console
- [ ] Selected project: KotaPal-1e8f6
- [ ] Generated new private key
- [ ] Downloaded the JSON file
- [ ] Opened the JSON file and copied its contents
- [ ] Went to GitHub repository → Settings
- [ ] Navigated to Secrets and variables → Actions
- [ ] Added secret: `FIREBASE_SERVICE_ACCOUNT` (with full JSON content)
- [ ] Added secret: `FIREBASE_PROJECT_ID` (with value: `KotaPal-1e8f6`)
- [ ] Verified both secrets appear in the list
- [ ] Tested by pushing to main/master branch
- [ ] Checked Actions tab to see deployment workflow

---

## Need Help?

If you're stuck:

1. **Check the error message** in the GitHub Actions workflow run
2. **Verify secret names** are exactly as specified (case-sensitive)
3. **Double-check the JSON** is complete and valid
4. **Try generating a new service account key** if authentication fails

---

## Next Steps

Once secrets are added:

1. ✅ Push your code to trigger the first deployment
2. ✅ Check the Actions tab to watch the deployment
3. ✅ Visit your deployed site: `https://KotaPal-1e8f6.web.app`
4. ✅ Configure custom domain (kotapal.com) if needed in Firebase Console

Your automatic deployments are now set up! 🎉
