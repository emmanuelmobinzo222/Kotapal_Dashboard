# 🚀 How to Access Your Dashboard

## ⚠️ IMPORTANT: You CANNOT Open HTML Files Directly!

**This is a React application that MUST run on a development server.**

❌ **WRONG**: `file:///C:/Users/emman/Downloads/wetransfer_kotapal_2025-09-22_1618/index.html`  
✅ **CORRECT**: `http://localhost:3001`

## Quick Start (Easiest Method)

### Option 1: Double-Click the Batch File
1. **Double-click**: `START_DASHBOARD.bat`
2. **Wait 30-60 seconds** for both servers to start
3. **Browser will open automatically** to http://localhost:3001
4. **Keep both server windows open!**

### Option 2: Manual Start

**Step 1: Start Backend (Terminal 1)**
```powershell
npm start
```
Wait for: `✅ Kota Smart Product Platform running on port 3000`

**Step 2: Start Frontend (Terminal 2 - NEW WINDOW)**
```powershell
cd frontend
npm start
```
Wait for: `Compiled successfully!`

**Step 3: Open Browser**
Go to: **http://localhost:3001**

## Why You Can't Open HTML Files Directly

React applications need:
- A development server to compile and serve files
- API connections to the backend
- Routing to work properly
- Module bundling (webpack)

Opening `index.html` directly won't work because:
- ❌ No server to handle API requests
- ❌ No module bundling
- ❌ No routing support
- ❌ CORS issues

## What You Should See

### Backend Terminal:
```
✅ Kota Smart Product Platform running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
🌐 Frontend URL: http://localhost:3001
```

### Frontend Terminal:
```
Compiled successfully!

You can now view kota-frontend in the browser.

  Local:            http://localhost:3001
```

### Browser:
- Login page at: http://localhost:3001/login
- Dashboard at: http://localhost:3001/dashboard (after login)

## Troubleshooting

### "Cannot GET /dashboard"
**Cause**: Frontend server not running

**Solution**:
1. Make sure you ran `npm start` in the `frontend` folder
2. Wait for "Compiled successfully!" message
3. Access http://localhost:3001 (not port 3000)

### "Failed to fetch" or API errors
**Cause**: Backend server not running

**Solution**:
1. Make sure you ran `npm start` in the root directory
2. Check that port 3000 is showing the API message
3. Verify: http://localhost:3000 should show API info

### Blank page or "This site can't be reached"
**Cause**: Servers not started yet

**Solution**:
1. Wait 30-60 seconds after starting
2. Check both terminal windows are open
3. Look for error messages in the terminals
4. Try refreshing the browser (Ctrl+F5)

### Port already in use
**Cause**: Another application is using ports 3000 or 3001

**Solution**:
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

## Step-by-Step Visual Guide

1. **Open File Explorer** → Navigate to project folder
2. **Double-click** `START_DASHBOARD.bat`
3. **Two windows will open**:
   - "Kota Backend" window (shows API running)
   - "Kota Frontend" window (shows compilation)
4. **Wait 30-60 seconds** for compilation
5. **Browser opens automatically** to http://localhost:3001
6. **Login or Register** to access dashboard

## Access URLs

- **Frontend (Main App)**: http://localhost:3001
- **Login Page**: http://localhost:3001/login
- **Register Page**: http://localhost:3001/register
- **Dashboard**: http://localhost:3001/dashboard (after login)
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

## Remember

✅ **DO**: Use http://localhost:3001  
❌ **DON'T**: Use file:/// paths  
✅ **DO**: Keep both server windows open  
❌ **DON'T**: Close the terminal windows  

---

**Need Help?** Check the terminal windows for error messages!

