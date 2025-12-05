# Testing the Backend

## Quick Test

Run this command to test if backend is working:

```bash
curl http://localhost:3000
```

You should see:
```json
{"message":"Kota Smart Product Platform API is running","version":"1.0.0","status":"healthy"}
```

## If You See "Failed to fetch"

### Step 1: Check if backend is running
Open a new terminal and run:
```bash
netstat -ano | findstr :3000
```

If **nothing shows up** → Backend is NOT running

### Step 2: Start the backend manually

1. Open a new PowerShell window
2. Navigate to your project folder:
   ```powershell
   cd "C:\Users\emman\Downloads\wetransfer_kotapal_2025-09-22_1618"
   ```

3. Start the backend:
   ```powershell
   "KotaPal simple\nodejs\node-v20.10.0-win-x64\npm.cmd" start
   ```

4. Wait for it to say:
   ```
   Kota Smart Product Platform running on port 3000
   ```

### Step 3: Test again
Go to http://localhost:3000 in your browser

You should see the API response!

