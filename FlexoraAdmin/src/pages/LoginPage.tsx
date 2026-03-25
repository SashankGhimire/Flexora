import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@flexora.app');
  const [password, setPassword] = useState('password123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = login(email, password, remember);
    if (!ok) {
      setError('Please enter both email and password.');
      return;
    }
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(15,76,117,0.10),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(251,140,0,0.14),transparent_40%)]" />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-2xl border border-brand-border/80 bg-brand-card/85 p-8 shadow-soft backdrop-blur"
      >
        <h1 className="text-2xl font-extrabold text-brand-text">Flexora Admin</h1>
        <p className="mt-1 text-sm text-brand-muted">Sign in to continue</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">Email</label>
            <input
              className="w-full rounded-lg border border-brand-border bg-brand-bg/60 px-3 py-2 text-brand-text outline-none ring-brand-primary transition focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-brand-border bg-brand-bg/60 px-3 py-2 text-brand-text outline-none ring-brand-primary transition focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button className="w-full rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white transition hover:brightness-110">
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
};
