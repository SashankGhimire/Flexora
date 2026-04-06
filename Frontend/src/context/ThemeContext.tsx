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

    try {
      setThemeModeState(mode);
      setAppThemeMode(mode);
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);

      // Many screens use module-level StyleSheet colors; a JS reload guarantees full theme repaint.
      if (__DEV__ && typeof DevSettings.reload === 'function') {
        setTimeout(() => {
          try {
            DevSettings.reload();
          } catch (error) {
            console.warn('[ThemeContext] Failed to reload app after theme change', error);
          }
        }, 40);
      }
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
