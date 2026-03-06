import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { WorkoutExercise } from '../../data/workoutData';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';
import { WorkoutAnimation } from './WorkoutAnimation';

type ExerciseCardProps = {
  index: number;
  exercise: WorkoutExercise;
  onPress?: () => void;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ index, exercise, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.index}>{index + 1}</Text>
          <View style={styles.animWrap}>
            <WorkoutAnimation animation={exercise.animation} size={64} speed={exercise.type === 'timer' ? 1 : 0.9} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.meta}>{exercise.type === 'timer' ? `${exercise.duration}s` : `x${exercise.reps}`}</Text>
            <Text style={styles.tapHint}>Tap for details</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  index: {
    width: 22,
    color: Colors.primary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.heavy,
  },
  animWrap: {
    width: 66,
    height: 66,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  meta: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  tapHint: {
    marginTop: 4,
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
});
