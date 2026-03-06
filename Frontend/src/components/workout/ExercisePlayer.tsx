import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../ui';
import { WorkoutExercise } from '../../data/workoutData';
import { Colors } from '../../theme/colors';
import { FontWeight, Spacing, Typography } from '../../theme/tokens';
import { animationSpeedByType } from '../../assets/animations/registry';
import { WorkoutAnimation } from './WorkoutAnimation';

type ExercisePlayerProps = {
  exercise: WorkoutExercise;
  displayValue: string;
  onPrev: () => void;
  onPauseResume: () => void;
  onNext: () => void;
  onDoneReps: () => void;
  paused: boolean;
};

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  exercise,
  displayValue,
  onPrev,
  onPauseResume,
  onNext,
  onDoneReps,
  paused,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.animationWrap}>
        <WorkoutAnimation
          animation={exercise.animation}
          size={230}
          speed={animationSpeedByType[exercise.type]}
        />
      </View>

      <Text style={styles.name}>{exercise.name.toUpperCase()}</Text>
      <Text style={styles.counter}>{displayValue}</Text>

      <Text style={styles.instructions}>Instructions: {exercise.instructions}</Text>
      <Text style={styles.focus}>Focus: {exercise.focus.join(', ')}</Text>
      {paused && exercise.type === 'timer' ? <Text style={styles.pausedLabel}>Paused</Text> : null}

      <View style={styles.buttonRow}>
        <PrimaryButton title="Previous" onPress={onPrev} style={styles.button} />
        <PrimaryButton
          title={exercise.type === 'reps' ? 'Done' : paused ? 'Resume' : 'Pause'}
          onPress={exercise.type === 'reps' ? onDoneReps : onPauseResume}
          style={styles.button}
        />
        <PrimaryButton title="Next" onPress={onNext} style={styles.button} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  animationWrap: {
    marginTop: Spacing.sm,
    width: '100%',
    height: 260,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
    textAlign: 'center',
  },
  counter: {
    marginTop: Spacing.sm,
    color: Colors.primary,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
  },
  instructions: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: 'center',
  },
  focus: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  pausedLabel: {
    marginTop: Spacing.xs,
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  buttonRow: {
    marginTop: Spacing.xl,
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
