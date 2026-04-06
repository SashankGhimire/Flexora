const express = require('express');
const { getProgressByUserId } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId', protect, getProgressByUserId);

module.exports = router;
