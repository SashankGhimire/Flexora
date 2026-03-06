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
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { HomeStackParamList, HomeTabParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Card, PrimaryButton, SectionHeader, SimpleIcon, StatCard } from '../components/ui';
import { BODY_FOCUS, getProgramsByFocus } from '../data/workoutData';

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'Home'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

const QUICK_STATS = [
  { id: 'streak', label: 'Workout Streak', value: '12 Days', icon: 'activity' },
  { id: 'completed', label: 'Completed', value: '24', icon: 'check-circle' },
  { id: 'accuracy', label: 'Accuracy Score', value: '92%', icon: 'target' },
];

const HERO_METRICS = [
  { id: 'streak', label: 'Streak', value: '12 days' },
  { id: 'accuracy', label: 'Accuracy', value: '92%' },
  { id: 'today', label: 'Today', value: '35 min' },
];

const AI_FEATURES = ['Form AI', 'Rep AI', 'Live Cam'];

const PROGRAM_COVER: Record<string, string> = {
  'abs-beginner': 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  'arm-beginner': 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  'chest-beginner': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  'leg-beginner': 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  'shoulder-beginner': 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'back-beginner': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'full-body-beginner': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
};

const BODYWEIGHT_HERO_COVER =
  'https://images.unsplash.com/photo-1758875569284-c57e79ef75e0?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<DashboardNavProp>();
  const { width } = useWindowDimensions();
  const [selectedFocus, setSelectedFocus] = useState<string>('Abs');
  const focusSliderRef = useRef<ScrollView>(null);

  const focusCardWidth = Math.max(286, width - Spacing.lg * 2 - 8);
  const focusSnapInterval = focusCardWidth + Spacing.sm;

  const featuredPrograms = useMemo(
    () => BODY_FOCUS
      .map((focus) => getProgramsByFocus(focus)[0])
      .filter((program): program is NonNullable<typeof program> => Boolean(program)),
    [],
  );

  const bodyweightProgram = useMemo(
    () => featuredPrograms.find((program) => program.focus === 'Full Body') ?? featuredPrograms[0],
    [featuredPrograms],
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
            <SimpleIcon name="log-out" size={18} color="#F87171" />
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
            {HERO_METRICS.map((metric) => (
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
              <Image source={{ uri: PROGRAM_COVER[program.id] }} style={styles.focusProgramImage} />
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
          {QUICK_STATS.map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              icon={<SimpleIcon name={item.icon} size={16} color={Colors.primary} />}
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
    backgroundColor: '#0A0C0F',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x2,
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
    borderColor: 'rgba(248, 113, 113, 0.34)',
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: '#0E1116',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.22)',
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
    backgroundColor: '#22C55E',
  },
  aiStatusText: {
    color: '#9AE6B4',
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
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    borderColor: 'rgba(34, 197, 94, 0.34)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: 188,
  },
  heroSlider: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  planImage: {
    borderRadius: Radius.lg,
  },
  planOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.46)',
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
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  planMeta: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#141920',
    padding: Spacing.sm,
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
    borderColor: 'rgba(34, 197, 94, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
  bottomSpace: {
    height: 94,
  },
});
