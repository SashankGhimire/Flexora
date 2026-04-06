const mongoose = require('mongoose');

const performedExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      // Support both DB exercise ObjectId and local non-AI exercise keys.
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reps: {
      type: Number,
      min: 0,
      default: 0,
    },
    duration: {
      type: Number,
      min: 0,
      default: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutProgram',
      default: null,
    },
    exercisesPerformed: {
      type: [performedExerciseSchema],
      default: [],
    },
    totalReps: {
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
    status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'started',
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
