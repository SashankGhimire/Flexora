import { useState } from 'react';
import { workouts } from '../data/mockData';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataTable } from '../components/ui/DataTable';

export const WorkoutsPage = () => {
  const [tab, setTab] = useState<'programs' | 'reports'>('programs');

  return (
    <div className="space-y-6">
      <PageHeader title="Workouts" subtitle="Programs, difficulty, and user feedback" />
      <div className="flex gap-2">
        <button
          onClick={() => setTab('programs')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === 'programs' ? 'bg-brand-primary text-white' : 'bg-white text-brand-text'
          }`}
        >
          Programs
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === 'reports' ? 'bg-brand-primary text-white' : 'bg-white text-brand-text'
          }`}
        >
          Reported Issues
        </button>
      </div>

      {tab === 'programs' ? (
        <SectionCard title="Workout Programs">
          <DataTable
            columns={[
              { key: 'title', header: 'Title', render: (row) => row.title },
              { key: 'type', header: 'Type', render: (row) => row.type },
              { key: 'level', header: 'Level', render: (row) => row.level },
              { key: 'durationMin', header: 'Duration', render: (row) => `${row.durationMin} min` },
              { key: 'status', header: 'Status', render: (row) => row.status },
            ]}
            rows={workouts}
          />
        </SectionCard>
      ) : (
        <SectionCard title="Reported Issues">
          <ul className="space-y-3 text-sm text-brand-text">
            <li className="rounded-xl border border-brand-border bg-white p-3">Inconsistent rep counting for high-speed curls.</li>
            <li className="rounded-xl border border-brand-border bg-white p-3">Camera alignment hint overlaps timer on small devices.</li>
            <li className="rounded-xl border border-brand-border bg-white p-3">Need better beginner progression for Week 1 plans.</li>
          </ul>
        </SectionCard>
      )}
    </div>
  );
};
