import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { HomeTabParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import {
  Card,
  PrimaryButton,
  SectionHeader,
  SimpleIcon,
  StatCard,
  WorkoutCard,
} from '../components/ui';

const WORKOUT_CATEGORIES = [
  { id: 'strength', label: 'Strength', icon: 'activity' },
  { id: 'cardio', label: 'Cardio', icon: 'zap' },
  { id: 'mobility', label: 'Mobility', icon: 'shield' },
  { id: 'ai', label: 'AI Training', icon: 'target' },
];

const RECOMMENDED = [
  {
    id: 'squat',
    title: 'Squats',
    description: 'Lower body form and depth control',
    difficulty: 'Beginner' as const,
    timer: '10 min',
    icon: 'activity',
  },
  {
    id: 'pushup',
    title: 'Push Ups',
    description: 'Upper body strength and alignment',
    difficulty: 'Intermediate' as const,
    timer: '8 min',
    icon: 'target',
  },
  {
    id: 'lunge',
    title: 'Lunges',
    description: 'Leg balance and posture control',
    difficulty: 'Intermediate' as const,
    timer: '12 min',
    icon: 'zap',
  },
];

const HERO_METRICS = [
  { id: 'streak', label: 'Streak', value: '12 days' },
  { id: 'accuracy', label: 'Accuracy', value: '92%' },
  { id: 'session', label: 'Today', value: '35 min' },
];

const QUICK_SIGNALS = [
  { id: 'focus', label: 'Focus Zone', value: 'Posture + Core', icon: 'target' },
  { id: 'energy', label: 'Energy', value: 'High', icon: 'zap' },
  { id: 'readiness', label: 'Readiness', value: '8.7 / 10', icon: 'activity' },
];

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<HomeTabParamList, 'Home'>>();

  const handleStartWorkout = () => {
    navigation.navigate('StartWorkout');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.name || 'Athlete'}</Text>
            <Text style={styles.subGreeting}>Ready to train smarter today?</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <SimpleIcon name="log-out" size={18} color="#F87171" />
          </TouchableOpacity>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>FLEXORA SIGNATURE MODE</Text>
              <Text style={styles.heroTitle}>AI Posture Trainer</Text>
              <Text style={styles.heroSubtitle}>Real-time posture correction with AI</Text>
            </View>
            <View style={styles.heroPulseWrap}>
              <View style={styles.heroPulseCore}>
                <SimpleIcon name="cpu" size={16} color={Colors.primary} />
              </View>
            </View>
          </View>

          <View style={styles.heroMetricRow}>
            {HERO_METRICS.map((metric) => (
              <View key={metric.id} style={styles.heroMetricPill}>
                <Text style={styles.heroMetricValue}>{metric.value}</Text>
                <Text style={styles.heroMetricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton title="Start AI Training" onPress={handleStartWorkout} style={styles.heroButton} />
        </Card>

        <SectionHeader
          title="Workout Categories"
          subtitle="Choose your training focus"
          style={styles.sectionTop}
        />
        <View style={styles.categoryGrid}>
          {WORKOUT_CATEGORIES.map((category) => (
            <Card key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryIconWrap}>
                <SimpleIcon name={category.icon} size={16} color={Colors.primary} />
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </Card>
          ))}
        </View>

        <SectionHeader
          title="Workout Recommendations"
          subtitle="Suggested sessions for today"
          style={styles.sectionTop}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {RECOMMENDED.map((item) => (
            <View key={item.id} style={styles.recommendationCardWrap}>
              <WorkoutCard
                title={item.title}
                description={item.description}
                difficulty={item.difficulty}
                timer={item.timer}
                icon={item.icon}
                buttonLabel="Start Workout"
                onStart={handleStartWorkout}
              />
            </View>
          ))}
        </ScrollView>

        <SectionHeader
          title="Progress Summary"
          subtitle="Your performance snapshot"
          style={styles.sectionTop}
        />
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Workouts"
            value="24"
            icon={<SimpleIcon name="activity" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Accuracy %"
            value="92%"
            icon={<SimpleIcon name="target" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Calories"
            value="1240"
            icon={<SimpleIcon name="zap" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Weekly"
            value="+18%"
            icon={<SimpleIcon name="trending-up" size={16} color={Colors.primary} />}
          />
        </View>

        <SectionHeader
          title="Coach Notes"
          subtitle="Today\'s strategic guidance"
          style={styles.sectionTop}
        />
        <Card style={styles.noteCard}>
          <View style={styles.noteRow}>
            <View style={styles.noteIconWrap}>
              <SimpleIcon name="award" size={16} color={Colors.primary} />
            </View>
            <View style={styles.noteTextWrap}>
              <Text style={styles.noteTitle}>Posture priority for today</Text>
              <Text style={styles.noteDesc}>
                Keep shoulders stable during push movements and slow down on the eccentric phase.
              </Text>
            </View>
          </View>
        </Card>

        <SectionHeader
          title="Quick Signals"
          subtitle="Snapshot of your training profile"
          style={styles.sectionTop}
        />
        <View style={styles.signalRow}>
          {QUICK_SIGNALS.map((item) => (
            <Card key={item.id} style={styles.signalCard}>
              <SimpleIcon name={item.icon} size={16} color={Colors.primary} />
              <Text style={styles.signalValue}>{item.value}</Text>
              <Text style={styles.signalLabel}>{item.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ACCENT_GREEN = '#22C55E';

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  userName: {
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.display,
    lineHeight: Typography.displayLine,
    fontWeight: FontWeight.heavy,
  },
  subGreeting: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  heroEyebrow: {
    color: ACCENT_GREEN,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  heroSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  heroButton: {
    marginTop: Spacing.lg,
  },
  heroPulseWrap: {
    width: 58,
    height: 58,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  heroPulseCore: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  heroMetricRow: {
    marginTop: Spacing.lg,
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
  sectionTop: {
    marginTop: Spacing.xl,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    borderRadius: Radius.lg,
    minHeight: 84,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  horizontalList: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  recommendationCardWrap: {
    width: 292,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  noteCard: {
    marginTop: Spacing.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.26)',
    marginRight: Spacing.sm,
  },
  noteTextWrap: {
    flex: 1,
  },
  noteTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  noteDesc: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 18,
  },
  signalRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  signalCard: {
    flex: 1,
    borderRadius: Radius.lg,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  signalValue: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  signalLabel: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  bottomSpace: {
    height: 88,
  },
});
