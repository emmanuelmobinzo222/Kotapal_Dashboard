# Fix Firebase Key - Quick Steps

## Your .env file is configured but the key file is missing!

### Step 1: Find Your Downloaded Firebase Key
The file might be in your Downloads folder with a name like:
- `kota-platform-xxxxx-firebase-adminsdk-xxxxx.json`

### Step 2: Move It to Project Folder
1. Find the file in Downloads
2. **Copy it** (Ctrl+C)
3. **Paste it** into your project folder:
   ```
   C:\Users\emman\Downloads\wetransfer_kotapal_2025-09-22_1618\
   ```
4. **Rename it** to: `firebase-key.json`

### Step 3: Verify
- Check that `firebase-key.json` is in your project folder
- File should be there next to server.js

### Step 4: Restart Backend
1. Stop any running backend (Ctrl+C)
2. Double-click `run-backend.bat`
3. It should now work!

---

## Alternative: Download the Key Again

If you can't find the file:

1. Go to https://console.firebase.google.com/
2. Select your project
3. Settings ⚙️ → Project settings
4. Service accounts tab
5. Generate new private key
6. Download the JSON file
7. Rename to `firebase-key.json`
8. Place in project folder

---

## Quick Start (No Firebase)

For now, you can just test with Local JSON database:

1. **Double-click `run-backend.bat`** - It will use Local JSON
2. **Double-click `run-frontend.bat`** - Website will open
3. Test the website!

You can add Firebase later. The app works fine without it for testing!

