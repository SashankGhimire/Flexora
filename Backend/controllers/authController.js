/**
 * Authentication Controller
 * Handles user registration and login logic
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} userId - User ID from MongoDB
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * User Registration
 * POST /api/auth/register
 * body: { name, email, password }
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation - check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered. Please use a different email.',
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    // Save user to database (password will be hashed in the pre-save middleware)
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send success response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages,
      });
    }

    // Handle other errors
    res.status(500).json({
      message: 'Error during registration',
      error: error.message,
    });
  }
};

/**
 * User Login
 * POST /api/auth/login
 * body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation - check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Check if password matches
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error during login',
      error: error.message,
    });
  }
};

/**
 * Get Current User (requires valid JWT token)
 * GET /api/auth/me
 * headers: { Authorization: 'Bearer <token>' }
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
      message: 'User data retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving user data',
      error: error.message,
    });
  }
};

/**
 * Update Current User (requires valid JWT token)
 * PUT /api/auth/me
 * headers: { Authorization: 'Bearer <token>' }
 * form-data: { name?, avatar? }
 */
exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    const { name } = req.body;

    if (name) {
      updates.name = name;
    }

    if (req.file) {
      updates.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
    });
  }
};
