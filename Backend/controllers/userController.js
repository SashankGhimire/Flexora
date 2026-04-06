const Progress = require('../models/Progress');
const User = require('../models/User');
const { sendError, asyncHandler } = require('../utils/http');

const calculateBmi = (weight, height) => {
  if (!weight || !height) {
    return 0;
  }

  return Number((weight / Math.pow(height / 100, 2)).toFixed(1));
};

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  return res.status(200).json({
    message: 'Profile fetched successfully',
    user: user.toSafeObject(),
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'age', 'height', 'weight', 'goal', 'activityLevel'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (typeof updates.name === 'string') {
    updates.name = updates.name.trim();
  }

  if (typeof updates.goal === 'string') {
    updates.goal = updates.goal.trim();
  }

  if (typeof updates.activityLevel === 'string') {
    updates.activityLevel = updates.activityLevel.trim();
  }

  if (updates.age !== undefined) {
    updates.age = Number(updates.age);
  }

  if (updates.height !== undefined) {
    updates.height = Number(updates.height);
  }

  if (updates.weight !== undefined) {
    updates.weight = Number(updates.weight);
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  if (updates.weight || updates.height) {
    const bmi = calculateBmi(user.weight, user.height);

    await Progress.findOneAndUpdate(
      { userId: user._id },
      {
        $set: { bmi },
        ...(updates.weight
          ? {
              $push: {
                weightHistory: {
                  value: Number(user.weight),
                  date: new Date(),
                },
              },
            }
          : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  return res.status(200).json({
    message: 'Profile updated successfully',
    user: user.toSafeObject(),
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
};
