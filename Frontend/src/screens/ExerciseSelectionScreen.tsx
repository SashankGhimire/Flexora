import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SectionHeader, SimpleIcon } from '../components/ui';
import { WorkoutCard } from '../components/workout';
import { ExerciseType, HomeStackParamList } from '../types';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { getAllPrograms } from '../data/workoutData';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';

type ExerciseNavProp = NativeStackNavigationProp<HomeStackParamList, 'ExerciseSelection'>;

type AiWorkout = {
  key: ExerciseType;
  title: string;
  description: string;
  icon: string;
};

const normalizeCategory = (category: string): string => {
  const value = (category || '').trim().toLowerCase();

  if (value === 'arm' || value === 'arms') return 'arms';
  if (value === 'leg' || value === 'legs') return 'legs';
  if (value === 'ab' || value === 'abs') return 'abs';
  if (value === 'fullbody' || value === 'full body') return 'full body';
  if (value === 'shoulders') return 'shoulder';

  return value;
};

const categoryToFocusLabel = (category: string): string => {
  const normalized = normalizeCategory(category);

  if (normalized === 'arms') return 'Arm';
  if (normalized === 'legs') return 'Leg';
  if (normalized === 'abs') return 'Abs';
  if (normalized === 'full body') return 'Full Body';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const AI_WORKOUTS: AiWorkout[] = [
  { key: 'squat', title: 'AI Squat', description: 'Camera-based squat form detection', icon: 'activity' },
  { key: 'pushup', title: 'AI Pushup', description: 'Real-time pushup posture guidance', icon: 'target' },
  { key: 'shoulderPress', title: 'AI Shoulder Press', description: 'Strict overhead press form and rep tracking', icon: 'zap' },
  { key: 'jumpingJack', title: 'AI Jumping Jack', description: 'Cardio form tracking with rep counter', icon: 'users' },
  { key: 'standingKneeRaise', title: 'AI Standing Knee Raise', description: 'Strict knee-drive tracking with rep counting', icon: 'shield' },
  { key: 'bicepCurl', title: 'AI Bicep Curl', description: 'Rep and range tracking for curls', icon: 'activity' },
];

const HERO_POINTS = ['AI camera posture tracking', 'Live rep counting', 'Real-time correction'];
const HERO_BG =
  'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=75';

export const ExerciseSelectionScreen: React.FC = () => {
  const { themeMode } = useTheme();
  const styles = React.useMemo(() => createStyles(), [themeMode]);
  const navigation = useNavigation<ExerciseNavProp>();
  const { workouts, workoutsState, refreshWorkouts } = useAppData();
  const contentScrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (workouts.length === 0 && !workoutsState.loading) {
      refreshWorkouts();
    }
  }, [refreshWorkouts, workouts.length, workoutsState.loading]);

  useFocusEffect(
    React.useCallback(() => {
      const rafId = requestAnimationFrame(() => {
        contentScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [])
  );

  const categories = React.useMemo(() => {
    const values = workouts.map((workout) => normalizeCategory(workout.category));
    return Array.from(new Set(values));
  }, [workouts]);

  const displayPrograms = React.useMemo(() => {
    if (workouts.length > 0) {
      const byFocus = new Map<string, {
        id: string;
        name: string;
        focus: string;
        durationMinutes: number;
        exerciseIds: string[];
      }>();

      workouts.forEach((program) => {
        const normalizedCategory = normalizeCategory(program.category);
        const focusKey = normalizedCategory || program._id;

        if (!focusKey || byFocus.has(focusKey)) {
          return;
        }

        byFocus.set(focusKey, {
          id: program._id,
          name: program.title,
          focus: categoryToFocusLabel(normalizedCategory),
          durationMinutes: program.duration,
          exerciseIds: program.exercises.map((item) => item.exercise?._id).filter(Boolean) as string[],
        });
      });

      return Array.from(byFocus.values());
    }

    return getAllPrograms();
  }, [workouts]);

  const handleStartAiWorkout = (exerciseType: ExerciseType) => {
    navigation.navigate('Workout', { exerciseType });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={contentScrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: HERO_BG }} style={styles.heroCard} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroGlowOrbLarge} />
            <View style={styles.heroGlowOrbSmall} />
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
        </ImageBackground>

        <SectionHeader
          title="AI Workouts"
          subtitle="Train with live camera guidance, posture feedback, and rep tracking"
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
          subtitle={categories.length ? `Dynamic categories: ${categories.join(', ')}` : 'Loading dynamic categories...'}
          style={styles.sectionTop}
        />

        {workoutsState.loading ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Loading workouts...</Text>
            <Text style={styles.statusText}>Fetching latest programs from backend.</Text>
          </View>
        ) : null}

        {!workoutsState.loading && workoutsState.error ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Could not sync right now</Text>
            <Text style={styles.statusText}>{workoutsState.error}</Text>
            <TouchableOpacity onPress={refreshWorkouts} style={styles.retryButton} activeOpacity={0.85}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.programList}>
          {displayPrograms.map((program) => (
            <WorkoutCard
              key={program.id}
              program={program as any}
              onPress={() => navigation.navigate('WorkoutProgram', { programId: program.id })}
            />
          ))}

          {!workoutsState.loading && displayPrograms.length === 0 ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>No workouts found</Text>
              <Text style={styles.statusText}>Ask admin to add programs from backend panel endpoints.</Text>
            </View>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: Spacing.x3 + Spacing.x3 + Spacing.x3,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroImage: {
    borderRadius: Radius.xl,
  },
  heroOverlay: {
    backgroundColor: Colors.blackA45,
    padding: Spacing.md,
  },
  heroGlowOrbLarge: {
    position: 'absolute',
    top: -28,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLightA16,
  },
  heroGlowOrbSmall: {
    position: 'absolute',
    bottom: -22,
    left: -16,
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLightA16,
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
    color: Colors.textOnPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  heroSub: {
    marginTop: Spacing.xs,
    color: Colors.whiteA82,
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
    borderColor: Colors.whiteA28,
    backgroundColor: Colors.whiteA14,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  heroPointText: {
    color: Colors.textOnPrimary,
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    minHeight: 138,
    padding: Spacing.sm,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
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
  statusCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  statusText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  retryButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
});



