import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../../utils/constants';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

interface CustomInputProps extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
  isPassword?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  icon,
  error,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnimation = useSharedValue(0);
  const passwordToggleAnimation = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        focusAnimation.value === 1 ? COLORS.primary : COLORS.border,
        { duration: 200 }
      ),
    };
  });

  const animatedEyeIconStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      passwordToggleAnimation.value,
      [0, 1],
      [0, 360],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      passwordToggleAnimation.value,
      [0, 0.5, 1],
      [1, 1.2, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale },
      ],
    } as any;
  });

  const handleFocus = () => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0);
  };

  const handlePasswordToggle = () => {
    passwordToggleAnimation.value = withSpring(1, { damping: 6, mass: 0.8 });
    passwordToggleAnimation.value = withTiming(0, { duration: 300 }, () => {
      passwordToggleAnimation.value = 0;
    });
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
      </Text>
      <Animated.View
        style={[
          animatedBorderStyle,
          styles.inputContainer,
        ]}
      >
        {icon && (
          <SimpleIcon
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.placeholder}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.textInput}
          placeholderTextColor={COLORS.placeholder}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            activeOpacity={0.7}
            style={[
              styles.passwordToggle,
              {
                backgroundColor: isFocused
                  ? `${COLORS.primary}20`
                  : `${COLORS.placeholder}15`,
              },
            ]}
          >
            <Animated.View style={animatedEyeIconStyle as any}>
              <SimpleIcon
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color={isFocused ? COLORS.primary : COLORS.placeholder}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 16,
    fontSize: Typography.subtitle,
  },
  passwordToggle: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: Typography.caption,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
