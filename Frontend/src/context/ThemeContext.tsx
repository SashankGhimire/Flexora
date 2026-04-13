import React, { createContext, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  THEME_MODE_STORAGE_KEY,
  ThemeMode,
  AppThemeColors,
  darkTheme,
  lightTheme,
  getThemeMode,
  setThemeMode as setAppThemeMode,
} from '../theme/colors';

type ThemeContextType = {
  themeMode: ThemeMode;
  colors: AppThemeColors;
  isDarkMode: boolean;
  isThemeReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: ThemeMode;
}> = ({ children, initialMode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode ?? getThemeMode());
  const [isThemeReady, setIsThemeReady] = useState(true);

  const applyThemeMode = async (mode: ThemeMode): Promise<void> => {
    if (mode === themeMode) {
      return;
    }

    try {
      setThemeModeState(mode);
      setAppThemeMode(mode);
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('[ThemeContext] Failed to apply theme mode', error);
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    await applyThemeMode(nextMode);
  };

  const value = useMemo<ThemeContextType>(() => ({
    themeMode,
    colors: themeMode === 'dark' ? darkTheme : lightTheme,
    isDarkMode: themeMode === 'dark',
    isThemeReady,
    setThemeMode: applyThemeMode,
    toggleTheme,
  }), [themeMode, isThemeReady]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
