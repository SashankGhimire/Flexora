import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, PrimaryButton, SectionHeader, SimpleIcon } from '../components/ui';
import { ExerciseType, HomeStackParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';

type ExerciseNavProp = NativeStackNavigationProp<HomeStackParamList, 'ExerciseSelection'>;

type WorkoutItem = {
  key: ExerciseType;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timer: string;
  icon: string;
  accent: 'green' | 'red';
};

const ACCENTS = {
  green: '#22C55E',
  red: '#F87171',
} as const;

const AI_WORKOUTS: WorkoutItem[] = [
  {
    key: 'squat',
    title: 'Squats',
    description: 'AI-assisted form correction for lower body strength',
    difficulty: 'Beginner',
    timer: '8-12 min',
    icon: 'activity',
    accent: 'green',
  },
  {
    key: 'pushup',
    title: 'Push Ups',
    description: 'Real-time upper-body posture coaching',
    difficulty: 'Intermediate',
    timer: '6-10 min',
    icon: 'target',
    accent: 'green',
  },
  {
    key: 'lunge',
    title: 'Lunges',
    description: 'Balance and knee-alignment feedback',
    difficulty: 'Intermediate',
    timer: '10 min',
    icon: 'zap',
    accent: 'green',
  },
  {
    key: 'jumpingJack',
    title: 'Jumping Jacks',
    description: 'Cardio posture monitoring with rep guidance',
    difficulty: 'Beginner',
    timer: '5-8 min',
    icon: 'users',
    accent: 'red',
  },
];

const NORMAL_WORKOUTS: WorkoutItem[] = [
  {
    key: 'plank',
    title: 'Plank',
    description: 'Timer-based core endurance hold',
    difficulty: 'Beginner',
    timer: '3 x 45s',
    icon: 'shield',
    accent: 'green',
  },
  {
    key: 'bicepCurl',
    title: 'Bicep Curl',
    description: 'Controlled arm training with timed sets',
    difficulty: 'Intermediate',
    timer: '3 x 12 reps',
    icon: 'activity',
    accent: 'green',
  },
];

export const ExerciseSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseNavProp>();

  const handleStartWorkout = (exerciseType: ExerciseType) => {
    navigation.navigate('Workout', { exerciseType });
  };

  const renderGridCard = (workout: WorkoutItem) => (
    <Card key={workout.key} style={styles.gridCard}>
      <View style={styles.gridTop}>
        <View style={styles.iconWrap}>
          <SimpleIcon name={workout.icon} size={16} color={Colors.textSecondary} />
        </View>
        <Text style={[styles.timerText, { color: ACCENTS[workout.accent] }]}>{workout.timer}</Text>
      </View>

      <Text style={styles.title}>{workout.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{workout.description}</Text>
      <Text style={[styles.difficulty, { color: ACCENTS[workout.accent] }]}>{workout.difficulty}</Text>

      <PrimaryButton title="Start" onPress={() => handleStartWorkout(workout.key)} style={styles.startButton} />
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="AI WORKOUTS" subtitle="Exercises using posture detection camera" />
        <View style={styles.grid}>
          {AI_WORKOUTS.map(renderGridCard)}
        </View>

        <SectionHeader
          title="NORMAL WORKOUTS"
          subtitle="Timer-based workouts with exercise animation"
          style={styles.sectionTop}
        />
        <View style={styles.grid}>
          {NORMAL_WORKOUTS.map(renderGridCard)}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x2,
    paddingBottom: Spacing.x2,
  },
  sectionTop: {
    marginTop: Spacing.x2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridCard: {
    width: '47%',
    borderRadius: Radius.lg,
    minHeight: 214,
    padding: Spacing.md,
  },
  gridTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  timerText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  description: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 16,
  },
  difficulty: {
    marginTop: Spacing.sm,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  startButton: {
    marginTop: 'auto',
  },
  bottomSpace: {
    height: 88,
  },
});
