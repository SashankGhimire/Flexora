/**
 * Authentication Controller
 * Handles user registration and login logic
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { uploadAvatarBuffer } = require('../config/cloudinary');

/**
 * Generate JWT Token
 * @param {string} userId - User ID from MongoDB
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role || 'user' }, process.env.JWT_SECRET, {
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
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { password } = req.body;
    const age = req.body?.age !== undefined ? Number(req.body.age) : undefined;
    const height = req.body?.height !== undefined ? Number(req.body.height) : undefined;
    const weight = req.body?.weight !== undefined ? Number(req.body.weight) : undefined;
    const goal = typeof req.body?.goal === 'string' ? req.body.goal.trim() : '';
    const activityLevel = typeof req.body?.activityLevel === 'string' ? req.body.activityLevel.trim() : '';

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
      age,
      height,
      weight,
      goal,
      activityLevel,
    });

    // Save user to database (password will be hashed in the pre-save middleware)
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Send success response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toSafeObject(),
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
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { password } = req.body;

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
    const token = generateToken(user);

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
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
      user: user.toSafeObject(),
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
    const { name, age, height, weight, goal, activityLevel } = req.body;

    if (name) {
      updates.name = name;
    }

    if (age !== undefined) {
      updates.age = Number(age);
    }

    if (height !== undefined) {
      updates.height = Number(height);
    }

    if (weight !== undefined) {
      updates.weight = Number(weight);
    }

    if (typeof goal === 'string') {
      updates.goal = goal.trim();
    }

    if (typeof activityLevel === 'string') {
      updates.activityLevel = activityLevel.trim();
    }

    if (req.file?.buffer) {
      const avatarUrl = await uploadAvatarBuffer(req.file.buffer, req.user.id);
      updates.avatarUrl = avatarUrl;
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
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

/**
 * List Users
 * GET /api/auth/users
 */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id name email avatarUrl completedOnboarding createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Users fetched successfully',
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

/**
 * Get User By ID
 * GET /api/auth/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id name email avatarUrl completedOnboarding createdAt updatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User fetched successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

/**
 * Update User By ID
 * PUT /api/auth/users/:id
 */
exports.updateUserById = async (req, res) => {
  try {
    const { name, email, completedOnboarding } = req.body;
    const updates = {};

    if (typeof name === 'string') {
      updates.name = name.trim();
    }

    if (typeof email === 'string') {
      updates.email = email.trim().toLowerCase();
    }

    if (typeof completedOnboarding === 'boolean') {
      updates.completedOnboarding = completedOnboarding;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('_id name email avatarUrl completedOnboarding createdAt updatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email already exists. Please use a different email.',
      });
    }

    res.status(500).json({
      message: 'Error updating user',
      error: error.message,
    });
  }
};

/**
 * Delete User By ID
 * DELETE /api/auth/users/:id
 */
exports.deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message,
    });
  }
};
