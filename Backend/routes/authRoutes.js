/**
 * Authentication Routes
 * Defines all auth-related API endpoints
 */

const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Public Routes
 */

// User Registration
// POST /api/auth/register
// body: { name, email, password }
router.post('/register', register);

// User Login
// POST /api/auth/login
// body: { email, password }
router.post('/login', login);

/**
 * Protected Routes (require valid JWT token)
 */

// Get Current User
// GET /api/auth/me
// headers: { Authorization: 'Bearer <token>' }
router.get('/me', protect, getMe);

module.exports = router;
