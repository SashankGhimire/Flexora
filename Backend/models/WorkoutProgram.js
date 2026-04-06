const mongoose = require('mongoose');

const workoutProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Workout title is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: ['abs', 'arms', 'legs', 'full body'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
    },
    exercises: [
      {
        exercise: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Exercise',
          required: true,
        },
        order: {
          type: Number,
          required: true,
          min: 1,
        },
        reps: {
          type: Number,
          min: 1,
          default: null,
        },
        duration: {
          type: Number,
          min: 1,
          default: null,
        },
      },
    ],
    coverImageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkoutProgram', workoutProgramSchema);
