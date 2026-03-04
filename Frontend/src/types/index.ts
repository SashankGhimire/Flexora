export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
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
};

export type RootNavigationParamList = {
  Auth: undefined;
  Home: undefined;
};
