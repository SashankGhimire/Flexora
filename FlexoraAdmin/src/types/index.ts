export type UserRole = 'Admin' | 'Coach' | 'Support';
export type UserStatus = 'Active' | 'Disabled' | 'Pending';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
};

export type WorkoutType = 'AI Workout' | 'Bodyweight Workout';

export type WorkoutItem = {
  id: string;
  title: string;
  type: WorkoutType;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMin: number;
  status: 'Published' | 'Draft';
};

export type ActivityItem = {
  id: string;
  user: string;
  action: string;
  time: string;
};
