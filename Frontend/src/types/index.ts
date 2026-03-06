export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingAnswers = {
  goal?: 'lose_weight' | 'build_muscle' | 'improve_fitness' | 'stay_active';
  gender?: 'male' | 'female' | 'prefer_not';
  age?: number;
  heightUnit?: 'cm' | 'ft';
  heightCm?: number;
  heightFt?: number;
  heightIn?: number;
  weight?: number;
  activityLevel?: 'beginner' | 'occasional' | 'regular';
  trainingPreference?: 'ai_trainer' | 'bodyweight' | 'both';
  workoutDays?: 3 | 4 | 5 | 7;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goal: { answers: OnboardingAnswers };
  Gender: { answers: OnboardingAnswers };
  Age: { answers: OnboardingAnswers };
  Height: { answers: OnboardingAnswers };
  Weight: { answers: OnboardingAnswers };
  Activity: { answers: OnboardingAnswers };
  Preference: { answers: OnboardingAnswers };
  WeeklyGoal: { answers: OnboardingAnswers };
  BMI: { answers: OnboardingAnswers };
};

export type ExerciseType = 'squat' | 'pushup' | 'lunge' | 'jumpingJack' | 'plank' | 'bicepCurl';

export type HomeTabParamList = {
  Home: undefined;
  StartWorkout: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeTabs: undefined;
  ExerciseSelection: undefined;
  Workout: { exerciseType: ExerciseType };
  WorkoutProgram: { programId: string };
  WorkoutSession: { programId: string };
  WorkoutComplete: { programId: string; completedExercises: number; totalSeconds: number };
};

export type RootNavigationParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
};
