import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/theme';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
