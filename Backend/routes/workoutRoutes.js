const express = require('express');
const { listWorkouts, getWorkoutById } = require('../controllers/workoutController');

const router = express.Router();

router.get('/', listWorkouts);
router.get('/:id', getWorkoutById);

module.exports = router;
