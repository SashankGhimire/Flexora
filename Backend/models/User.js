/**
 * User Model
 * Defines the User schema for MongoDB
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Hash password before saving if it has been modified
userSchema.pre('save', async function (next) {
  // Only hash password if it's new or has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt for hashing
    const salt = await bcryptjs.genSalt(10);
    // Hash the password
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Create and export User model
module.exports = mongoose.model('User', userSchema);
