# Troubleshooting Guide

## "Failed to fetch" Error

### Common Causes and Solutions

#### 1. Server Not Running
**Symptom:** Complete failure to connect to API

**Solution:**
```bash
# Make sure the backend server is running
npm start

# You should see:
# "Kota Smart Product Platform running on port 3000"
# "API Documentation: http://localhost:3000/api/docs"
```

#### 2. Port Mismatch
**Symptom:** Server runs but frontend can't connect

**Check:**
- Backend runs on port **3000**
- Frontend runs on port **3001** (default for Create React App)

**Solution:**
Ensure both servers are running:
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

#### 3. CORS Configuration
**Symptom:** Browser console shows CORS error

**Solution:**
Updated CORS in `server.js` to accept connections from both ports:
```javascript
origin: ['http://localhost:3001', 'http://localhost:3000', process.env.FRONTEND_URL]
```

#### 4. Proxy Configuration
**Frontend uses proxy:** `frontend/package.json` has:
```json
"proxy": "http://localhost:3000"
```

This means the frontend automatically proxies requests to the backend.

#### 5. Missing Dependencies
**Solution:**
```bash
# Install all backend dependencies
npm install

# Install all frontend dependencies
cd frontend
npm install
cd ..
```

#### 6. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3001
```

#### 7. Firewall or Antivirus
Some security software blocks local connections.

**Solution:**
- Temporarily disable firewall
- Add exception for Node.js
- Check if antivirus is blocking connections

#### 8. Database Initialization Error
**Symptom:** Server starts but crashes when making requests

**Solution:**
Check console for database errors. The app falls back to local JSON if Firebase isn't configured.

### Quick Start Checklist

- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 3001
- [ ] `.env` file configured (at minimum: PORT and JWT_SECRET)
- [ ] No firewall blocking localhost connections
- [ ] Browser console shows no CORS errors

### Testing the Connection

1. **Check backend is running:**
   ```
   Visit: http://localhost:3000
   Should see: {"message":"Kota Smart Product Platform API is running",...}
   ```

2. **Check API docs:**
   ```
   Visit: http://localhost:3000/api/docs
   Should see: API documentation
   ```

3. **Test from frontend:**
   ```
   Open browser dev tools
   Go to Network tab
   Try to login
   Check if request goes to /api/auth/login
   ```

### Common Error Messages

**"Network Error"**
- Server not running
- Wrong port
- Firewall blocking

**"CORS policy blocked"**
- Backend CORS not configured
- Origin mismatch

**"Connection refused"**
- Server not started
- Wrong port number

**"Failed to fetch"**
- Server down
- Network issue
- Proxy misconfigured

### Still Having Issues?

1. Check both terminal windows are running
2. Verify ports 3000 and 3001 are not in use
3. Try restarting both servers
4. Clear browser cache
5. Check browser console for detailed errors

