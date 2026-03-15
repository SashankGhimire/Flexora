import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type NextButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export const NextButton: React.FC<NextButtonProps> = ({ title, onPress, disabled, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabledButton, style]}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.lg,
    minHeight: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: Colors.primaryA34,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: Colors.textOnPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
});



