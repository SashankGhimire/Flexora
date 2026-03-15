import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type ProgressHeaderProps = {
  step: number;
  total: number;
};

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({ step, total }) => {
  const progress = Math.max(0, Math.min(100, (step / total) * 100));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{`Step ${step} of ${total}`}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLightA22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
});



