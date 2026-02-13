/**
 * Authentication Middleware
 * Verifies JWT token and authenticates requests
 */

const jwt = require('jsonwebtoken');

/**
 * Protect Routes - Verify JWT Token
 * Middleware to check if user is authenticated
 */
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const token =
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null;

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        message: 'No token provided. Please log in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token. Please log in again.',
      });
    }

    res.status(500).json({
      message: 'Authentication error',
      error: error.message,
    });
  }
};
