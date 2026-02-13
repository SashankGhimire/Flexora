import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    // TODO: Replace with actual API call
    // const response = await loginUser({ email, password });
    
    // Simulate API delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    
    // Mock user data
    const mockUser = {
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
    };
    
    setUser(mockUser);
    setIsLoggedIn(true);
  };

  const logout = (): void => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    // TODO: Replace with actual API call
    // const response = await registerUser({ email, password, name });
    
    // Simulate API delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    
    // Auto-login after registration
    setUser({ name, email });
    setIsLoggedIn(true);
  };

  const value: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
    register,
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
