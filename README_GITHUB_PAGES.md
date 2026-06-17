# Quick GitHub Pages Fix

## The Problem
You're getting a 404 error because GitHub Pages can't find your `index.html` file.

## The Solution

### Step 1: Move Files to Repository Root

Your `index.html` file must be in the **root of your GitHub repository**, not in a subfolder.

**Current structure (WRONG):**
```
your-repo/
└── KotaPal simple copy/
    └── index.html  ❌ GitHub Pages can't find this
```

**Correct structure:**
```
your-repo/
├── index.html  ✅ GitHub Pages will find this
├── dashboard.html
├── images/
├── .nojekyll
└── ...
```

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
4. Click **Save**

### Step 3: Verify Files

Make sure these files are in your repository root:
- ✅ `index.html`
- ✅ `dashboard.html`
- ✅ `.nojekyll` (already created)
- ✅ `images/` folder

### Step 4: Wait and Test

- Wait 2-5 minutes for GitHub Pages to deploy
- Visit: `https://yourusername.github.io/your-repo-name/`

## If You're Using a Subfolder

If you must keep files in a subfolder, use the `/docs` folder:

1. Create a `docs` folder in your repo root
2. Move all HTML files to `docs/`
3. In GitHub Pages settings, select **Folder:** `/docs`

## Still Not Working?

1. Check the filename is exactly `index.html` (lowercase)
2. Verify the file is committed and pushed to GitHub
3. Check repository Settings → Pages for any error messages
4. Wait 10 minutes (first deployment takes time)

See `GITHUB_PAGES_SETUP.md` for detailed instructions.
