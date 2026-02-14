import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
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
import { COLORS } from '../../constants/theme';

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
    };
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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
        {label}
      </Text>
      <Animated.View
        style={[
          animatedBorderStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.input,
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 2,
          },
        ]}
      >
        {icon && (
          <SimpleIcon
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.placeholder}
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            flex: 1,
            color: 'white',
            paddingVertical: 16,
            fontSize: 16,
            outlineStyle: 'none',
          } as any}
          placeholderTextColor={COLORS.placeholder}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            activeOpacity={0.7}
            style={{ 
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isFocused ? `${COLORS.primary}20` : `${COLORS.placeholder}15`,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 8,
            }}
          >
            <Animated.View style={animatedEyeIconStyle}>
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
        <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
