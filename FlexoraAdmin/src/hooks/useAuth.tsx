import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => boolean;
  logout: () => void;
};

const AUTH_KEY = 'flexora-admin-auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated,
    login: (email: string, password: string, remember: boolean) => {
      if (!email || !password) return false;
      setIsAuthenticated(true);
      if (remember) {
        localStorage.setItem(AUTH_KEY, 'true');
      }
      return true;
    },
    logout: () => {
      setIsAuthenticated(false);
      localStorage.removeItem(AUTH_KEY);
    },
  }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context as AuthContextType;
};
