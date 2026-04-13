import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  icon,
  style,
  disabled,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  return (
    <AnimatedTouchable
      activeOpacity={0.86}
      disabled={isDisabled}
      onPressIn={() => {
        pressScale.value = withTiming(0.98, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 110 });
      }}
      style={[
        animatedStyle,
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.textOnPrimary} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              variant === 'primary' && styles.primaryText,
              variant !== 'primary' && styles.secondaryText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

const createStyles = (colors: {
  primary: string;
  card: string;
  border: string;
  textOnPrimary: string;
}) =>
  StyleSheet.create({
    base: {
      minHeight: 46,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      marginRight: Spacing.sm,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.card,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    text: {
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.2,
    },
    primaryText: {
      color: colors.textOnPrimary,
    },
    secondaryText: {
      color: colors.primary,
    },
    disabled: {
      opacity: 0.5,
    },
  });


