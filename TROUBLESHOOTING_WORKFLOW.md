# Troubleshooting: Workflow Not Running

If you don't see "Deploy to Firebase Hosting" in the Actions tab, follow these steps:

## Step 1: Check if Workflow Files Are Committed

The workflow files need to be committed and pushed to GitHub for them to work.

**Check locally:**
```bash
git status
```

You should see `.github/workflows/firebase-deploy.yml` in the list. If it shows as "untracked" or "modified", you need to commit it.

**Commit and push:**
```bash
git add .github/workflows/firebase-deploy.yml
git add firebase.json
git add .firebaserc
git commit -m "Add Firebase Hosting deployment workflow"
git push origin main
```
(Replace `main` with `master` if that's your default branch)

## Step 2: Verify Workflow File Location

The workflow file MUST be at exactly this path:
```
.github/workflows/firebase-deploy.yml
```

**Check if it exists:**
- In GitHub: Go to your repo → Click on `.github` folder → `workflows` folder → You should see `firebase-deploy.yml`
- Locally: The file should be at `.github/workflows/firebase-deploy.yml`

## Step 3: Check GitHub Actions Is Enabled

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Actions** → **General**
4. Under "Actions permissions", make sure it's set to:
   - ✅ "Allow all actions and reusable workflows" OR
   - ✅ "Allow local actions and reusable workflows"
5. Scroll down and click **Save**

## Step 4: Check Which Branch You're On

The workflow only triggers on `main` or `master` branch.

**Check your current branch:**
```bash
git branch
```

**If you're on a different branch:**
```bash
# Switch to main branch
git checkout main

# Or if your default is master
git checkout master
```

## Step 5: Manually Trigger the Workflow

Even if you haven't pushed, you can manually trigger it:

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. In the left sidebar, you should see **"Deploy to Firebase Hosting"**
4. Click on it
5. Click the **"Run workflow"** button (top right)
6. Select your branch (main or master)
7. Click **"Run workflow"**

If you don't see "Deploy to Firebase Hosting" in the list, the workflow file hasn't been pushed to GitHub yet.

## Step 6: Check for Workflow Errors

1. Go to **Actions** tab
2. Look for any workflow runs (even failed ones)
3. Click on a run to see error messages
4. Common errors:
   - "Workflow file not found" → File not committed/pushed
   - "Secret not found" → Secrets not added correctly
   - "Permission denied" → Service account key issue

## Step 7: Verify Secrets Are Added

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - `FIREBASE_SERVICE_ACCOUNT`
   - `FIREBASE_PROJECT_ID`
3. If either is missing, add them (see ADD_GITHUB_SECRETS.md)

## Step 8: Check Workflow File Syntax

The workflow file should look like this (first few lines):

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:
```

If it looks different, there might be a syntax error.

## Quick Fix Checklist

- [ ] Workflow file is committed: `git status` shows it's tracked
- [ ] Workflow file is pushed to GitHub: Check `.github/workflows/` folder in GitHub
- [ ] You're on main/master branch: `git branch` shows `* main` or `* master`
- [ ] GitHub Actions is enabled: Settings → Actions → General
- [ ] Secrets are added: Settings → Secrets → Actions
- [ ] You've pushed a commit after adding the workflow file

## Still Not Working?

If after all these steps it's still not working:

1. **Try manually triggering:**
   - Actions tab → "Deploy to Firebase Hosting" → "Run workflow"

2. **Check the workflow file in GitHub:**
   - Make sure it's actually there: `.github/workflows/firebase-deploy.yml`
   - Open it and verify the content looks correct

3. **Create a test commit:**
   ```bash
   # Make a small change
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test workflow trigger"
   git push origin main
   ```

4. **Check Actions tab immediately after pushing:**
   - It should appear within seconds
   - Refresh the page if needed

## Common Issues

### Issue: "No workflows found"
**Solution:** The workflow file hasn't been pushed to GitHub. Commit and push it.

### Issue: Workflow shows but doesn't run
**Solution:** Check if secrets are added. The workflow will fail if secrets are missing.

### Issue: Workflow runs but fails
**Solution:** Check the error message in the workflow run. Usually it's a missing secret or incorrect service account key.

### Issue: Can't see Actions tab
**Solution:** You might not have the right permissions, or GitHub Actions might be disabled for the repository.
