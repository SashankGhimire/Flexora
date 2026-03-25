import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Topbar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const mobileItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
  ];

  const title = location.pathname.includes('/users') ? 'Users' : 'Dashboard';

  return (
    <header className="sticky top-0 z-20 border-b border-brand-border/70 bg-brand-panel/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Admin Console</p>
          <p className="text-lg font-bold text-brand-text">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-bg">
            Export
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                isActive
                  ? 'bg-brand-primary/18 text-brand-text ring-1 ring-brand-primary/50'
                  : 'bg-brand-card text-brand-muted'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};
