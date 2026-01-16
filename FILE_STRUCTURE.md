# File Structure for GitHub Pages & Firebase Hosting

## ✅ Essential Files (Publicly Accessible)

### Root Directory Structure
```
/
├── index.html              ✅ Main landing page (login/signup)
├── dashboard.html          ✅ User dashboard (after login)
├── user-database.js        ✅ User database system
├── images/                 ✅ Image assets
│   ├── IMG_4258.png       ✅ KotaPal logo
│   └── IMG_4258.JPG       ✅ KotaPal logo
├── _config.yml             ✅ GitHub Pages config
├── firebase.json           ✅ Firebase Hosting config
├── .firebaserc             ✅ Firebase project ID
├── .firebaseignore         ✅ Firebase ignore rules
└── CNAME                   ✅ Custom domain (kotapal.com)
```

## File Organization

### Public Web Files (Served to Users)
- **index.html** - Landing page with authentication
- **dashboard.html** - User dashboard interface
- **user-database.js** - Client-side user database
- **images/** - All image assets

### Configuration Files (Not Served, But Required)
- **_config.yml** - GitHub Pages Jekyll configuration
- **firebase.json** - Firebase Hosting configuration
- **.firebaserc** - Firebase project mapping
- **.firebaseignore** - Files to exclude from Firebase
- **CNAME** - Custom domain configuration

### Workflow Files (For CI/CD)
- **package.json** - For GitHub Actions workflows
- **package-lock.json** - For GitHub Actions workflows
- **.github/workflows/** - Deployment automation

## File Access Rules

### GitHub Pages (_config.yml)
✅ **Included (Accessible):**
- All `*.html` files
- All `*.js` files (including user-database.js)
- All images in `images/` folder
- All CSS (inline in HTML)

❌ **Excluded (Not Served):**
- Configuration files (*.json except package files)
- Documentation (*.md)
- Archive folder
- Development scripts

### Firebase Hosting (.firebaseignore)
✅ **Included (Deployed):**
- All `*.html` files
- All `*.js` files
- All images
- CNAME file

❌ **Excluded (Not Deployed):**
- Configuration files
- Documentation
- Archive folder
- Development files

## Website Flow

1. **User visits site** → `index.html` loads
2. **User logs in** → Redirects to `dashboard.html#dashboard`
3. **Dashboard loads** → Uses `user-database.js` for user data
4. **Images display** → From `images/` folder

## Verification Checklist

- [x] index.html in root directory
- [x] dashboard.html in root directory
- [x] user-database.js in root directory
- [x] images/ folder in root directory
- [x] _config.yml allows HTML, JS, and images
- [x] .firebaseignore allows HTML, JS, and images
- [x] All files committed to git
- [x] Login redirects to dashboard.html#dashboard
- [x] Dashboard checks for user authentication

## Testing

1. Visit your GitHub Pages URL
2. Click "Login" and enter credentials
3. Should redirect to dashboard.html
4. Dashboard should load and display user info
5. All images should display correctly

All files are properly organized and accessible! 🎉
