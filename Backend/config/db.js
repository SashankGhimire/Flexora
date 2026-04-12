/**
 * MongoDB Connection Configuration
 * Connects to MongoDB using Mongoose
 */

const mongoose = require('mongoose');

const FALLBACK_MONGO_URI = 'mongodb://127.0.0.1:27017/flexora';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI || FALLBACK_MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is missing');
    }

    if (!process.env.MONGO_URI) {
      console.warn(
        `⚠ MONGO_URI not found. Using development fallback: ${FALLBACK_MONGO_URI}`
      );
    }

    await mongoose.connect(mongoURI);
    
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    // Exit process with failure code
    process.exit(1);
  }
};

module.exports = connectDB;
