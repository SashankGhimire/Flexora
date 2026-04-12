import { apiFetch } from './api';
import type { ApiUser } from './usersService';

export type WeeklySignupPoint = {
  label: string;
  count: number;
};

export type AdminOverview = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  adminUsers: number;
  onboardingRate: number;
  weeklySignups: WeeklySignupPoint[];
  recentUsers: Array<ApiUser & { role?: string; completedOnboarding?: boolean }>;
  progress: {
    totalWorkouts: number;
    totalCaloriesBurned: number;
    totalWorkoutMinutes: number;
    avgAccuracy: number;
  };
  sessions: {
    totalSessions: number;
    totalCaloriesBurned: number;
    totalDurationMinutes: number;
    avgAccuracy: number;
  };
};

export type BackendHealth = {
  service: string;
  status: string;
};

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const response = await apiFetch('/api/admin/overview');
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Failed to fetch overview: ${response.status}`);
  }

  return data?.overview;
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const response = await apiFetch('/api/health');
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Failed to fetch backend health: ${response.status}`);
  }

  return {
    service: data?.service || 'flexora-backend',
    status: data?.status || 'unknown',
  };
}