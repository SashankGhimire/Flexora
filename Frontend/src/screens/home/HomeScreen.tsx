import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SimpleIcon } from '../../components/ui';
import {
  GoalCard,
  SummaryCard,
  ProgressChart,
  PostureAccuracy,
} from '../../components/dashboard';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { HomeTabParamList } from '../../types/navigation';

// Mock workout data
const MOCK_DATA = {
  dailyGoal: {
    target: 50,
    current: 30,
  },
  postureAccuracy: 92,
  todaySummary: [
    { icon: 'activity', label: 'Exercises', value: '5 completed', color: COLORS.primary },
    { icon: 'clock', label: 'Time Spent', value: '35 minutes', color: COLORS.primaryLight },
    { icon: 'zap', label: 'Calories', value: '240 kcal', color: '#f59e0b' },
  ],
  weeklyProgress: [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 38 },
    { day: 'Thu', value: 61 },
    { day: 'Fri', value: 55 },
    { day: 'Sat', value: 48 },
    { day: 'Sun', value: 0 }, // Today
  ],
};

export const HomeScreen: React.FC = () => {
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

  const getCurrentGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getCurrentGreeting()}, {user?.name || 'Sasahank'}
            </Text>
            <Text style={styles.subGreeting}>Let’s improve your form today</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <SimpleIcon name="log-out" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTitle}>Today’s Focus</Text>
              <Text style={styles.heroSubtitle}>Core strength + posture</Text>
            </View>
            <View style={styles.heroBadge}>
              <SimpleIcon name="activity" size={14} color={COLORS.primary} />
              <Text style={styles.heroBadgeText}>30 min</Text>
            </View>
          </View>
          <Text style={styles.heroDescription}>
            Complete your goal and keep the streak alive.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleStartWorkout}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>Start Workout</Text>
            <SimpleIcon name="arrow-down" size={18} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <Text style={styles.sectionSubtitle}>Your reps for today</Text>
        </View>
        <GoalCard
          targetReps={MOCK_DATA.dailyGoal.target}
          currentReps={MOCK_DATA.dailyGoal.current}
          onStartWorkout={handleStartWorkout}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Posture Check</Text>
          <Text style={styles.sectionSubtitle}>Stay aligned</Text>
        </View>
        <PostureAccuracy accuracy={MOCK_DATA.postureAccuracy} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today’s Summary</Text>
          <Text style={styles.sectionSubtitle}>Keep the momentum</Text>
        </View>
        <SummaryCard items={MOCK_DATA.todaySummary} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <Text style={styles.sectionSubtitle}>Consistency over time</Text>
        </View>
        <ProgressChart
          data={MOCK_DATA.weeklyProgress}
          title="Weekly Progress"
          maxValue={70}
        />

        <View style={styles.quickStatsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <SimpleIcon name="trending-up" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statCardLabel}>Consistency</Text>
            <Text style={styles.statCardValue}>85%</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primaryLight}20` }]}>
              <SimpleIcon name="award" size={22} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.statCardLabel}>Streak</Text>
            <Text style={styles.statCardValue}>12 days</Text>
          </View>
        </View>

        <View style={styles.tipContainer}>
          <View style={styles.tipIconContainer}>
            <SimpleIcon name="lightbulb" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Proper posture during workouts prevents injuries and maximizes results.
            </Text>
          </View>
        </View>

        <View style={styles.spacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: COLORS.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.error}40`,
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}20`,
  },
  heroBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  heroDescription: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  heroButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  tipContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
    lineHeight: 18,
  },
  spacing: {
    height: 30,
  },
});
