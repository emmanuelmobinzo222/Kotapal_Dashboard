# GitHub Pages Setup Guide

## ✅ Files Ready for GitHub Pages

The following files are now in the root directory and ready for GitHub Pages:

- `index.html` - Main landing page
- `dashboard.html` - Dashboard page  
- `.nojekyll` - Disables Jekyll processing (required for GitHub Pages)
- `_config.yml` - GitHub Pages configuration
- `404.html` - Custom 404 error page

## 🚀 How to Deploy

1. **Push to GitHub:**
   ```bash
   git add index.html dashboard.html .nojekyll _config.yml 404.html
   git commit -m "Setup GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

3. **Wait for Deployment:**
   - GitHub Pages will build your site (usually takes 1-2 minutes)
   - Your site will be available at: `https://emmanuelmobinzo222.github.io/Kotapal_Dashboard/`

## 🌐 Custom Domain Setup

If you have a custom domain:

1. **Add CNAME file** (if using a subdomain like `www.yourdomain.com`):
   ```
   www.yourdomain.com
   ```

2. **Configure DNS:**
   - Add a CNAME record pointing to: `emmanuelmobinzo222.github.io`
   - Or add A records pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

3. **Update GitHub Pages Settings:**
   - Go to Settings → Pages
   - Enter your custom domain
   - GitHub will automatically create/update the CNAME file

## 📝 Important Notes

- The `.nojekyll` file ensures GitHub Pages serves your HTML files directly without Jekyll processing
- All paths in your HTML files are relative, so they'll work on GitHub Pages
- Images referenced as `images/IMG_4258.png` need to be in an `images/` folder in the root
- The site works completely offline using localStorage for user data

## 🔧 Troubleshooting

If GitHub Pages still shows README.md:
1. Make sure `.nojekyll` file exists in the root
2. Wait a few minutes for GitHub to rebuild
3. Clear your browser cache
4. Check that `index.html` is in the root directory (not in a subfolder)

