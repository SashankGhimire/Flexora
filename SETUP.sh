#!/bin/bash

# Flexora - Backend & Frontend Setup Guide

echo "========================================"
echo "  Flexora Backend & Frontend Setup"
echo "========================================"
echo ""

# Backend Setup
echo "1️⃣  Setting up Backend..."
cd Backend

# Check if .env exists
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/flexora

# Server Port
PORT=5000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
EOF
  echo "✓ .env file created. Update it with your settings."
else
  echo "✓ .env file already exists"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install
echo "✓ Backend dependencies installed"
echo ""

# Start backend
echo "Starting backend server..."
echo "Backend will run on http://localhost:5000"
echo "Press Ctrl+C to stop the backend"
npm run dev &
BACKEND_PID=$!
echo ""

# Frontend Setup
echo "2️⃣  Setting up Frontend..."
cd ../Frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install
echo "✓ Frontend dependencies installed"
echo ""

# Show API Configuration
echo "========================================"
echo "  IMPORTANT: API Configuration"
echo "========================================"
echo ""
echo "The frontend is configured to connect to:"
echo "  Android Emulator: http://10.0.2.2:5000"
echo ""
echo "If you're using:"
echo "  ✓ Android Emulator (default): No changes needed"
echo "  ✓ iOS Simulator: Change to http://localhost:5000"
echo "  ✓ Physical Device: Change to http://YOUR_IP:5000"
echo ""
echo "Edit: Frontend/src/constants/api.ts"
echo ""

# Test backend
echo "Testing backend connection..."
sleep 2
curl -s http://localhost:5000 || echo "⚠️  Backend not responding. Make sure it's running."
echo ""

echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running (local or Atlas)"
echo "2. Backend is running at http://localhost:5000"
echo "3. Update Frontend/src/constants/api.ts if needed"
echo "4. Run: npm start (in Frontend folder)"
echo ""
