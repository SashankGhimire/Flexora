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
const onboardingRoutes = require('./routes/onboardingRoutes');
const userRoutes = require('./routes/userRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

// Health route for clients to validate they resolved the correct backend host.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'flexora-backend',
    status: 'ok',
  });
});

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

const listenOnPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve(server);
    });

    server.once('error', (error) => {
      reject(error);
    });
  });
};

const startServer = async () => {
  const preferredPort = Number(process.env.PORT) || 5000;
  const maxAttempts = 20;
  let server = null;
  let port = preferredPort;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      server = await listenOnPort(port);
      break;
    } catch (error) {
      if (error && error.code === 'EADDRINUSE') {
        port += 1;
        continue;
      }

      throw error;
    }
  }

  if (!server) {
    throw new Error(`No available port found in range ${preferredPort}-${preferredPort + maxAttempts - 1}`);
  }

  if (port !== preferredPort) {
    console.warn(`Port ${preferredPort} is busy. Starting server on ${port} instead.`);
  }

  console.log(`Flexora Backend Server running on port ${port}`);

  server.on('error', (error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});
