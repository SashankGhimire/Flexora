import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/theme';

interface GoalCardProps {
  targetReps: number;
  currentReps: number;
  onStartWorkout: () => void;
  style?: ViewStyle;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  targetReps,
  currentReps,
  onStartWorkout,
  style,
}) => {
  const progressPercentage = (currentReps / targetReps) * 100;
  const remaining = targetReps - currentReps;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <Text style={styles.title}>Today's Goal</Text>

      {/* Progress Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>{currentReps}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progressPercentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage.toFixed(0)}%</Text>
        </View>

        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statValue}>{targetReps}</Text>
        </View>
      </View>

      {/* Remaining Info */}
      <View style={styles.remainingContainer}>
        <Text style={styles.remainingText}>
          {remaining > 0 ? `${remaining} reps to go` : '🎉 Goal completed!'}
        </Text>
      </View>

      {/* Start Workout Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={onStartWorkout}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statBlock: {
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  remainingContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 10,
    marginBottom: 16,
  },
  remainingText: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
