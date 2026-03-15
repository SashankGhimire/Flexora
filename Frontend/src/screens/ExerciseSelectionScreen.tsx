import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SectionHeader, SimpleIcon } from '../components/ui';
import { WorkoutCard } from '../components/workout';
import { ExerciseType, HomeStackParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { getAllPrograms } from '../data/workoutData';

type ExerciseNavProp = NativeStackNavigationProp<HomeStackParamList, 'ExerciseSelection'>;

type AiWorkout = {
  key: ExerciseType;
  title: string;
  description: string;
  icon: string;
};

const AI_WORKOUTS: AiWorkout[] = [
  { key: 'squat', title: 'AI Squat', description: 'Camera-based squat form detection', icon: 'activity' },
  { key: 'pushup', title: 'AI Pushup', description: 'Real-time pushup posture guidance', icon: 'target' },
  { key: 'lunge', title: 'AI Lunge', description: 'AI lunge alignment and rep counting', icon: 'zap' },
  { key: 'jumpingJack', title: 'AI Jumping Jack', description: 'Cardio form tracking with rep counter', icon: 'users' },
  { key: 'plank', title: 'AI Plank', description: 'Posture stability tracking for plank hold', icon: 'shield' },
  { key: 'bicepCurl', title: 'AI Bicep Curl', description: 'Rep and range tracking for curls', icon: 'activity' },
];

const HERO_POINTS = ['AI camera posture tracking', 'Live rep counting', 'Real-time correction'];

export const ExerciseSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseNavProp>();
  const programs = getAllPrograms();

  const handleStartAiWorkout = (exerciseType: ExerciseType) => {
    navigation.navigate('Workout', { exerciseType });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <SimpleIcon name="cpu" size={16} color={Colors.primary} />
            </View>
            <View style={styles.heroLivePill}>
              <Text style={styles.heroLiveText}>AI ONLINE</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>SMART TRAINING HUB</Text>
          <Text style={styles.heroSub}>Choose AI or guided bodyweight workouts in one place.</Text>
          <View style={styles.heroPointRow}>
            {HERO_POINTS.map((point) => (
              <View key={point} style={styles.heroPointChip}>
                <Text style={styles.heroPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader
          title="AI Workouts"
          subtitle="Existing posture detection workouts (unchanged AI functionality)"
          style={styles.sectionTop}
        />

        <View style={styles.grid}>
          {AI_WORKOUTS.map((workout) => (
            <TouchableOpacity
              key={workout.key}
              activeOpacity={0.9}
              style={styles.gridCard}
              onPress={() => handleStartAiWorkout(workout.key)}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.iconWrap}>
                  <SimpleIcon name={workout.icon} size={15} color={Colors.primary} />
                </View>
                <View style={styles.startPill}>
                  <Text style={styles.startPillText}>Start</Text>
                </View>
              </View>
              <Text style={styles.title}>{workout.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{workout.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader
          title="Bodyweight Workouts"
          subtitle="HomeWorkout-style beginner programs"
          style={styles.sectionTop}
        />

        <View style={styles.programList}>
          {programs.map((program) => (
            <WorkoutCard
              key={program.id}
              program={program}
              onPress={() => navigation.navigate('WorkoutProgram', { programId: program.id })}
            />
          ))}
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
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: Spacing.x2,
  },
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLivePill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  heroLiveText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  heroTitle: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  heroSub: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  heroPointRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  heroPointChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  heroPointText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  sectionTop: {
    marginTop: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridCard: {
    width: '48.5%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    minHeight: 138,
    padding: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryA3,
    backgroundColor: Colors.primaryLightA16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  startPillText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  title: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  description: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 15,
  },
  programList: {
    gap: Spacing.sm,
  },
  bottomSpace: {
    height: 92,
  },
});



