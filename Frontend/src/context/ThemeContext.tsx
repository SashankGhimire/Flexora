import React, { createContext, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevSettings } from 'react-native';
import {
  THEME_MODE_STORAGE_KEY,
  ThemeMode,
  getThemeMode,
  setThemeMode as setAppThemeMode,
} from '../theme/colors';

type ThemeContextType = {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: ThemeMode;
}> = ({ children, initialMode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode ?? getThemeMode());

  const applyThemeMode = async (mode: ThemeMode): Promise<void> => {
    if (mode === themeMode) {
      return;
    }

    setThemeModeState(mode);
    setAppThemeMode(mode);
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);

    // Most screens use static StyleSheet objects, so a reload ensures full theme application.
    try {
      DevSettings.reload();
    } catch {
      // Ignore reload failures; mode will still apply on next app launch.
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    await applyThemeMode(nextMode);
  };

  const value = useMemo<ThemeContextType>(() => ({
    themeMode,
    isDarkMode: themeMode === 'dark',
    setThemeMode: applyThemeMode,
    toggleTheme,
  }), [themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
