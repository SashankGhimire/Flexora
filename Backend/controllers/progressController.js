const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { sendError, asyncHandler } = require('../utils/http');

const calculateBmi = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) {
    return 0;
  }

  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  return Number(bmi.toFixed(1));
};

const getProgressByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, 'Invalid userId');
  }

  if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
    return sendError(res, 403, 'Forbidden');
  }

  const user = await User.findById(userId).select('weight height');
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  const progress = await Progress.findOne({ userId });
  const bmi = progress?.bmi || calculateBmi(user.weight, user.height);

  return res.status(200).json({
    message: 'Progress fetched successfully',
    progress: {
      userId,
      bmi,
      weightHistory: progress?.weightHistory || [],
      workoutHistory: progress?.workoutHistory || [],
      performanceStats: progress?.performanceStats || {
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
        avgAccuracy: 0,
        totalWorkoutMinutes: 0,
      },
    },
  });
});

module.exports = {
  getProgressByUserId,
};
