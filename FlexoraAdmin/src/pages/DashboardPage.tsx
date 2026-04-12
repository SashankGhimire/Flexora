import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataTable } from '../components/ui/DataTable';
import { CheckCircleIcon, CalendarIcon, BarChartIcon, TrendingUpIcon, UsersIcon } from '../components/icons/Icons';
import { fetchAdminOverview, type AdminOverview } from '../services/adminService';

type DashboardMetricCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClassName?: string;
};

const DashboardMetricCard = ({ label, value, icon, valueClassName }: DashboardMetricCardProps) => (
  <div className="h-full rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
    <div className="flex h-full items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
        <p className={`mt-2 truncate text-2xl font-bold text-brand-text ${valueClassName ?? ''}`}>{value}</p>
      </div>
      <div className="shrink-0">{icon}</div>
    </div>
  </div>
);

export const DashboardPage = () => {
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
        setLoadError(error instanceof Error ? error.message : 'Unable to load dashboard overview.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const weeklyMax = useMemo(() => Math.max(...(overview?.weeklySignups.map((point) => point.count) || [1]), 1), [overview]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <div className="shrink-0">
        <PageHeader title="Command Dashboard" subtitle="Live operational view powered by the backend" />
      </div>

      {loadError ? <p className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{loadError}</p> : null}

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-sm text-brand-muted">
          Loading dashboard...
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Total Users"
              value={overview.totalUsers.toLocaleString()}
              icon={<UsersIcon className="h-5 w-5 text-brand-primary" />}
            />
            <DashboardMetricCard
              label="Active Profiles"
              value={overview.activeUsers.toLocaleString()}
              icon={<CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
              valueClassName="text-emerald-600"
            />
            <DashboardMetricCard
              label="Onboarding Rate"
              value={`${overview.onboardingRate}%`}
              icon={<TrendingUpIcon className="h-5 w-5 text-blue-500" />}
              valueClassName="text-blue-600"
            />
            <DashboardMetricCard
              label="Pending Users"
              value={overview.pendingUsers.toLocaleString()}
              icon={<CalendarIcon className="h-5 w-5 text-amber-500" />}
              valueClassName="text-amber-600"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard title="Weekly Signups" icon={<TrendingUpIcon className="w-5 h-5" />}>
              <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-brand-border bg-gradient-to-br from-brand-panel to-white p-4">
                  <div className="flex h-36 items-end gap-2">
                    {overview.weeklySignups.map((point) => (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-brand-primary to-brand-light"
                          style={{ height: `${Math.max(12, (point.count / weeklyMax) * 120)}px` }}
                        />
                        <span className="text-[10px] font-medium text-brand-muted">{point.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-brand-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Onboarding Rate</p>
                    <p className="mt-2 text-3xl font-bold text-brand-primary">{overview.onboardingRate}%</p>
                    <p className="mt-1 text-xs text-brand-muted">Live user progress from the database</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-brand-border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Admins</p>
                      <p className="mt-2 text-2xl font-bold text-brand-text">{overview.adminUsers}</p>
                    </div>
                    <div className="rounded-xl border border-brand-border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Pending</p>
                      <p className="mt-2 text-2xl font-bold text-amber-600">{overview.pendingUsers}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Workout Sessions</p>
                    <p className="mt-2 text-2xl font-bold text-brand-text">{overview.sessions.totalSessions}</p>
                    <p className="mt-1 text-xs text-brand-muted">Completed session records</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Recent Users" icon={<UsersIcon className="w-5 h-5" />}>
              <div className="space-y-3">
                <DataTable
                  columns={[
                    {
                      key: 'name',
                      header: 'User',
                      render: (row) => (
                        <div>
                          <p className="font-semibold text-brand-text">{row.name}</p>
                          <p className="text-xs text-brand-muted">{row.email}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (row) => {
                        const active = !!row.completedOnboarding;
                        return (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {active ? 'Active' : 'Pending'}
                          </span>
                        );
                      },
                    },
                  ]}
                  rows={overview.recentUsers}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Progress Workouts</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">{overview.progress.totalWorkouts}</p>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Avg Accuracy</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">{overview.progress.avgAccuracy}%</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Calories Burned"
              value={overview.sessions.totalCaloriesBurned.toLocaleString()}
              icon={<CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
            />
            <DashboardMetricCard
              label="Workout Minutes"
              value={overview.progress.totalWorkoutMinutes.toLocaleString()}
              icon={<CalendarIcon className="h-5 w-5 text-blue-500" />}
            />
            <DashboardMetricCard
              label="Sessions"
              value={overview.sessions.totalSessions.toLocaleString()}
              icon={<BarChartIcon className="h-5 w-5 text-purple-500" />}
            />
            <DashboardMetricCard
              label="Admin Accounts"
              value={overview.adminUsers.toLocaleString()}
              icon={<TrendingUpIcon className="h-5 w-5 text-amber-500" />}
            />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-card px-4 py-6 text-sm text-brand-muted">
          No dashboard data available.
        </div>
      )}
    </div>
  );
};
