const express = require('express');
const { listExercises, getExerciseById } = require('../controllers/exerciseController');

const router = express.Router();

router.get('/', listExercises);
router.get('/:id', getExerciseById);

module.exports = router;
