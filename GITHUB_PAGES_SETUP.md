# GitHub Pages Setup Guide

## Current Status

Your repository is configured for both **Firebase Hosting** and **GitHub Pages**.

## Files Required for GitHub Pages

✅ **index.html** - Present in root directory  
✅ **_config.yml** - Jekyll configuration (just added)  
✅ **CNAME** - Custom domain configuration (kotapal.com)

## Enable GitHub Pages

1. **Go to your GitHub repository**
2. **Click Settings** (top of repository page)
3. **Scroll down to "Pages"** (left sidebar)
4. **Under "Source"**, select:
   - **Branch**: `main` (or `master` if that's your default)
   - **Folder**: `/ (root)`
5. **Click Save**

## Verify Deployment

After enabling:
- GitHub Pages will build your site (usually takes 1-2 minutes)
- Your site will be available at:
  - `https://[your-username].github.io/Kotapal_Dashboard/`
  - Or `https://kotapal.com` (if DNS is configured)

## Troubleshooting

### "File not found" Error

If you still see this error:

1. **Check the branch**: Make sure GitHub Pages is set to the `main` branch
2. **Wait a few minutes**: GitHub Pages can take 1-5 minutes to build
3. **Check Actions tab**: Look for any build errors
4. **Verify index.html**: Make sure it's in the root directory (✅ it is)

### Custom Domain Issues

If using `kotapal.com`:

1. **DNS Configuration**: 
   - Add a CNAME record pointing to `[your-username].github.io`
   - Or add A records for GitHub Pages IPs
2. **Wait for DNS propagation**: Can take up to 48 hours
3. **Check DNS**: Use tools like `dig` or online DNS checkers

## Both Hosting Options

You now have:
- **GitHub Pages**: Free, automatic deployment on push
- **Firebase Hosting**: More features, custom domain support, better performance

You can use both, or choose one. Firebase Hosting is recommended for production.
