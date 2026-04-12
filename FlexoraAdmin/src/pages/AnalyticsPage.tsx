import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatCard } from '../components/ui/StatCard';
import { CheckCircleIcon, BarChartIcon, PieChartIcon, TrendingUpIcon, UsersIcon } from '../components/icons/Icons';
import { fetchAdminOverview, type AdminOverview } from '../services/adminService';

export const AnalyticsPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const data = await fetchAdminOverview();
        setOverview(data);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const recentUsers = useMemo(() => overview?.recentUsers || [], [overview]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <PageHeader title="Analytics" subtitle="Backend-backed user and workout performance insights" />

      {loadError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{loadError}</p> : null}

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-sm text-brand-muted">
          Loading analytics...
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sessions" value={overview.sessions.totalSessions.toLocaleString()} hint="Completed workout sessions" />
            <StatCard label="Avg Accuracy" value={`${overview.sessions.avgAccuracy}%`} hint="Performance quality" />
            <StatCard label="Calories Burned" value={overview.sessions.totalCaloriesBurned.toLocaleString()} hint="From completed sessions" />
            <StatCard label="Workout Minutes" value={overview.progress.totalWorkoutMinutes.toLocaleString()} hint="Tracked across users" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <SectionCard title="Weekly Growth" icon={<TrendingUpIcon className="w-5 h-5" />}>
              <div className="rounded-xl border border-brand-border bg-gradient-to-br from-brand-panel to-white p-4">
                <div className="flex h-44 items-end gap-2">
                  {overview.weeklySignups.map((point) => {
                    const height = Math.max(14, (point.count / Math.max(...overview.weeklySignups.map((item) => item.count), 1)) * 150);
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-primary to-blue-500" style={{ height: `${height}px` }} />
                        <span className="text-[10px] font-medium text-brand-muted">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Usage Mix" icon={<PieChartIcon className="w-5 h-5" />}>
              <div className="space-y-3">
                <div className="rounded-xl border border-brand-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Active Users</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">{overview.activeUsers}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Pending Users</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{overview.pendingUsers}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Admin Accounts</p>
                  <p className="mt-2 text-2xl font-bold text-brand-text">{overview.adminUsers}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Recent Performance" icon={<CheckCircleIcon className="w-5 h-5" />}>
              <div className="space-y-3">
                <div className="rounded-lg border border-brand-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Total Workouts</p>
                  <p className="mt-1 text-2xl font-bold text-brand-text">{overview.progress.totalWorkouts}</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Avg Accuracy</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{overview.progress.avgAccuracy}%</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Latest Sessions" icon={<BarChartIcon className="w-5 h-5" />}>
              <div className="space-y-3">
                <div className="rounded-lg border border-brand-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Sessions</p>
                  <p className="mt-1 text-2xl font-bold text-brand-text">{overview.sessions.totalSessions}</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Total Session Minutes</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{overview.sessions.totalDurationMinutes}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Recent Users" icon={<UsersIcon className="w-5 h-5" />}>
              {!recentUsers.length ? (
                <p className="text-sm text-brand-muted">No recent users available.</p>
              ) : (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between rounded-lg border border-brand-border bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-text">{user.name}</p>
                        <p className="truncate text-xs text-brand-muted">{user.email}</p>
                      </div>
                      <span
                        className={`ml-3 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.completedOnboarding
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {user.completedOnboarding ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-card px-4 py-6 text-sm text-brand-muted">
          No analytics data available.
        </div>
      )}
    </div>
  );
};
