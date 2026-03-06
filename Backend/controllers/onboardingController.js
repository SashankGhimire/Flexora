/**
 * Onboarding Controller
 * Handles create/read/update onboarding profile data
 */

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

const calculateBmi = (weight, height) => {
  const bmi = weight / ((height / 100) * (height / 100));
  return Number(bmi.toFixed(1));
};

exports.createOnboarding = async (req, res) => {
  try {
    const {
      goal,
      gender,
      age,
      height,
      weight,
      activityLevel,
      trainingPreference,
      workoutDays,
      bmi,
    } = req.body;

    const requiredFields = [
      'goal',
      'gender',
      'age',
      'height',
      'weight',
      'activityLevel',
      'trainingPreference',
      'workoutDays',
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    const resolvedBmi = bmi || calculateBmi(Number(weight), Number(height));

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        goal,
        gender,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        trainingPreference,
        workoutDays: Number(workoutDays),
        bmi: Number(resolvedBmi),
        completedOnboarding: true,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { completedOnboarding: true });

    return res.status(201).json({
      message: 'Onboarding data saved successfully',
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error saving onboarding data',
      error: error.message,
    });
  }
};

exports.getOnboardingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(req.user.id) !== String(userId)) {
      return res.status(403).json({ message: 'Unauthorized to access this profile' });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: 'Onboarding profile not found' });
    }

    return res.status(200).json({
      message: 'Onboarding profile fetched successfully',
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching onboarding profile',
      error: error.message,
    });
  }
};

exports.updateOnboarding = async (req, res) => {
  try {
    const {
      goal,
      gender,
      age,
      height,
      weight,
      activityLevel,
      trainingPreference,
      workoutDays,
      bmi,
    } = req.body;

    const current = await UserProfile.findOne({ userId: req.user.id });
    if (!current) {
      return res.status(404).json({ message: 'Onboarding profile not found' });
    }

    const nextHeight = Number(height ?? current.height);
    const nextWeight = Number(weight ?? current.weight);
    const nextBmi = bmi ? Number(bmi) : calculateBmi(nextWeight, nextHeight);

    const updated = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        goal: goal ?? current.goal,
        gender: gender ?? current.gender,
        age: age !== undefined ? Number(age) : current.age,
        height: nextHeight,
        weight: nextWeight,
        activityLevel: activityLevel ?? current.activityLevel,
        trainingPreference: trainingPreference ?? current.trainingPreference,
        workoutDays: workoutDays !== undefined ? Number(workoutDays) : current.workoutDays,
        bmi: nextBmi,
        completedOnboarding: true,
      },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(req.user.id, { completedOnboarding: true });

    return res.status(200).json({
      message: 'Onboarding profile updated successfully',
      profile: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error updating onboarding profile',
      error: error.message,
    });
  }
};
