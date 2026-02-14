import React, { createContext, useContext, useState } from 'react';
import {
  loginUser,
  registerUser,
  logout as logoutApi,
  updateProfile as updateProfileApi,
} from '../services/authService';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { name: string; email: string; avatarUrl?: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatar?: { uri: string; name?: string; type?: string } | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await loginUser({ email, password });
    setUser(response.user);
    setIsLoggedIn(true);
  };

  const logout = (): void => {
    logoutApi();
    setUser(null);
    setIsLoggedIn(false);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    const response = await registerUser({ email, password, name });
    setUser(response.user);
    setIsLoggedIn(true);
  };

  const updateProfile = async (data: {
    name?: string;
    avatar?: { uri: string; name?: string; type?: string } | null;
  }): Promise<void> => {
    const response = await updateProfileApi(data);
    setUser(response.user);
  };

  const value: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
