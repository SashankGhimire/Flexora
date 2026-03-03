import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';

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
    <View style={styles.container}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            backgroundColor: COLORS.primary,
          },
          styles.iconWrap,
        ]}
      >
        <Text style={[styles.iconText, { fontSize: size * 0.5 }]}>
          ⚡
        </Text>
      </Animated.View>
      <Text style={styles.title}>
        Flexora
      </Text>
      <Text style={styles.subtitle}>
        Train Smart. Move Better.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
