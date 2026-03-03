/**
 * Main Server File
 * Entry point for the Flexora authentication backend
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

const envResult = dotenv.config({ path: path.join(__dirname, '.env') });
if (envResult.error) {
  dotenv.config();
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
  console.warn('⚠ JWT_SECRET not found. Using development fallback secret.');
}

if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '7d';
}

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Basic route for testing server
app.get('/', (req, res) => {
  res.json({ message: 'Flexora Backend API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Flexora Backend Server running on port ${PORT}`);
});
