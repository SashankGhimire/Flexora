import type { ReactNode } from 'react';

type Column = {
  key: string;
  header: string;
  render: (row: any) => ReactNode;
};

export function DataTable({ columns, rows }: { columns: Column[]; rows: any[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border/80">
      <table className="min-w-full bg-transparent text-sm">
        <thead>
          <tr className="bg-brand-panel">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-brand-border/70 transition hover:bg-brand-panel/60">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-brand-text">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
