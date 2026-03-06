import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';
import { PrimaryButton } from './PrimaryButton';
import { SimpleIcon } from './SimpleIcon';
import { Card } from './Card';

type WorkoutCardProps = {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timer: string;
  icon: string;
  buttonLabel?: string;
  onStart: () => void;
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  title,
  description,
  difficulty,
  timer,
  icon,
  buttonLabel = 'Start',
  onStart,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <SimpleIcon name={icon} size={18} color={Colors.primary} />
        </View>
        <View style={styles.timerPill}>
          <SimpleIcon name="clock" size={12} color={Colors.secondary} />
          <Text style={styles.timerText}>{timer}</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.difficultyPill}>
          <Text style={styles.difficultyText}>{difficulty}</Text>
        </View>
      </View>

      <PrimaryButton title={buttonLabel} onPress={onStart} style={styles.button} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: Colors.background,
  },
  timerText: {
    marginLeft: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 18,
  },
  metaRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  difficultyPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.26)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  difficultyText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  button: {
    marginTop: 0,
  },
});
