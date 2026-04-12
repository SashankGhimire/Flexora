import { NavLink } from 'react-router-dom';
import {
  DashboardIcon,
  UsersIcon,
  AnalyticsIcon,
  SettingsIcon,
} from '../icons/Icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar = () => {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-brand-border/70 bg-white p-6 lg:flex lg:flex-col">
      {/* Logo Section */}
      <div className="rounded-2xl border border-brand-border/70 bg-gradient-to-br from-white to-brand-panel/50 p-4 shadow-soft">
        <p className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-600">Flexora Admin</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-brand-muted font-semibold">Operations Hub</p>
        <div className="mt-3 inline-flex rounded-full border border-brand-primary/35 bg-gradient-to-r from-brand-primary/15 to-blue-500/15 px-3 py-1.5 text-[11px] font-semibold text-brand-light">
          🟢 Live • Connected
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="mt-8 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-primary/20 to-blue-500/10 text-brand-primary ring-1 ring-brand-primary/50 shadow-[0_8px_24px_rgba(24,194,156,0.12)]'
                    : 'text-brand-muted hover:bg-brand-panel hover:text-brand-text'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Info Card */}
      <div className="mt-auto rounded-2xl border border-brand-border/70 bg-gradient-to-br from-brand-primary/10 to-blue-500/5 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-brand-primary font-semibold">Pro Tip</p>
        <p className="mt-2 text-xs font-medium text-brand-text leading-relaxed">Monitor user engagement daily to identify optimization opportunities.</p>
      </div>
    </aside>
  );
};
