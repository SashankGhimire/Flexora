import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type StatCardProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const createStyles = (colors: {
  card: string;
  border: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
}) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 104,
      borderRadius: Radius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      justifyContent: 'space-between',
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.sm,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: FontWeight.heavy,
    },
    label: {
      color: colors.textSecondary,
      fontSize: Typography.caption,
      marginTop: Spacing.xs,
    },
  });


