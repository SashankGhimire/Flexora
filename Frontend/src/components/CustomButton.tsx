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
import { Colors } from '../theme/colors';
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
        return { backgroundColor: Colors.card, borderColor: Colors.primary, borderWidth: 1 };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary };
      default:
        return {
          backgroundColor: Colors.primary,
          shadowColor: Colors.primary,
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
        return Colors.primary;
      case 'outline':
        return Colors.primary;
      default:
        return Colors.card;
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
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.card} />
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



