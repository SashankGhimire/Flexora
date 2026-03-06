/**
 * Onboarding Routes
 * Stores and retrieves onboarding questionnaire answers
 */

const express = require('express');
const {
  createOnboarding,
  getOnboardingByUserId,
  updateOnboarding,
} = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/onboarding
router.post('/', protect, createOnboarding);

// GET /api/onboarding/:userId
router.get('/:userId', protect, getOnboardingByUserId);

// PUT /api/onboarding/update
router.put('/update', protect, updateOnboarding);

module.exports = router;
