# GitHub Pages Setup Guide

This guide will help you deploy your KOTA PAL application to GitHub Pages.

## Prerequisites

1. A GitHub account
2. A GitHub repository for your project
3. All your files committed to the repository

## Step 1: Repository Structure

For GitHub Pages to work correctly, your `index.html` file must be in one of these locations:

### Option A: Root Directory (Recommended)
```
your-repo/
├── index.html          ← Must be here
├── dashboard.html
├── images/
├── scripts/
└── services/
```

### Option B: Docs Folder
```
your-repo/
├── docs/
│   ├── index.html      ← Or here
│   ├── dashboard.html
│   └── ...
└── README.md
```

## Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings**
3. Scroll down to **Pages** (in the left sidebar)
4. Under **Source**, select:
   - **Branch: main** (or master) and **Folder: / (root)** (if using Option A)
   - **Branch: main** (or master) and **Folder: /docs** (if using Option B)
5. Click **Save**

## Step 3: Verify File Structure

Make sure these files exist in your repository root (or docs folder):

- ✅ `index.html` - Main landing page
- ✅ `dashboard.html` - Dashboard page
- ✅ `.nojekyll` - Prevents Jekyll processing (already created)
- ✅ `images/` folder with your images
- ✅ All other necessary files

## Step 4: Check File Paths

All file references in your HTML files should be **relative paths**:

✅ **Correct:**
```html
<link rel="stylesheet" href="styles.css">
<img src="images/logo.png">
<a href="dashboard.html">
```

❌ **Incorrect (absolute paths won't work):**
```html
<link rel="stylesheet" href="/styles.css">
<img src="/images/logo.png">
```

## Step 5: Access Your Site

After enabling GitHub Pages, your site will be available at:

```
https://yourusername.github.io/your-repo-name/
```

**Note:** It may take a few minutes for the site to be available after first enabling.

## Step 6: Custom Domain (Optional)

If you want to use a custom domain:

1. In GitHub Pages settings, enter your custom domain
2. Add a `CNAME` file to your repository root with your domain:
   ```
   yourdomain.com
   ```
3. Configure DNS records with your domain provider

## Troubleshooting

### 404 Error - File Not Found

**Problem:** GitHub Pages returns 404 error

**Solutions:**
1. ✅ Make sure `index.html` is in the root (or docs folder)
2. ✅ Check that the filename is exactly `index.html` (case-sensitive)
3. ✅ Verify GitHub Pages is enabled in repository settings
4. ✅ Wait 5-10 minutes after enabling (first deployment takes time)
5. ✅ Check the branch name matches (main vs master)
6. ✅ Ensure `.nojekyll` file exists in root

### Images Not Loading

**Problem:** Images show broken links

**Solutions:**
1. ✅ Use relative paths: `images/logo.png` not `/images/logo.png`
2. ✅ Check image file names match exactly (case-sensitive)
3. ✅ Verify images folder is committed to repository

### Dashboard Redirect Not Working

**Problem:** Can't access dashboard.html

**Solutions:**
1. ✅ Make sure `dashboard.html` is in the same folder as `index.html`
2. ✅ Check the redirect path: `window.location.href = 'dashboard.html'`
3. ✅ Verify file is committed to repository

### Firebase Not Working

**Problem:** Firebase authentication errors

**Solutions:**
1. ✅ Update Firebase config in both `index.html` and `dashboard.html`
2. ✅ Add your GitHub Pages URL to Firebase authorized domains:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add: `yourusername.github.io`
3. ✅ Check browser console for specific error messages

## Quick Checklist

Before deploying, verify:

- [ ] `index.html` exists in repository root (or docs folder)
- [ ] `.nojekyll` file exists in repository root
- [ ] All file paths are relative (not absolute)
- [ ] GitHub Pages is enabled in repository settings
- [ ] Branch selected matches your default branch (main/master)
- [ ] All files are committed and pushed to GitHub
- [ ] Firebase config is updated with your project values
- [ ] GitHub Pages URL is added to Firebase authorized domains

## Testing Locally

Before deploying, test locally:

1. Open `index.html` in your browser
2. Check that all images load
3. Test navigation to dashboard
4. Verify Firebase authentication works
5. Check browser console for errors

## Common Issues

### Case Sensitivity
GitHub Pages is case-sensitive. Make sure:
- `index.html` not `Index.html`
- `dashboard.html` not `Dashboard.html`
- File extensions match exactly

### Jekyll Processing
The `.nojekyll` file prevents Jekyll from processing your files. This is important if:
- You have folders starting with underscore (`_`)
- You want direct file serving without Jekyll

### Branch Selection
Make sure you select the correct branch:
- Usually `main` (newer repos)
- Sometimes `master` (older repos)
- Check your repository's default branch

## Need Help?

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Pages Troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-github-pages)
- Check your repository's Pages settings for build errors
