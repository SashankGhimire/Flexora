const express = require('express');
const { getProgressByUserId, resetCurrentUserProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId', protect, getProgressByUserId);
router.delete('/me/reset', protect, resetCurrentUserProgress);

module.exports = router;
