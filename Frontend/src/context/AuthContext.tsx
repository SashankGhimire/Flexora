import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logout as logoutApi,
  updateProfile as updateProfileApi,
} from '../services/authService';
import { getOnboardingProfile } from '../services/onboardingService';

const onboardingKey = (userId: string) => `@flexora:onboarding_completed:${userId}`;

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  completedOnboarding?: boolean;
};

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  markOnboardingCompleted: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatar?: { uri: string; name?: string; type?: string } | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  React.useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const response = await getCurrentUser();
        const completedOnboarding = await resolveOnboardingStatus(response.user);
        setUser({ ...response.user, completedOnboarding });
        setIsLoggedIn(true);
      } catch {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    bootstrapAuth();
  }, []);

  const resolveOnboardingStatus = async (nextUser: AuthUser): Promise<boolean> => {
    if (nextUser.completedOnboarding) {
      await AsyncStorage.setItem(onboardingKey(nextUser.id), 'true');
      return true;
    }

    const local = await AsyncStorage.getItem(onboardingKey(nextUser.id));
    if (local === 'true') {
      return true;
    }

    try {
      const response = await getOnboardingProfile(nextUser.id);
      if (response?.profile?.completedOnboarding) {
        await AsyncStorage.setItem(onboardingKey(nextUser.id), 'true');
        return true;
      }
    } catch {
      // Ignore profile fetch errors here and fallback to false.
    }

    return false;
  };

  const login = async (email: string, password: string): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    const response = await loginUser({ email: normalizedEmail, password });
    const completedOnboarding = await resolveOnboardingStatus(response.user);
    setUser({ ...response.user, completedOnboarding });
    setIsLoggedIn(true);
  };

  const logout = (): void => {
    logoutApi();
    setUser(null);
    setIsLoggedIn(false);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const response = await registerUser({ email: normalizedEmail, password, name: normalizedName });
    const completedOnboarding = await resolveOnboardingStatus(response.user);
    setUser({ ...response.user, completedOnboarding });
    setIsLoggedIn(true);
  };

  const markOnboardingCompleted = async (): Promise<void> => {
    if (!user) {
      return;
    }

    await AsyncStorage.setItem(onboardingKey(user.id), 'true');
    setUser({ ...user, completedOnboarding: true });
  };

  const updateProfile = async (data: {
    name?: string;
    avatar?: { uri: string; name?: string; type?: string } | null;
  }): Promise<void> => {
    const response = await updateProfileApi(data);
    const completedOnboarding = await resolveOnboardingStatus(response.user);
    setUser({ ...response.user, completedOnboarding });
  };

  const value: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
    register,
    markOnboardingCompleted,
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


