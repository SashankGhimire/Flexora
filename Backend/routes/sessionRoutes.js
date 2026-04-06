const express = require('express');
const { startSession, saveSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', protect, startSession);
router.post('/save', protect, saveSession);

module.exports = router;
