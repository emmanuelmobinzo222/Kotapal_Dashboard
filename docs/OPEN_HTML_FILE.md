# 📄 How to Open the HTML Landing Page

## Direct Link to the File

**Double-click this file to open in browser:**
```
KotaPal simple\index.html
```

Or navigate to the #pricing section:
```
KotaPal simple\index.html#pricing
```

## Start Backend Server First!

The HTML file needs the backend running on port 3000.

### Step 1: Start Backend
**Double-click:** `START_BACKEND.bat`

Wait for it to show:
```
✅ Kota Smart Product Platform running on port 3000
```

### Step 2: Open HTML File
**Double-click:** `KotaPal simple\index.html`

Or:
1. Right-click `index.html`
2. Choose "Open with" → Your browser (Chrome, Edge, Firefox)
3. The page should open at: `file:///C:/Users/emman/Downloads/.../KotaPal simple/index.html`

## Login and Signup Work!

The HTML file is now configured to connect to:
- **Backend:** http://localhost:3000
- **API Endpoints:** http://localhost:3000/api

### To Login:
1. Click "Login" button (top right)
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to the dashboard

### To Sign Up:
1. Click "Get Started" or "Login" → "Sign Up" tab
2. Fill in the form:
   - Name
   - Email
   - Password
   - Website (optional)
   - Choose a plan
3. Click "Sign Up"
4. You'll be redirected to the dashboard

## What I Fixed

1. ✅ **API Base URL** - Set to `http://localhost:3000`
2. ✅ **Logging** - Added console.log to track API requests
3. ✅ **Timeout** - Increased to 10 seconds
4. ✅ **Error Messages** - Better error handling

## Troubleshooting

### Still getting "Failed to fetch"?

1. **Is backend running?**
   - Check for "Kota Backend" window
   - Should say "running on port 3000"
   - If not, run `START_BACKEND.bat`

2. **Check browser console**
   - Press F12
   - Look for console.log messages
   - Check Network tab for failed requests

3. **Open with backend URL**
   Instead of file://, try:
   ```
   http://localhost:3000/index.html
   ```

---

## ✅ Ready to Test!

1. Start backend (START_BACKEND.bat)
2. Open `KotaPal simple\index.html` in browser
3. Click "Get Started" or "Login"
4. Test login or signup!

