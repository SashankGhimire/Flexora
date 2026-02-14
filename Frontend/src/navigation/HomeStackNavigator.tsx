import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SimpleIcon } from '../components/ui';
import {
  HomeScreen,
  WorkoutScreen,
  ProgressScreen,
  ProfileScreen,
} from '../screens/home';
import { COLORS } from '../constants/theme';
import { HomeStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id="home-tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Workout') {
            iconName = 'activity';
          } else if (route.name === 'Progress') {
            iconName = 'trending-up';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          } else {
            iconName = 'circle';
          }

          return <SimpleIcon name={iconName} size={size} color={color} />;
        },
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
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarLabel: 'Workout',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
