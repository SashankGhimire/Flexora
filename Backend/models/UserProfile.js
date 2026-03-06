/**
 * UserProfile Model
 * Stores onboarding questionnaire data for personalization
 */

const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    goal: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 13,
      max: 70,
    },
    height: {
      type: Number,
      required: true,
      min: 100,
      max: 260,
    },
    weight: {
      type: Number,
      required: true,
      min: 25,
      max: 300,
    },
    activityLevel: {
      type: String,
      required: true,
      trim: true,
    },
    trainingPreference: {
      type: String,
      required: true,
      trim: true,
    },
    workoutDays: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    bmi: {
      type: Number,
      required: true,
      min: 1,
      max: 80,
    },
    completedOnboarding: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
