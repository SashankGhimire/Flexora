import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { AlertIcon, CheckCircleIcon } from '../components/icons/Icons';
import { fetchAdminOverview, fetchBackendHealth, type AdminOverview, type BackendHealth } from '../services/adminService';
import { resolveApiBaseUrl } from '../services/api';

export const SettingsPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [overviewData, healthData, baseUrl] = await Promise.all([
        fetchAdminOverview(),
        fetchBackendHealth(),
        resolveApiBaseUrl(),
      ]);
      setOverview(overviewData);
      setHealth(healthData);
      setApiBaseUrl(baseUrl);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load settings data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <PageHeader title="Settings" subtitle="Minimal backend status" />

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-sm text-brand-muted">
          Loading settings...
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Backend Status</p>
              <div className="mt-2 flex items-center gap-2">
                {health?.status === 'ok' ? <CheckCircleIcon className="h-5 w-5 text-emerald-500" /> : <AlertIcon className="h-5 w-5 text-amber-500" />}
                <p className="text-lg font-bold text-brand-text">{health?.status || 'unknown'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Total Users</p>
              <p className="mt-2 text-2xl font-bold text-brand-text">{overview?.totalUsers?.toLocaleString() || '0'}</p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Sessions</p>
              <p className="mt-2 text-2xl font-bold text-brand-text">{overview?.sessions?.totalSessions?.toLocaleString() || '0'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Service</p>
                <p className="mt-1 text-sm font-medium text-brand-text break-all">{health?.service || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Resolved API Base URL</p>
                <p className="mt-1 text-sm font-medium text-brand-text break-all">{apiBaseUrl || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Onboarding Rate</p>
                <p className="mt-1 text-sm font-medium text-brand-text">{overview ? `${overview.onboardingRate}%` : '-'}</p>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={load} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">Recent Users</p>
              <span className="rounded-full bg-brand-panel px-2 py-0.5 text-xs font-semibold text-brand-muted">
                {overview?.recentUsers?.length || 0}
              </span>
            </div>

            {!overview?.recentUsers?.length ? (
              <p className="text-sm text-brand-muted">No recent users available.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentUsers.map((user) => (
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
          </div>
        </>
      )}
    </div>
  );
};
