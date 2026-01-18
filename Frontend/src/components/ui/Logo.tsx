import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 80 }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withSpring(1),
              withSpring(1.05),
              withSpring(1)
            ),
            -1,
            false
          ),
        },
      ],
    };
  });

  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.5, color: 'white', fontWeight: 'bold' }}>
          ⚡
        </Text>
      </Animated.View>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 16 }}>
        Flexora
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
        Train Smart. Move Better.
      </Text>
    </View>
  );
};
