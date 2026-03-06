import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, PrimaryButton, SimpleIcon } from '../ui';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type WorkoutCompleteCardProps = {
  completed: number;
  totalTime: string;
  onDone: () => void;
};

export const WorkoutCompleteCard: React.FC<WorkoutCompleteCardProps> = ({
  completed,
  totalTime,
  onDone,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>
        <SimpleIcon name="check-circle" size={28} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Workout Complete</Text>
      <Text style={styles.meta}>Exercises completed: {completed}</Text>
      <Text style={styles.meta}>Total time: {totalTime}</Text>
      <PrimaryButton title="Done" onPress={onDone} style={styles.button} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  meta: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  button: {
    marginTop: Spacing.xl,
    width: '100%',
  },
});
