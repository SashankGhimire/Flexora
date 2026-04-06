const mongoose = require('mongoose');

const weightEntrySchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
      min: 25,
      max: 300,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const workoutHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutSession',
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutProgram',
      default: null,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },
    averageAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const performanceStatsSchema = new mongoose.Schema(
  {
    totalWorkouts: {
      type: Number,
      default: 0,
    },
    totalCaloriesBurned: {
      type: Number,
      default: 0,
    },
    avgAccuracy: {
      type: Number,
      default: 0,
    },
    totalWorkoutMinutes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bmi: {
      type: Number,
      default: 0,
    },
    weightHistory: {
      type: [weightEntrySchema],
      default: [],
    },
    workoutHistory: {
      type: [workoutHistorySchema],
      default: [],
    },
    performanceStats: {
      type: performanceStatsSchema,
      default: () => ({
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
        avgAccuracy: 0,
        totalWorkoutMinutes: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Progress', progressSchema);
