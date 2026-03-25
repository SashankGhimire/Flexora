import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
];

export const Sidebar = () => {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-brand-border/70 bg-white p-6 lg:flex lg:flex-col">
      <div className="rounded-2xl border border-brand-border/70 bg-white p-4 shadow-soft">
        <p className="text-xl font-extrabold tracking-tight text-brand-text">Flexora Admin</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-brand-muted">Operations Console</p>
        <div className="mt-3 inline-flex rounded-full border border-brand-primary/35 bg-brand-primary/15 px-2.5 py-1 text-[11px] font-semibold text-brand-light">
          Live Workspace
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-primary/22 text-brand-text ring-1 ring-brand-primary/45 shadow-[0_8px_24px_rgba(24,194,156,0.15)]'
                  : 'text-brand-muted hover:bg-brand-panel hover:text-brand-text'
              }`
            }
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-panel text-[10px] leading-none text-brand-primary">•</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-brand-border/70 bg-brand-panel p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Admin Mode</p>
        <p className="mt-1 text-sm font-semibold text-brand-text">Full user control enabled</p>
        <p className="mt-1 text-xs text-brand-muted">Manage profiles, onboarding, and access with quick actions.</p>
      </div>
    </aside>
  );
};
