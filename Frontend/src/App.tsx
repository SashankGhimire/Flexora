import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { Animated, StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppLaunchSplash from './components/ui/AppLaunchSplash';
import {
  Colors,
  ThemeMode,
  THEME_MODE_STORAGE_KEY,
  getThemeMode,
  setThemeMode,
} from './theme/colors';

const ThemedRoot: React.FC<{
  AppNavigatorComponent: React.ComponentType;
  showSplash: boolean;
  splashOpacity: Animated.Value;
}> = ({ AppNavigatorComponent, showSplash, splashOpacity }) => {
  const { themeMode } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.background}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: Colors.background }]}> 
        <AppNavigatorComponent />

        {showSplash && (
          <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
            <AppLaunchSplash />
          </Animated.View>
        )}
      </View>
    </>
  );
};

function App() {
  const [AppNavigatorComponent, setAppNavigatorComponent] = useState<React.ComponentType | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    let mounted = true;
    const launchStartedAt = Date.now();
    const minSplashMs = 1500;

    const bootstrapThemeAndNavigator = async () => {
      const storedMode = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (storedMode === 'light' || storedMode === 'dark') {
        setThemeMode(storedMode as ThemeMode);
      }

      const navigationModule = await import('./navigation/AppNavigator');
      if (mounted) {
        setAppNavigatorComponent(() => navigationModule.AppNavigator);

        const elapsed = Date.now() - launchStartedAt;
        const waitRemaining = Math.max(0, minSplashMs - elapsed);
        setTimeout(() => {
          if (!mounted) {
            return;
          }

          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            if (mounted) {
              setShowSplash(false);
            }
          });
        }, waitRemaining);
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
        <AppLaunchSplash />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={getThemeMode()}>
        <AuthProvider>
          <AppDataProvider>
            <ThemedRoot
              AppNavigatorComponent={AppNavigatorComponent}
              showSplash={showSplash}
              splashOpacity={splashOpacity}
            />
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});

export default App;


