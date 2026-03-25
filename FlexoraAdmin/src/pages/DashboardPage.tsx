import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '../components/ui/StatCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataTable } from '../components/ui/DataTable';
import { fetchUsers, type ApiUser } from '../services/usersService';

export const DashboardPage = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        setLoadError('Unable to load dashboard metrics. Ensure backend is running on port 5000.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.completedOnboarding).length;
    const pending = Math.max(total - active, 0);
    const thisMonth = users.filter((u) => {
      if (!u.createdAt) return false;
      const date = new Date(u.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return { total, active, pending, thisMonth };
  }, [users]);

  const onboardingRate = useMemo(() => {
    if (!metrics.total) return 0;
    return Math.round((metrics.active / metrics.total) * 100);
  }, [metrics.active, metrics.total]);

  const weeklySignups = useMemo(() => {
    const now = new Date();
    const points = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (7 * (7 - i)));
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const count = users.filter((u) => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d >= start && d < end;
      }).length;

      return {
        label: `W${i + 1}`,
        count,
      };
    });

    return points;
  }, [users]);

  const maxWeekly = useMemo(() => Math.max(...weeklySignups.map((p) => p.count), 1), [weeklySignups]);

  const recentUsers = users.slice(0, 4);

  return (
    <div className="h-full space-y-4 overflow-hidden">
      <PageHeader title="Command Dashboard" subtitle="Realtime control center for user growth and onboarding" />

      {loadError ? <p className="text-sm text-rose-300">{loadError}</p> : null}

      <section className="rise-in overflow-hidden rounded-2xl border border-brand-border/70 bg-brand-card shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(24,165,122,0.12),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.10),transparent_48%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Mission Control</p>
              <h2 className="mt-2 max-w-xl text-xl font-bold leading-tight text-brand-text sm:text-2xl">
                Growth is strong. Onboarding momentum is now your biggest lever.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-brand-muted">
                Completion is currently {onboardingRate}%. Focus new joiners in their first 24 hours to move this above 80%.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110">Create Weekly Brief</button>
                <button className="rounded-lg border border-brand-border bg-brand-panel px-3 py-2 text-sm font-semibold text-brand-text transition hover:bg-white">Export User Snapshot</button>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border bg-[#F6FAFD] p-5 lg:border-l lg:border-t-0">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Today Highlights</p>
            <div className="mt-3 space-y-2.5">
              <div className="rounded-xl border border-brand-border bg-white p-3">
                <p className="text-xs text-brand-muted">New this month</p>
                <p className="mt-1 text-2xl font-bold text-brand-text">{metrics.thisMonth}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-white p-3">
                <p className="text-xs text-brand-muted">Pending onboarding</p>
                <p className="mt-1 text-2xl font-bold text-amber-300">{metrics.pending}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-white p-3">
                <p className="text-xs text-brand-muted">Completion health</p>
                <p className="mt-1 text-2xl font-bold text-brand-light">{onboardingRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={metrics.total.toLocaleString()} hint="All registered accounts" />
        <StatCard label="Active Profiles" value={metrics.active.toLocaleString()} hint="Completed onboarding" />
        <StatCard label="Pending Setup" value={metrics.pending.toLocaleString()} hint="Needs onboarding" />
        <StatCard label="Joined This Month" value={metrics.thisMonth.toLocaleString()} hint="Current month growth" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Signup Trend (8 Weeks)">
          <div className="space-y-3">
            <div className="grid h-36 grid-cols-8 items-end gap-2 rounded-xl border border-brand-border bg-brand-panel p-3">
              {weeklySignups.map((p) => (
                <div key={p.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-brand-primary/75"
                    style={{ height: `${Math.max(12, (p.count / maxWeekly) * 110)}px` }}
                  />
                  <span className="text-[10px] text-brand-muted">{p.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-muted">Weekly signups from real backend records</p>
          </div>
        </SectionCard>

        <SectionCard title="Onboarding Funnel">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-brand-muted">
                <span>Completion Rate</span>
                <span>{onboardingRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-brand-panel">
                <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${onboardingRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                <p className="text-xs text-brand-muted">Active</p>
                <p className="mt-1 text-xl font-bold text-brand-light">{metrics.active}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                <p className="text-xs text-brand-muted">Pending</p>
                <p className="mt-1 text-xl font-bold text-amber-300">{metrics.pending}</p>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Recent Users">
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Name',
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
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'border border-brand-primary/30 bg-emerald-50 text-emerald-700' : 'border border-amber-300/60 bg-amber-50 text-amber-700'}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {active ? 'Active' : 'Pending'}
                    </span>
                  );
                },
              },
            ]}
            rows={recentUsers}
          />
        </SectionCard>
      </div>
    </div>
  );
};
