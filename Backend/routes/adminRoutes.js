const express = require('express');
const { addWorkout } = require('../controllers/workoutController');
const { addExercise } = require('../controllers/exerciseController');
const { protect, protectAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add-workout', protect, protectAdmin, addWorkout);
router.post('/add-exercise', protect, protectAdmin, addExercise);

module.exports = router;
