const mongoose = require('mongoose');
const WorkoutProgram = require('../models/WorkoutProgram');
const { sendError, asyncHandler } = require('../utils/http');

const listWorkouts = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  if (req.query.category) {
    query.category = String(req.query.category).toLowerCase();
  }

  if (req.query.difficulty) {
    query.difficulty = String(req.query.difficulty).toLowerCase();
  }

  const workouts = await WorkoutProgram.find(query)
    .populate('exercises.exercise', 'name type targetMuscle reps duration mediaUrl postureTips')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    message: 'Workouts fetched successfully',
    workouts,
  });
});

const getWorkoutById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, 'Invalid workout id');
  }

  const workout = await WorkoutProgram.findById(id).populate(
    'exercises.exercise',
    'name type instructions targetMuscle reps duration mediaUrl postureTips'
  );

  if (!workout || !workout.isActive) {
    return sendError(res, 404, 'Workout not found');
  }

  return res.status(200).json({
    message: 'Workout fetched successfully',
    workout,
  });
});

const addWorkout = asyncHandler(async (req, res) => {
  const { title, category, difficulty, duration, exercises, coverImageUrl } = req.body;

  if (!title || !category || !difficulty || !duration || !Array.isArray(exercises) || !exercises.length) {
    return sendError(res, 400, 'title, category, difficulty, duration, and exercises are required');
  }

  const normalizedExercises = exercises.map((item, index) => ({
    exercise: item.exercise,
    order: Number(item.order) || index + 1,
    reps: item.reps ?? null,
    duration: item.duration ?? null,
  }));

  const workout = await WorkoutProgram.create({
    title: String(title).trim(),
    category: String(category).toLowerCase(),
    difficulty: String(difficulty).toLowerCase(),
    duration: Number(duration),
    exercises: normalizedExercises,
    coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : '',
  });

  return res.status(201).json({
    message: 'Workout created successfully',
    workout,
  });
});

module.exports = {
  listWorkouts,
  getWorkoutById,
  addWorkout,
};
