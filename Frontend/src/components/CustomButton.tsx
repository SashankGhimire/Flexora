import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../utils/constants';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  onPress,
  disabled,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary };
      default:
        return {
          backgroundColor: COLORS.primary,
          shadowColor: COLORS.primary,
          shadowOpacity: 0.24,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return COLORS.text;
      case 'outline':
        return COLORS.primary;
      default:
        return COLORS.background;
    }
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.baseButton,
        disabled ? styles.disabledButton : styles.enabledButton,
        getVariantStyles(),
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.background} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.buttonText, { color: getTextColor() }]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: Spacing.x2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
  enabledButton: {
    opacity: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
