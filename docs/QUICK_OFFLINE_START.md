# 🚀 Quick Start - Offline Login

## ✅ Your App is Now 100% Offline-Capable!

### Step 1: Start the Servers

**Double-click**: `START_DASHBOARD.bat` (or `start.bat`)

OR manually:
```bash
# Terminal 1
npm start

# Terminal 2  
cd frontend
npm start
```

### Step 2: Login

Open: **http://localhost:3001/login**

#### Option A: Use Pre-configured Test Account
- **Email**: `john.doe@example.com`
- **Password**: `password` (this is the default hash - may need to create new account)

#### Option B: Create Your Own Account (Recommended)
1. Click "Create a new account"
2. Enter your details
3. Choose a plan
4. Click "Create account"
5. You're logged in! ✅

#### Option C: Create Test User with Known Password
```bash
npm run create-test-user
```
This creates:
- **Email**: `test@example.com`
- **Password**: `test123`

### Step 3: Access Dashboard

After login, you'll be redirected to: **http://localhost:3001/dashboard**

## ✅ What Works Offline

- ✅ User registration
- ✅ User login
- ✅ Password authentication
- ✅ Dashboard access
- ✅ Blocks management
- ✅ All data stored locally in `data/data.json`

## 🔒 Data Location

All your data is stored in:
```
data/data.json
```

This file is created automatically and works completely offline!

## 💡 Tips

1. **No Internet Required**: Everything works offline
2. **Data Persists**: All data saved to local file
3. **Secure**: Passwords are hashed with bcrypt
4. **Fast**: Local database is instant

---

**Ready to go!** Just start the servers and login. No internet needed! 🎉

