const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');
const Progress = require('../models/Progress');
const { sendError, asyncHandler } = require('../utils/http');

const safeAccuracy = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(numeric.toFixed(2))));
};

const calculateSummary = (exercisesPerformed = [], fallbackCalories = 0, fallbackDuration = 0) => {
  const totalReps = exercisesPerformed.reduce((sum, item) => sum + (Number(item.reps) || 0), 0);
  const totalDuration =
    Number(fallbackDuration) ||
    exercisesPerformed.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);

  const accuracyValues = exercisesPerformed
    .map((item) => safeAccuracy(item.accuracy))
    .filter((value) => value > 0);

  const averageAccuracy = accuracyValues.length
    ? Number((accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length).toFixed(2))
    : 0;

  const caloriesBurned = Number(fallbackCalories) || Number((totalDuration / 60) * 5.5).toFixed(2);

  return {
    totalReps,
    totalDuration,
    averageAccuracy,
    caloriesBurned: Number(caloriesBurned),
  };
};

const startSession = asyncHandler(async (req, res) => {
  const { workoutProgramId } = req.body;

  if (workoutProgramId && !mongoose.Types.ObjectId.isValid(workoutProgramId)) {
    return sendError(res, 400, 'Invalid workoutProgramId');
  }

  const session = await WorkoutSession.create({
    userId: req.user.id,
    workoutProgramId: workoutProgramId || null,
    status: 'started',
    timestamp: new Date(),
  });

  return res.status(201).json({
    message: 'Workout session started',
    session,
  });
});

const saveSession = asyncHandler(async (req, res) => {
  const {
    sessionId,
    workoutProgramId,
    exercisesPerformed,
    caloriesBurned,
    durationSeconds,
  } = req.body;

  if (sessionId && !mongoose.Types.ObjectId.isValid(sessionId)) {
    return sendError(res, 400, 'Invalid sessionId');
  }

  if (workoutProgramId && !mongoose.Types.ObjectId.isValid(workoutProgramId)) {
    return sendError(res, 400, 'Invalid workoutProgramId');
  }

  if (!Array.isArray(exercisesPerformed) || !exercisesPerformed.length) {
    return sendError(res, 400, 'exercisesPerformed is required');
  }

  const normalizedExercises = exercisesPerformed.map((item) => {
    const rawExercise = item.exercise;
    const normalizedExercise =
      typeof rawExercise === 'string' && mongoose.Types.ObjectId.isValid(rawExercise)
        ? new mongoose.Types.ObjectId(rawExercise)
        : String(rawExercise || item.exerciseName || 'unknown-exercise');

    return {
      exercise: normalizedExercise,
      reps: Number(item.reps) || 0,
      duration: Number(item.duration) || 0,
      accuracy: safeAccuracy(item.accuracy),
    };
  });

  const summary = calculateSummary(normalizedExercises, caloriesBurned, durationSeconds);

  let session;
  if (sessionId) {
    session = await WorkoutSession.findOneAndUpdate(
      { _id: sessionId, userId: req.user.id },
      {
        workoutProgramId: workoutProgramId || null,
        exercisesPerformed: normalizedExercises,
        totalReps: summary.totalReps,
        averageAccuracy: summary.averageAccuracy,
        caloriesBurned: summary.caloriesBurned,
        durationSeconds: summary.totalDuration,
        status: 'completed',
        timestamp: new Date(),
      },
      { new: true }
    );
  }

  if (!session) {
    session = await WorkoutSession.create({
      userId: req.user.id,
      workoutProgramId: workoutProgramId || null,
      exercisesPerformed: normalizedExercises,
      totalReps: summary.totalReps,
      averageAccuracy: summary.averageAccuracy,
      caloriesBurned: summary.caloriesBurned,
      durationSeconds: summary.totalDuration,
      status: 'completed',
      timestamp: new Date(),
    });
  }

  const progress = await Progress.findOne({ userId: req.user.id });
  const totalWorkouts = (progress?.performanceStats?.totalWorkouts || 0) + 1;
  const totalCalories = (progress?.performanceStats?.totalCaloriesBurned || 0) + summary.caloriesBurned;
  const totalMinutes = (progress?.performanceStats?.totalWorkoutMinutes || 0) + summary.totalDuration / 60;
  const prevAvg = progress?.performanceStats?.avgAccuracy || 0;
  const avgAccuracy = Number((((prevAvg * (totalWorkouts - 1)) + summary.averageAccuracy) / totalWorkouts).toFixed(2));

  const updatedProgress = await Progress.findOneAndUpdate(
    { userId: req.user.id },
    {
      $push: {
        workoutHistory: {
          sessionId: session._id,
          programId: session.workoutProgramId,
          caloriesBurned: session.caloriesBurned,
          durationSeconds: session.durationSeconds,
          averageAccuracy: session.averageAccuracy,
          completedAt: session.timestamp,
        },
      },
      $set: {
        performanceStats: {
          totalWorkouts,
          totalCaloriesBurned: Number(totalCalories.toFixed(2)),
          avgAccuracy,
          totalWorkoutMinutes: Number(totalMinutes.toFixed(2)),
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    message: 'Workout session saved successfully',
    session,
    progress: updatedProgress,
  });
});

module.exports = {
  startSession,
  saveSession,
};
