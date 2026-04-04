import React from 'react';
import { useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleIcon } from '../components/ui';
import { LoginScreen, RegisterScreen } from '../screens/auth';
import {
  DashboardScreen,
  ExerciseSelectionScreen,
  PostureScreen,
  ProgressScreen,
  ProfileScreen,
  WorkoutCompleteScreen,
  WorkoutProgramScreen,
  WorkoutSessionScreen,
} from '../screens';
import {
  ActivityScreen,
  AgeScreen,
  BMIScreen,
  GenderScreen,
  GoalScreen,
  HeightScreen,
  PreferenceScreen,
  WeeklyGoalScreen,
  WelcomeScreen,
  WeightScreen,
} from '../screens/onboarding';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import {
  AuthStackParamList,
  HomeStackParamList,
  HomeTabParamList,
  OnboardingStackParamList,
  RootNavigationParamList,
} from '../types';

const Stack = createNativeStackNavigator<RootNavigationParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

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
        contentStyle: { backgroundColor: Colors.background },
        animationEnabled: true,
        cardStyle: { opacity: 1 },
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const HomeTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 700;

  const tabBarHeight = compact ? 60 : 64;
  const tabBarBottom = insets.bottom > 0 ? Math.max(6, insets.bottom + 4) : 8;

  return (
    <Tab.Navigator
      id="home-tabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarHideOnKeyboard: true,
        animationEnabled: true,
        tabBarStyle: {
          backgroundColor: Colors.card,
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: tabBarBottom,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 16,
          paddingBottom: compact ? 6 : 7,
          paddingTop: compact ? 6 : 7,
          height: tabBarHeight,
          shadowColor: Colors.black,
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        tabBarItemStyle: {
          borderRadius: 10,
          marginHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
          marginBottom: 1,
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
        component={ExerciseSelectionScreen}
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
        contentStyle: { backgroundColor: Colors.background },
        animationEnabled: true,
        cardStyle: { opacity: 1 },
      }}
    >
      <HomeStack.Screen 
        name="HomeTabs" 
        component={HomeTabs}
        options={{
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="ExerciseSelection" 
        component={ExerciseSelectionScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="Workout" 
        component={PostureScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="WorkoutProgram" 
        component={WorkoutProgramScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="WorkoutSession" 
        component={WorkoutSessionScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <HomeStack.Screen 
        name="WorkoutComplete" 
        component={WorkoutCompleteScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </HomeStack.Navigator>
  );
};

const OnboardingStackScreen: React.FC = () => {
  return (
    <OnboardingStack.Navigator
      id="onboarding-stack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animationEnabled: true,
        cardStyle: { opacity: 1 },
      }}
      initialRouteName="Welcome"
    >
      <OnboardingStack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Goal" 
        component={GoalScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Gender" 
        component={GenderScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Age" 
        component={AgeScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Height" 
        component={HeightScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Weight" 
        component={WeightScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="Preference" 
        component={PreferenceScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="WeeklyGoal" 
        component={WeeklyGoalScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <OnboardingStack.Screen 
        name="BMI" 
        component={BMIScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </OnboardingStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root-stack"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animationEnabled: true,
          cardStyle: { opacity: 1 },
        }}
      >
        {isLoggedIn ? (
          user?.completedOnboarding ? (
          <Stack.Screen
            name="Home"
            component={HomeStackNavigator}
            options={{
              animationEnabled: true,
            }}
          />
          ) : (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingStackScreen}
              options={{
                animationEnabled: true,
              }}
            />
          )
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStackScreen}
            options={{
              animationEnabled: true,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};




