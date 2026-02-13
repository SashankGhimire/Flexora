import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, RegisterScreen } from '../screens/auth';
import { HomeStackNavigator } from './HomeStackNavigator';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, RootNavigationParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootNavigationParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a1a' },
        animation: 'slide_from_right',
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a1a' },
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen
            name="Home"
            component={HomeStackNavigator}
            options={{
              animation: 'none',
            }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStackScreen}
            options={{
              animation: 'none',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
