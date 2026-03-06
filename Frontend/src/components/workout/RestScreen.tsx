import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../ui';
import { Colors } from '../../theme/colors';
import { FontWeight, Spacing, Typography } from '../../theme/tokens';
import { TimerCircle } from './TimerCircle';

type RestScreenProps = {
  nextExerciseName: string;
  timeLeft: number;
  total: number;
  onAddTime: () => void;
  onSkip: () => void;
};

export const RestScreen: React.FC<RestScreenProps> = ({
  nextExerciseName,
  timeLeft,
  total,
  onAddTime,
  onSkip,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.restTitle}>REST</Text>
      <Text style={styles.nextLabel}>Next: {nextExerciseName}</Text>
      <View style={styles.timerWrap}>
        <TimerCircle
          progress={total > 0 ? timeLeft / total : 0}
          label={`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}
        />
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton title="+20s" onPress={onAddTime} style={styles.half} />
        <PrimaryButton title="Skip" onPress={onSkip} style={styles.half} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: FontWeight.heavy,
  },
  nextLabel: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  timerWrap: {
    marginTop: Spacing.xl,
  },
  buttonRow: {
    width: '100%',
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  half: {
    flex: 1,
  },
});
