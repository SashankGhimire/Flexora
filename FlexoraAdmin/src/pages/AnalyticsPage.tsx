import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Performance, retention, and growth insights" />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Weekly Active Users"
          right={<button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs">Last 8 Weeks</button>}
        >
          <div className="flex h-64 items-end gap-2 rounded-xl bg-brand-bg p-4">
            {[38, 44, 42, 56, 61, 63, 69, 74].map((n, i) => (
              <div key={i} className="flex flex-1 items-end gap-1">
                <div style={{ height: `${n}%` }} className="w-full rounded-t-md bg-brand-primary" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Completion Trend">
          <div className="h-64 rounded-xl bg-[linear-gradient(180deg,rgba(15,76,117,0.20),rgba(15,76,117,0.02))] p-4">
            <svg viewBox="0 0 400 180" className="h-full w-full">
              <polyline
                fill="none"
                stroke="#0F4C75"
                strokeWidth="4"
                points="0,140 55,120 110,130 165,95 220,85 275,70 330,60 400,45"
              />
            </svg>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
