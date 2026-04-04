import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, isDarkMode } from '../../theme/colors';

interface LogoProps {
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 80, animated = true, style }) => {
  const pulse = useSharedValue(0);
  const darkMode = isDarkMode;

  useEffect(() => {
    if (!animated) {
      pulse.value = 0;
      return;
    }

    pulse.value = withDelay(
      120,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0, { duration: 900 })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [animated, pulse]);

  const frameStyle = useMemo(() => ({ width: size, height: size }), [size]);
  const dumbbellWidth = useMemo(() => Math.round(size * 0.64), [size]);
  const dumbbellHeight = useMemo(() => Math.max(14, Math.round(size * 0.2)), [size]);
  const sideGap = useMemo(() => Math.max(2, Math.round(size * 0.014)), [size]);
  const sparkSize = useMemo(() => Math.max(7, Math.round(size * 0.12)), [size]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: pulse.value * -2.5 },
        { scale: 1 + pulse.value * 0.04 },
      ] as any,
    };
  });

  const sparkStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + pulse.value * 0.35,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));

  const styles = useMemo(() => createStyles(darkMode), [darkMode]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.logoWrap, frameStyle, animatedStyle]}>
        <View style={styles.outerGlow} />
        <View style={styles.badgeLayer} />
        <View style={styles.badgeCore} />

        <View style={[styles.dumbbell, { width: dumbbellWidth, height: dumbbellHeight }]}>
          <View
            style={[
              styles.plateOuter,
              { width: dumbbellHeight, borderRadius: dumbbellHeight / 4 },
            ]}
          />
          <View
            style={[
              styles.plateInner,
              {
                width: Math.max(8, Math.round(dumbbellHeight * 0.5)),
                marginLeft: sideGap,
                borderRadius: dumbbellHeight / 5,
              },
            ]}
          />

          <View style={[styles.handle, { marginHorizontal: sideGap }]} />

          <View
            style={[
              styles.plateInner,
              {
                width: Math.max(8, Math.round(dumbbellHeight * 0.5)),
                marginRight: sideGap,
                borderRadius: dumbbellHeight / 5,
              },
            ]}
          />
          <View
            style={[
              styles.plateOuter,
              { width: dumbbellHeight, borderRadius: dumbbellHeight / 4 },
            ]}
          />
        </View>

        <Animated.View style={[styles.spark, sparkStyle, { width: sparkSize, height: sparkSize }]} />
      </Animated.View>
    </View>
  );
};

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: dark ? '#000000' : Colors.primaryDark,
      shadowOpacity: dark ? 0.28 : 0.16,
      shadowRadius: dark ? 12 : 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: dark ? 8 : 6,
    },
    outerGlow: {
      position: 'absolute',
      width: '90%',
      height: '90%',
      borderRadius: 24,
      backgroundColor: dark ? Colors.primaryA3 : Colors.primaryA12,
    },
    badgeLayer: {
      position: 'absolute',
      width: '74%',
      height: '74%',
      borderRadius: 22,
      backgroundColor: Colors.primary,
      opacity: dark ? 0.3 : 0.18,
    },
    badgeCore: {
      position: 'absolute',
      width: '66%',
      height: '66%',
      borderRadius: 18,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: dark ? Colors.primaryA52 : Colors.primaryA34,
    },
    dumbbell: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    handle: {
      flex: 1,
      height: '34%',
      minWidth: 16,
      borderRadius: 999,
      backgroundColor: dark ? Colors.textPrimary : Colors.primaryDark,
    },
    plateOuter: {
      height: '100%',
      backgroundColor: Colors.primary,
    },
    plateInner: {
      height: '76%',
      backgroundColor: Colors.accent,
    },
    spark: {
      position: 'absolute',
      top: '22%',
      right: '18%',
      borderRadius: 999,
      backgroundColor: dark ? Colors.info : Colors.accent,
    },
  });




