# GitHub Upload Guide

## ✅ Project Structure for GitHub

The project has been restructured to be GitHub-friendly:

```
├── frontend/          # React frontend (main application)
├── src/              # Backend server code
├── data/             # Data files
├── docs/             # All documentation files
├── archive/          # Legacy/old files (excluded from git)
├── public/           # Public assets
├── .gitignore        # Excludes large/sensitive files
├── README.md         # Main project documentation
├── package.json      # Backend dependencies
└── env.example       # Environment template
```

## 🚫 Files Excluded from Git

The `.gitignore` file automatically excludes:

- **Dependencies**: `node_modules/` (install with `npm install`)
- **Sensitive files**: `.env`, `firebase-key.json`
- **Large files**: `*.msi`, `*.zip`, installers
- **Build outputs**: `frontend/build/`, logs
- **OS files**: `.DS_Store`, `Thumbs.db`

## 📤 Uploading to GitHub

### Method 1: Drag and Drop (Easiest)

1. **Create a new repository on GitHub**
   - Go to github.com → New repository
   - Name it (e.g., `kotapal-dashboard`)
   - Don't initialize with README (we already have one)

2. **Prepare files for upload**
   - The `.gitignore` will automatically exclude large files
   - All files should now be under 100MB

3. **Upload via GitHub web interface**
   - Click "Upload files" on your new repository
   - Drag and drop the entire project folder
   - Or select all files and folders
   - Add commit message: "Initial commit"
   - Click "Commit changes"

### Method 2: Using Git (Recommended for updates)

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Connect to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git branch -M main
   git push -u origin main
   ```

## ⚠️ Important Notes

- **Never commit** `firebase-key.json` or `.env` files
- All files are automatically checked to be under 100MB
- `node_modules/` will be excluded - users install with `npm install`
- The `archive/` folder contains old files and is excluded

## 🔍 Verifying File Sizes

Before uploading, you can verify no files exceed 100MB:

```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 100MB } | Select-Object FullName
```

If any files appear, they should be in `.gitignore` or moved to `archive/`.

## 📝 After Upload

1. **Clone the repository** (for others):
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
   cd YOUR-REPO
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd frontend
   npm install
   ```

3. **Set up environment**:
   - Copy `env.example` to `.env`
   - Fill in your configuration
   - Never commit `.env` or `firebase-key.json`

## ✅ Checklist Before Upload

- [x] `.gitignore` file created
- [x] Sensitive files excluded (`firebase-key.json`, `.env`)
- [x] Large files excluded (`node_modules/`, `*.msi`, `*.zip`)
- [x] Documentation organized in `docs/` folder
- [x] Legacy files moved to `archive/` folder
- [x] Main `README.md` created
- [x] All files under 100MB limit

Your project is now ready for GitHub! 🚀

