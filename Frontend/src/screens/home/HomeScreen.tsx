import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GoalCard,
  SummaryCard,
  ProgressChart,
  PostureAccuracy,
} from '../../components/dashboard';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../types/navigation';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'>;
};

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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleStartWorkout = () => {
    Alert.alert('Start Workout', 'Navigate to workout screen');
    // navigation.navigate('Workout');
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

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1500);
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
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header with greeting and refresh */}
        <View style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getCurrentGreeting()}, {user?.name || 'User'}
            </Text>
            <Text style={styles.subGreeting}>Let's improve your form today</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="log-out" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Daily Goal Card */}
        <GoalCard
          targetReps={MOCK_DATA.dailyGoal.target}
          currentReps={MOCK_DATA.dailyGoal.current}
          onStartWorkout={handleStartWorkout}
        />

        {/* Posture Accuracy Indicator */}
        <PostureAccuracy accuracy={MOCK_DATA.postureAccuracy} />

        {/* Today's Summary */}
        <SummaryCard items={MOCK_DATA.todaySummary} />

        {/* Weekly Progress Chart */}
        <ProgressChart
          data={MOCK_DATA.weeklyProgress}
          title="Weekly Progress"
          maxValue={70}
        />

        {/* Quick Stats Section */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <Icon name="trending-up" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statCardLabel}>Consistency</Text>
            <Text style={styles.statCardValue}>85%</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primaryLight}20` }]}>
              <Icon name="award" size={24} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.statCardLabel}>Streak</Text>
            <Text style={styles.statCardValue}>12 days</Text>
          </View>
        </View>

        {/* Motivational Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipIconContainer}>
            <Icon name="lightbulb" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Proper posture during workouts prevents injuries and maximizes results.
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    width: 50,
    height: 50,
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
