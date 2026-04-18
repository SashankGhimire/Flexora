/**
 * User Model
 * Defines the User schema for MongoDB
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const GMAIL_REGEX = /^[a-z0-9.]+@gmail\.com$/;

const isStrictGmailAddress = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!GMAIL_REGEX.test(normalizedEmail)) {
    return false;
  }

  const [localPart] = normalizedEmail.split('@');

  if (!localPart || localPart.length < 6 || localPart.length > 30) {
    return false;
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }

  return true;
};

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
      validate: {
        validator: isStrictGmailAddress,
        message: 'Only valid Gmail addresses are allowed',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    height: {
      type: Number,
      min: 100,
      max: 260,
    },
    weight: {
      type: Number,
      min: 25,
      max: 300,
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: '',
    },
    activityLevel: {
      type: String,
      trim: true,
      default: '',
    },
    restTimerSeconds: {
      type: Number,
      min: 5,
      max: 300,
      default: 30,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    completedOnboarding: {
      type: Boolean,
      default: false,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
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

userSchema.methods.toSafeObject = function toSafeObject() {
  const userId = this._id.toString();

  return {
    _id: userId,
    id: userId,
    name: this.name,
    email: this.email,
    age: this.age,
    height: this.height,
    weight: this.weight,
    goal: this.goal,
    gender: this.gender,
    dateOfBirth: this.dateOfBirth,
    activityLevel: this.activityLevel,
    restTimerSeconds: this.restTimerSeconds,
    avatarUrl: this.avatarUrl,
    completedOnboarding: this.completedOnboarding,
    createdByAdmin: this.createdByAdmin,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Create and export User model
module.exports = mongoose.model('User', userSchema);
