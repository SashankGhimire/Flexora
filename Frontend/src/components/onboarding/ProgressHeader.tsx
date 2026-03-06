import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    color: '#9AA6B6',
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#1A212B',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: '#57D5A8',
  },
});
