export const StatCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-2xl border border-brand-border bg-brand-panel p-4 shadow-soft">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
    <p className="mt-2 text-3xl font-bold tracking-tight text-brand-text">{value}</p>
    <p className="mt-3 text-xs text-brand-muted">{hint}</p>
  </div>
);
