const User = require('../models/User');
const Progress = require('../models/Progress');
const WorkoutSession = require('../models/WorkoutSession');
const { asyncHandler } = require('../utils/http');

const buildWeeklySignups = (users) => {
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(now.getDate() - now.getDay());

  return Array.from({ length: 8 }, (_, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - (7 * (7 - index)));

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const count = users.filter((user) => {
      if (!user.createdAt) {
        return false;
      }

      const createdAt = new Date(user.createdAt);
      return createdAt >= start && createdAt < end;
    }).length;

    return {
      label: `W${index + 1}`,
      count,
    };
  });
};

const getOverview = asyncHandler(async (req, res) => {
  const [users, progressDocs, sessionSummary] = await Promise.all([
    User.find({})
      .select('_id name email completedOnboarding createdAt updatedAt role')
      .sort({ createdAt: -1 }),
    Progress.find({}).select('performanceStats'),
    WorkoutSession.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgAccuracy: { $avg: '$averageAccuracy' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          totalDurationSeconds: { $sum: '$durationSeconds' },
        },
      },
    ]),
  ]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.completedOnboarding).length;
  const pendingUsers = Math.max(totalUsers - activeUsers, 0);
  const adminUsers = users.filter((user) => user.role === 'admin').length;

  const progressTotals = progressDocs.reduce(
    (accumulator, doc) => {
      const stats = doc.performanceStats || {};
      accumulator.totalWorkouts += Number(stats.totalWorkouts) || 0;
      accumulator.totalCaloriesBurned += Number(stats.totalCaloriesBurned) || 0;
      accumulator.totalWorkoutMinutes += Number(stats.totalWorkoutMinutes) || 0;
      return accumulator;
    },
    {
      totalWorkouts: 0,
      totalCaloriesBurned: 0,
      totalWorkoutMinutes: 0,
    }
  );

  const aggregateSessionSummary = sessionSummary[0] || {};
  const avgAccuracy = Number(aggregateSessionSummary.avgAccuracy || 0);

  const overview = {
    totalUsers,
    activeUsers,
    pendingUsers,
    adminUsers,
    onboardingRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
    weeklySignups: buildWeeklySignups(users),
    recentUsers: users.slice(0, 4).map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      completedOnboarding: !!user.completedOnboarding,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    })),
    progress: {
      totalWorkouts: progressTotals.totalWorkouts,
      totalCaloriesBurned: Number(progressTotals.totalCaloriesBurned.toFixed(2)),
      totalWorkoutMinutes: Number(progressTotals.totalWorkoutMinutes.toFixed(2)),
      avgAccuracy: Number.isFinite(avgAccuracy) ? Number(avgAccuracy.toFixed(2)) : 0,
    },
    sessions: {
      totalSessions: Number(aggregateSessionSummary.totalSessions || 0),
      totalCaloriesBurned: Number(aggregateSessionSummary.totalCaloriesBurned || 0),
      totalDurationMinutes: Number(((aggregateSessionSummary.totalDurationSeconds || 0) / 60).toFixed(2)),
      avgAccuracy: Number.isFinite(avgAccuracy) ? Number(avgAccuracy.toFixed(2)) : 0,
    },
  };

  return res.status(200).json({
    message: 'Overview fetched successfully',
    overview,
  });
});

module.exports = {
  getOverview,
};