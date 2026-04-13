import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  icon?: React.ReactNode;
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  icon,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: { primary: string; textOnPrimary: string }) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      marginRight: Spacing.sm,
    },
    text: {
      color: colors.textOnPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.55,
    },
  });


