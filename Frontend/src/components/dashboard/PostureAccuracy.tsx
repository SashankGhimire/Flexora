import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/theme';

interface PostureAccuracyProps {
  accuracy: number; // 0-100
  style?: ViewStyle;
}

export const PostureAccuracy: React.FC<PostureAccuracyProps> = ({
  accuracy,
  style,
}) => {
  // Clamp accuracy between 0 and 100
  const clampedAccuracy = Math.max(0, Math.min(100, accuracy));

  // Determine color based on accuracy
  const getAccuracyColor = (value: number): string => {
    if (value >= 85) return COLORS.success;
    if (value >= 70) return COLORS.primaryLight;
    if (value >= 50) return '#f59e0b'; // Orange/warning
    return COLORS.error;
  };

  const accuracyColor = getAccuracyColor(clampedAccuracy);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (clampedAccuracy / 100) * circumference;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Posture Accuracy</Text>

      <View style={styles.circleContainer}>
        {/* Background circle */}
        <View
          style={[
            styles.circle,
            {
              borderColor: COLORS.border,
              borderWidth: 3,
            },
          ]}
        />

        {/* Progress circle (simulated with styled view) */}
        <View
          style={[
            styles.circle,
            {
              borderColor: accuracyColor,
              borderWidth: 4,
            },
          ]}
        />

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.accuracyValue}>{clampedAccuracy}%</Text>
          <Text style={styles.accuracyLabel}>Accuracy</Text>
        </View>
      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: accuracyColor },
          ]}
        />
        <Text style={styles.statusText}>
          {clampedAccuracy >= 85
            ? 'Excellent form!'
            : clampedAccuracy >= 70
            ? 'Good form'
            : clampedAccuracy >= 50
            ? 'Fair form'
            : 'Needs improvement'}
        </Text>
      </View>
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
    alignItems: 'center',
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
  circleContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  accuracyValue: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  accuracyLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 10,
    width: '100%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
});
