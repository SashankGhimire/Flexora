import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export const SettingsPage = () => {
  const [emailReports, setEmailReports] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Platform preferences and policies" />
      <SectionCard title="General">
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3">
            <span className="text-sm text-brand-text">Email weekly reports</span>
            <input
              type="checkbox"
              checked={emailReports}
              onChange={(e) => setEmailReports(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3">
            <span className="text-sm text-brand-text">Maintenance mode</span>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
            />
          </label>
        </div>
      </SectionCard>
    </div>
  );
};
