const express = require('express');
const { addWorkout } = require('../controllers/workoutController');
const { addExercise } = require('../controllers/exerciseController');
const { getOverview } = require('../controllers/adminController');

const router = express.Router();

router.get('/overview', getOverview);
router.post('/add-workout', addWorkout);
router.post('/add-exercise', addExercise);

module.exports = router;
