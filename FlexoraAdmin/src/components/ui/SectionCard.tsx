import React from 'react';

export const SectionCard = ({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-brand-border/70 bg-brand-card p-5 shadow-soft">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight text-brand-text">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);
