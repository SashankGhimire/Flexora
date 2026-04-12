import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList, HomeTabParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Card, PrimaryButton, SectionHeader, SimpleIcon, StatCard } from '../components/ui';
import { BODY_FOCUS, getProgramsByFocus } from '../data/workoutData';
import { useAppData } from '../context/AppDataContext';

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'Home'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

const AI_FEATURES = ['Form AI', 'Rep AI', 'Live Cam'];

const PROGRAM_COVER: Record<string, string> = {
  'abs-beginner': 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  'arm-beginner': 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  'chest-beginner': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  'leg-beginner': 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  'shoulder-beginner': 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'back-beginner': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'full-body-beginner': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
  abs: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  arms: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  chest: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  shoulder: 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  back: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'full body': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
};

const BODYWEIGHT_HERO_COVER =
  'https://images.unsplash.com/photo-1758875569284-c57e79ef75e0?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { getProgressForUser, workouts } = useAppData();
  const navigation = useNavigation<DashboardNavProp>();
  const { width } = useWindowDimensions();
  const [selectedFocus, setSelectedFocus] = useState<string>('Abs');
  const [dashboardStats, setDashboardStats] = useState({
    totalWorkouts: 0,
    totalCaloriesBurned: 0,
    avgAccuracy: 0,
    totalWorkoutMinutes: 0,
    todayMinutes: 0,
    streakDays: 0,
  });
  const focusSliderRef = useRef<ScrollView>(null);

  const isSameDay = (left: string | Date, right: Date) => {
    const leftDate = new Date(left);
    return (
      leftDate.getFullYear() === right.getFullYear() &&
      leftDate.getMonth() === right.getMonth() &&
      leftDate.getDate() === right.getDate()
    );
  };

  const calculateStreak = (dates: Array<string | Date>): number => {
    if (!dates.length) {
      return 0;
    }

    const uniqueDays = Array.from(
      new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)))
    ).sort((left, right) => (left < right ? 1 : -1));

    let streak = 1;
    let cursor = new Date(uniqueDays[0]);

    for (let index = 1; index < uniqueDays.length; index += 1) {
      const current = new Date(uniqueDays[index]);
      const diffDays = Math.round((cursor.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak += 1;
        cursor = current;
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
  };

  const loadStats = React.useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const progress = await getProgressForUser(user.id);
    const workoutHistory = Array.isArray(progress?.workoutHistory) ? progress.workoutHistory : [];
    const now = new Date();

    const todayMinutes = workoutHistory.reduce((sum: number, item: { completedAt?: string; durationSeconds?: number }) => {
      const completedAt = item.completedAt ? new Date(item.completedAt) : null;
      if (!completedAt || !isSameDay(completedAt, now)) {
        return sum;
      }

      return sum + Math.max(0, Math.round((Number(item.durationSeconds || 0) / 60)));
    }, 0);

    setDashboardStats({
      totalWorkouts: Number(progress?.performanceStats?.totalWorkouts || 0),
      totalCaloriesBurned: Number(progress?.performanceStats?.totalCaloriesBurned || 0),
      avgAccuracy: Number(progress?.performanceStats?.avgAccuracy || 0),
      totalWorkoutMinutes: Number(progress?.performanceStats?.totalWorkoutMinutes || 0),
      todayMinutes,
      streakDays: calculateStreak(workoutHistory.map((item: { completedAt?: string }) => item.completedAt || now.toISOString())),
    });
  }, [getProgressForUser, user?.id]);

  const focusCardWidth = Math.max(286, width - Spacing.lg * 2 - 8);
  const focusSnapInterval = focusCardWidth + Spacing.sm;

  const featuredPrograms = useMemo(() => {
    if (workouts.length > 0) {
      return workouts.map((workout) => ({
        id: workout._id,
        name: workout.title,
        focus: workout.category === 'full body' ? 'Full Body' : workout.category === 'arms' ? 'Arm' : workout.category === 'legs' ? 'Leg' : 'Abs',
        durationMinutes: workout.duration,
        exerciseIds: workout.exercises.map((item) => item.exercise?._id).filter(Boolean) as string[],
      }));
    }

    return BODY_FOCUS
      .map((focus) => getProgramsByFocus(focus)[0])
      .filter((program): program is NonNullable<typeof program> => Boolean(program));
  }, [workouts]);

  const bodyweightProgram = useMemo(
    () => featuredPrograms.find((program) => program.focus === 'Full Body') ?? featuredPrograms[0],
    [featuredPrograms],
  );

  const resolveCover = (programId: string, focus: string): string =>
    PROGRAM_COVER[programId] || PROGRAM_COVER[focus.toLowerCase()] || PROGRAM_COVER['full body'];

  const heroMetrics = useMemo(
    () => [
      { id: 'streak', label: 'Streak', value: `${dashboardStats.streakDays} days` },
      { id: 'today', label: 'Today', value: `${dashboardStats.todayMinutes} min` },
      { id: 'workouts', label: 'Workouts', value: String(dashboardStats.totalWorkouts) },
    ],
    [dashboardStats]
  );

  const quickStats = useMemo(
    () => [
      { id: 'workouts', label: 'Workouts Completed', value: String(dashboardStats.totalWorkouts), icon: 'activity' },
      { id: 'calories', label: 'Calories Burned', value: `${Math.round(dashboardStats.totalCaloriesBurned)} kcal`, icon: 'zap' },
      { id: 'minutes', label: 'Training Time', value: `${Math.round(dashboardStats.totalWorkoutMinutes)}m`, icon: 'clock' },
    ],
    [dashboardStats]
  );

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const goToProgram = (programId: string) => {
    navigation.navigate('WorkoutProgram', { programId });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      { text: 'Logout', onPress: () => logout() },
    ]);
  };

  const scrollFocusToFocus = (focus: string) => {
    const index = featuredPrograms.findIndex((program) => program.focus === focus);
    if (index < 0) {
      return;
    }
    focusSliderRef.current?.scrollTo({
      x: index * focusSnapInterval,
      y: 0,
      animated: true,
    });
  };

  const handleFocusMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const snappedIndex = Math.round(offsetX / focusSnapInterval);
    const boundedIndex = Math.max(0, Math.min(snappedIndex, featuredPrograms.length - 1));
    const nextFocus = featuredPrograms[boundedIndex]?.focus;
    if (nextFocus && nextFocus !== selectedFocus) {
      setSelectedFocus(nextFocus);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello {user?.name || 'Athlete'}</Text>
            <Text style={styles.subGreeting}>Ready for today&apos;s workout?</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <SimpleIcon name="log-out" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Card style={styles.aiCard}>
          <View style={styles.aiTopRow}>
            <View>
              <Text style={styles.aiTag}>FLEXORA AI MODE</Text>
              <Text style={styles.aiTitle}>AI Posture Trainer</Text>
              <Text style={styles.aiSubtitle}>Real-time posture correction and rep counting</Text>
              <View style={styles.aiStatusRow}>
                <View style={styles.aiStatusDot} />
                <Text style={styles.aiStatusText}>AI Engine Online</Text>
              </View>
            </View>
            <View style={styles.aiPulseWrap}>
              <SimpleIcon name="cpu" size={16} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.aiFeatureRow}>
            {AI_FEATURES.map((item) => (
              <View key={item} style={styles.aiFeatureChip}>
                <Text style={styles.aiFeatureText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroMetricRow}>
            {heroMetrics.map((metric) => (
              <View key={metric.id} style={styles.heroMetricPill}>
                <Text style={styles.heroMetricValue}>{metric.value}</Text>
                <Text style={styles.heroMetricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            title="Start AI Workout"
            onPress={() => navigation.navigate('StartWorkout')}
            style={styles.aiButton}
          />
        </Card>

        {bodyweightProgram ? (
          <ImageBackground source={{ uri: BODYWEIGHT_HERO_COVER }} imageStyle={styles.planImage} style={styles.planCard}>
            <View style={styles.planOverlay}>
              <Text style={styles.planTag}>START YOUR EXERCISE</Text>
              <Text style={styles.planTitle}>Bodyweight Workout</Text>
              <PrimaryButton title="Start Workout" onPress={() => goToProgram(bodyweightProgram.id)} style={styles.planButton} />
            </View>
          </ImageBackground>
        ) : null}

        <SectionHeader title="Body Focus" subtitle="Pick a focus and start a guided routine" style={styles.sectionTop} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusRow}>
          {BODY_FOCUS.map((focus) => (
            <TouchableOpacity
              key={focus}
              activeOpacity={0.85}
              style={[styles.focusChip, selectedFocus === focus && styles.focusChipActive]}
              onPress={() => {
                setSelectedFocus(focus);
                scrollFocusToFocus(focus);
              }}
            >
              <Text style={[styles.focusChipText, selectedFocus === focus && styles.focusChipTextActive]}>{focus}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          ref={focusSliderRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={focusSnapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={styles.focusProgramSlider}
          onMomentumScrollEnd={handleFocusMomentumEnd}
        >
          {featuredPrograms.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={[styles.focusProgramCard, { width: focusCardWidth }]}
              activeOpacity={0.9}
              onPress={() => goToProgram(program.id)}
            >
              <Image source={{ uri: resolveCover(program.id, program.focus) }} style={styles.focusProgramImage} />
              <View style={styles.focusProgramTextWrap}>
                <Text style={styles.focusProgramTitle}>{program.name}</Text>
                <Text style={styles.focusProgramMeta}>{program.durationMinutes} min • {program.exerciseIds.length} exercises</Text>
                <Text style={styles.focusProgramAction}>Tap to open program</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SectionHeader title="Quick Stats" subtitle="Your recent training snapshot" style={styles.sectionTop} />
        <View style={styles.statsGrid}>
          {quickStats.map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              icon={<SimpleIcon name={item.icon} size={16} color={Colors.primary} />}
            />
          ))}
        </View>

        <View style={styles.quickInsightCard}>
          <View style={styles.quickInsightIconWrap}>
            <SimpleIcon name="zap" size={18} color={Colors.primary} />
          </View>
          <View style={styles.quickInsightTextWrap}>
            <Text style={styles.quickInsightTitle}>Today&apos;s Momentum</Text>
            <Text style={styles.quickInsightText}>You&apos;re one workout away from extending your streak to 13 days.</Text>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  subGreeting: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.errorA35,
    backgroundColor: Colors.errorA14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  aiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  aiTag: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  aiTitle: {
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  aiSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  aiStatusRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.success,
  },
  aiStatusText: {
    color: Colors.primaryDark,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  aiButton: {
    marginTop: Spacing.md,
  },
  aiFeatureRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  aiFeatureChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  aiFeatureText: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  aiPulseWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA34,
    backgroundColor: Colors.primaryLightA16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetricRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroMetricPill: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  heroMetricValue: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  heroMetricLabel: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  planCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 188,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroSlider: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  planImage: {
    borderRadius: Radius.xl,
  },
  planOverlay: {
    flex: 1,
    backgroundColor: Colors.blackA45,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  planTag: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  planTitle: {
    marginTop: Spacing.xs,
    color: Colors.textOnPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  planMeta: {
    marginTop: Spacing.xs,
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.body,
  },
  planButton: {
    marginTop: Spacing.md,
  },
  sectionTop: {
    marginTop: Spacing.xl,
  },
  focusRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  focusProgramSlider: {
    marginTop: Spacing.md,
    paddingLeft: 2,
    paddingRight: Spacing.xl,
    gap: Spacing.sm,
  },
  focusProgramCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.sm,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  focusProgramImage: {
    width: 78,
    height: 78,
    borderRadius: Radius.md,
  },
  focusProgramTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  focusProgramTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  focusProgramMeta: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  focusProgramAction: {
    marginTop: Spacing.xs,
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  focusChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  focusChipActive: {
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
  },
  focusChipText: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  focusChipTextActive: {
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickInsightCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryA34,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  quickInsightIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInsightTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  quickInsightTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  quickInsightText: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 17,
  },
  bottomSpace: {
    height: 94,
  },
});



