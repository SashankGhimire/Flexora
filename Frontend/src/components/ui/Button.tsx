import React from 'react';
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
import { Colors } from '../../theme/colors';
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
        <ActivityIndicator color={variant === 'ghost' ? Colors.primary : Colors.textOnPrimary} />
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  text: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  primaryText: {
    color: Colors.textOnPrimary,
  },
  secondaryText: {
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});


