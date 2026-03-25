import { ActivityItem, AdminUser, WorkoutItem } from '../types';

export const summaryStats = {
  totalUsers: 12452,
  activeUsers: 8793,
  workoutsCompleted: 94512,
  aiSessions: 40126,
};

export const activities: ActivityItem[] = [
  { id: 'a1', user: 'Ava Johnson', action: 'Completed AI posture workout', time: '2 min ago' },
  { id: 'a2', user: 'Noah Kim', action: 'Updated profile and goals', time: '8 min ago' },
  { id: 'a3', user: 'Mia Perez', action: 'Started bodyweight challenge', time: '20 min ago' },
  { id: 'a4', user: 'Liam Shah', action: 'Completed 5 sessions this week', time: '1 hr ago' },
];

export const users: AdminUser[] = [
  { id: 'u1', name: 'Ava Johnson', email: 'ava@example.com', role: 'Admin', status: 'Active', joinedDate: '2026-01-08' },
  { id: 'u2', name: 'Noah Kim', email: 'noah@example.com', role: 'Coach', status: 'Active', joinedDate: '2026-02-11' },
  { id: 'u3', name: 'Mia Perez', email: 'mia@example.com', role: 'Support', status: 'Pending', joinedDate: '2026-02-28' },
  { id: 'u4', name: 'Liam Shah', email: 'liam@example.com', role: 'Coach', status: 'Disabled', joinedDate: '2025-12-13' },
  { id: 'u5', name: 'Olivia Tan', email: 'olivia@example.com', role: 'Support', status: 'Active', joinedDate: '2026-03-01' },
  { id: 'u6', name: 'Ethan Reed', email: 'ethan@example.com', role: 'Coach', status: 'Active', joinedDate: '2026-03-04' },
  { id: 'u7', name: 'Emma Stone', email: 'emma@example.com', role: 'Admin', status: 'Active', joinedDate: '2026-03-07' },
  { id: 'u8', name: 'Lucas Ford', email: 'lucas@example.com', role: 'Support', status: 'Pending', joinedDate: '2026-03-10' },
];

export const workouts: WorkoutItem[] = [
  { id: 'w1', title: 'AI Form Fix - Full Body', type: 'AI Workout', level: 'Intermediate', durationMin: 24, status: 'Published' },
  { id: 'w2', title: 'AI Core Balance Drill', type: 'AI Workout', level: 'Beginner', durationMin: 16, status: 'Published' },
  { id: 'w3', title: 'Bodyweight HIIT Express', type: 'Bodyweight Workout', level: 'Advanced', durationMin: 20, status: 'Draft' },
  { id: 'w4', title: 'Beginner Strength Circuit', type: 'Bodyweight Workout', level: 'Beginner', durationMin: 18, status: 'Published' },
  { id: 'w5', title: 'AI Mobility Recovery', type: 'AI Workout', level: 'Beginner', durationMin: 14, status: 'Draft' },
];

export const analytics = {
  weekly: [55, 60, 58, 67, 72, 76, 81],
  monthly: [210, 235, 260, 298, 324, 341],
  topExercises: [
    { name: 'Squats', sessions: 9821 },
    { name: 'Pushups', sessions: 8742 },
    { name: 'Lunges', sessions: 7630 },
    { name: 'Bicep Curls', sessions: 6548 },
  ],
};
