import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { ActivityIndicator, StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  Colors,
  ThemeMode,
  THEME_MODE_STORAGE_KEY,
  getThemeMode,
  isDarkMode,
  setThemeMode,
} from './theme/colors';

function App() {
  const [AppNavigatorComponent, setAppNavigatorComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapThemeAndNavigator = async () => {
      const storedMode = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (storedMode === 'light' || storedMode === 'dark') {
        setThemeMode(storedMode as ThemeMode);
      }

      const navigationModule = await import('./navigation/AppNavigator');
      if (mounted) {
        setAppNavigatorComponent(() => navigationModule.AppNavigator);
      }
    };

    bootstrapThemeAndNavigator();
    return () => {
      mounted = false;
    };
  }, []);

  if (!AppNavigatorComponent) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={getThemeMode()}>
        <AuthProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={Colors.background}
            translucent={false}
          />
          <View style={styles.container}>
            <AppNavigatorComponent />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default App;


