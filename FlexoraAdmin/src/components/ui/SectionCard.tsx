import React from 'react';

export const SectionCard = ({ title, right, icon, children }: { title: string; right?: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) => (
  <section className="h-full rounded-2xl border border-brand-border/70 bg-brand-card p-4 shadow-soft transition hover:shadow-md">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon && <div className="text-brand-primary">{icon}</div>}
        <h2 className="text-base font-semibold tracking-tight text-brand-text">{title}</h2>
      </div>
      {right}
    </div>
    {children}
  </section>
);
