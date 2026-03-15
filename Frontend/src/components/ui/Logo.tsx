import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 80 }) => {
  const dynamicIconStyle = useMemo(() => ({
    width: size,
    height: size,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  }), [size]);

  const dynamicTextStyle = useMemo(() => ({
    fontSize: size * 0.5,
  }), [size]);

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
          dynamicIconStyle,
          styles.iconWrap,
        ]}
      >
        <Text style={[styles.iconText, dynamicTextStyle]}>
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
    color: Colors.background,
    fontWeight: 'bold',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});




