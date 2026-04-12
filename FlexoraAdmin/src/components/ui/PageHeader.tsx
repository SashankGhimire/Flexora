export const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-brand-muted">{subtitle}</p> : null}
    </div>
    <span className="rounded-full border border-brand-border bg-brand-card px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-muted">
      Live
    </span>
  </div>
);
