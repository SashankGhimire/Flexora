import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { COLORS } from './src/constants/theme';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
          translucent={false}
        />
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <AppNavigator />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
