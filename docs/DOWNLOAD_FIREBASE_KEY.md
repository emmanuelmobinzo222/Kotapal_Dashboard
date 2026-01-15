# Download Firebase Key - Quick Steps

## You Need to Download firebase-key.json

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select your **kota-platform** project

### Step 2: Get Service Account Key
1. Click the **gear icon** ⚙️ (top left)
2. Click **"Project settings"**
3. Go to **"Service accounts"** tab
4. Click **"Generate new private key"** button
5. Click **"Generate key"** in the popup

### Step 3: Download Will Start
- A JSON file will download automatically
- It's probably in your **Downloads** folder
- Filename looks like: `kota-platform-xxxxx-firebase-adminsdk-xxxxx.json`

### Step 4: Rename and Move
1. Find the downloaded file
2. **Rename it to:** `firebase-key.json`
3. **Copy it** to your project folder:
   ```
   C:\Users\emman\Downloads\wetransfer_kotapal_2025-09-22_1618\
   ```

### Step 5: Verify
- You should see `firebase-key.json` in your project folder
- Make sure it's in the main folder (not in a subfolder)

### Step 6: Add to .gitignore
Open `.gitignore` file and add this line:
```
firebase-key.json
```

**IMPORTANT:** Never commit this file to GitHub!

---

## Once You Have the File

Come back and I'll help you start the server and test everything! 🚀

