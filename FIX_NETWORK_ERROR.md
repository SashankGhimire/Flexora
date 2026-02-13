# Fix Network Error - Quick Guide

## The Problem
You're getting a "Network Error" when trying to register/login. This means the frontend cannot connect to the backend.

## Why This Happens
- Backend server is not running
- Frontend API URL is incorrect for your environment
- On Android emulator: `localhost` doesn't work, need `10.0.2.2`

## Solution

### Step 1: Start the Backend Server

```bash
cd Backend

# Make sure .env exists with MongoDB configuration
# MONGO_URI=mongodb://localhost:27017/flexora
# PORT=5000
# JWT_SECRET=your_secret_key
# JWT_EXPIRE=7d

npm run dev
```

**Wait for this message:**
```
✓ MongoDB connected successfully
Flexora Backend Server running on port 5000
```

### Step 2: Update Frontend API Configuration

Edit: `Frontend/src/constants/api.ts`

**For Android Emulator (default):**
```typescript
export const API_BASE_URL = 'http://10.0.2.2:5000/api';
```

**For iOS Simulator:**
```typescript
export const API_BASE_URL = 'http://localhost:5000/api';
```

**For Physical Device:**
```typescript
// Replace 192.168.1.100 with your machine's actual IP address
export const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

To find your machine IP:
- Windows: Run `ipconfig` in terminal, look for IPv4 Address
- Mac/Linux: Run `ifconfig` in terminal

### Step 3: Start the Frontend

```bash
cd Frontend
npm start
```

## Test It Works

1. Enter test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123

2. Click "Create Account"

3. Should see: **"Account created successfully!"**

4. You'll be redirected to Login screen

## If Still Getting Error

Check the console error message:
```
Network Error: Cannot connect to backend at http://10.0.2.2:5000/api
```

**Solutions:**
1. ✓ Is backend running on port 5000?
2. ✓ Is MongoDB connected?
3. ✓ Are you using correct API URL for your environment?
4. ✓ Can you access http://localhost:5000 in browser? (should show JSON message)

## Network Request Flow

```
Frontend (React Native)
    ↓
axios request to http://10.0.2.2:5000/api/auth/register
    ↓
Backend Express Server (localhost:5000)
    ↓
MongoDB (localhost:27017/flexora)
    ↓
Response sent back with token + user data
    ↓
Frontend stores token in memory
```

## Common Issues

| Error | Solution |
|-------|----------|
| "Cannot connect to backend" | Start backend with `npm run dev` in Backend folder |
| "MongoDB connection failed" | Ensure MongoDB is running locally or check MONGO_URI in .env |
| "Invalid URL format" | Check API_BASE_URL syntax in Frontend/src/constants/api.ts |
| "CORS error" | Backend CORS is enabled, check browser/emulator network |

---

**After fixing:** Try registering again. If backend is running and API URL is correct, it should work! 🎉
