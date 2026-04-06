const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const { sendError, asyncHandler } = require('../utils/http');

const listExercises = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  if (req.query.type) {
    query.type = String(req.query.type).toUpperCase() === 'AI' ? 'AI' : 'non-AI';
  }

  const exercises = await Exercise.find(query).sort({ createdAt: -1 });

  return res.status(200).json({
    message: 'Exercises fetched successfully',
    exercises,
  });
});

const getExerciseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, 'Invalid exercise id');
  }

  const exercise = await Exercise.findById(id);

  if (!exercise || !exercise.isActive) {
    return sendError(res, 404, 'Exercise not found');
  }

  return res.status(200).json({
    message: 'Exercise fetched successfully',
    exercise,
  });
});

const addExercise = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    instructions,
    mediaUrl,
    targetMuscle,
    reps,
    duration,
    postureTips,
    caloriesPerMinute,
  } = req.body;

  if (!name || !type || !instructions) {
    return sendError(res, 400, 'name, type, and instructions are required');
  }

  const normalizedType = String(type).toUpperCase() === 'AI' ? 'AI' : 'non-AI';

  const exercise = await Exercise.create({
    name: String(name).trim(),
    type: normalizedType,
    instructions: String(instructions).trim(),
    mediaUrl: mediaUrl ? String(mediaUrl).trim() : '',
    targetMuscle: Array.isArray(targetMuscle) ? targetMuscle : [],
    reps: reps !== undefined && reps !== null ? Number(reps) : null,
    duration: duration !== undefined && duration !== null ? Number(duration) : null,
    postureTips: Array.isArray(postureTips) ? postureTips : [],
    caloriesPerMinute: caloriesPerMinute ? Number(caloriesPerMinute) : 6,
  });

  return res.status(201).json({
    message: 'Exercise created successfully',
    exercise,
  });
});

module.exports = {
  listExercises,
  getExerciseById,
  addExercise,
};
