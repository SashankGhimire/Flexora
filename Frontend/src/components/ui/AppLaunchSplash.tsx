import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Logo } from './Logo';
import { useTheme } from '../../context/ThemeContext';

export const AppLaunchSplash: React.FC = () => {
  const { isDarkMode } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introTranslateY = useRef(new Animated.Value(18)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const palette = useMemo(() => {
    if (isDarkMode) {
      return {
        background: '#121414',
        cardBg: 'transparent',
        badgeText: '#9BE3BE',
        loadingTrack: 'rgba(63, 175, 115, 0.18)',
        loadingShimmer: 'rgba(56, 189, 248, 0.85)',
        loadingLabel: '#C8D2D8',
        dot: '#67C8F2',
        shadowColor: '#000000',
      };
    }

    return {
      background: '#F6FBF9',
      cardBg: 'transparent',
      badgeText: '#2E7D5B',
      loadingTrack: 'rgba(63, 175, 115, 0.12)',
      loadingShimmer: 'rgba(56, 189, 248, 0.72)',
      loadingLabel: '#6B7280',
      dot: '#38BDF8',
      shadowColor: '#0f172a',
    };
  }, [isDarkMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const logoFloatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const dotWave = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.25,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

    const dot1Loop = dotWave(dot1, 0);
    const dot2Loop = dotWave(dot2, 120);
    const dot3Loop = dotWave(dot3, 240);

    shimmerLoop.start();
    logoFloatLoop.start();
    dot1Loop.start();
    dot2Loop.start();
    dot3Loop.start();

    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(introTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      shimmerLoop.stop();
      logoFloatLoop.stop();
      dot1Loop.stop();
      dot2Loop.stop();
      dot3Loop.stop();
    };
  }, [dot1, dot2, dot3, introOpacity, introTranslateY, logoFloat, shimmer]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });

  const logoFloatY = logoFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.splashCard,
          {
            opacity: introOpacity,
            transform: [{ translateY: introTranslateY }],
          },
        ]}
      >
        <View style={styles.centerWrap}>
          <Animated.View style={{ transform: [{ translateY: logoFloatY }] }}>
            <Logo size={88} animated />
          </Animated.View>
          <Text style={styles.flexoraText}>Flexora</Text>
          <Text style={styles.badgeText}>AI FITNESS TRAINER</Text>

          <View style={styles.loadingBarTrack}>
            <Animated.View style={[styles.loadingBarShimmer, { transform: [{ translateX: shimmerX }] }]} />
          </View>

          <View style={styles.loadingRow}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
            <Text style={styles.loadingLabel}>Initializing motion intelligence</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = (palette: {
  background: string;
  cardBg: string;
  badgeText: string;
  loadingTrack: string;
  loadingShimmer: string;
  loadingLabel: string;
  dot: string;
  shadowColor: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    splashCard: {
      width: '88%',
      maxWidth: 360,
      borderRadius: 0,
      paddingVertical: 48,
      paddingHorizontal: 20,
      backgroundColor: palette.cardBg,
      shadowColor: palette.shadowColor,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    centerWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    flexoraText: {
      marginTop: 12,
      fontSize: 28,
      letterSpacing: 0.3,
      color: palette.badgeText,
      fontWeight: '700',
      marginBottom: 6,
    },
    badgeText: {
      marginTop: 0,
      fontSize: 12,
      letterSpacing: 1.3,
      color: palette.badgeText,
      fontWeight: '600',
      marginBottom: 24,
      opacity: 0.8,
    },
    loadingBarTrack: {
      marginTop: 6,
      width: '100%',
      height: 6,
      borderRadius: 999,
      backgroundColor: palette.loadingTrack,
      overflow: 'hidden',
    },
    loadingBarShimmer: {
      position: 'absolute',
      width: 120,
      height: 6,
      borderRadius: 999,
      backgroundColor: palette.loadingShimmer,
    },
    loadingRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingLabel: {
      marginLeft: 10,
      fontSize: 12,
      color: palette.loadingLabel,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: palette.dot,
    },
  });

export default AppLaunchSplash;
