import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SimpleIcon } from '../components/ui';
import { LoginScreen, RegisterScreen } from '../screens/auth';
import {
  DashboardScreen,
  StartWorkoutScreen,
  ExerciseSelectionScreen,
  PostureScreen,
  ProgressScreen,
  ProfileScreen,
} from '../screens';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';
import {
  AuthStackParamList,
  HomeStackParamList,
  HomeTabParamList,
  RootNavigationParamList,
} from '../types';

const Stack = createNativeStackNavigator<RootNavigationParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeTabIcon = ({ color, size }: { color: string; size: number }) => (
  <SimpleIcon name="home" size={size} color={color} />
);

const StartWorkoutTabIcon = ({ color, size }: { color: string; size: number }) => (
  <SimpleIcon name="activity" size={size} color={color} />
);

const ProgressTabIcon = ({ color, size }: { color: string; size: number }) => (
  <SimpleIcon name="trending-up" size={size} color={color} />
);

const ProfileTabIcon = ({ color, size }: { color: string; size: number }) => (
  <SimpleIcon name="user" size={size} color={color} />
);

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator
      id="auth-stack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const HomeTabs: React.FC = () => {
  return (
    <Tab.Navigator
      id="home-tabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="StartWorkout"
        component={StartWorkoutScreen}
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: StartWorkoutTabIcon,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ProgressTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      id="home-stack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <HomeStack.Screen name="HomeTabs" component={HomeTabs} />
      <HomeStack.Screen name="ExerciseSelection" component={ExerciseSelectionScreen} />
      <HomeStack.Screen name="Workout" component={PostureScreen} />
    </HomeStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root-stack"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
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
