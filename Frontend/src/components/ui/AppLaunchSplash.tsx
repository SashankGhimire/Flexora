import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Logo } from './Logo';
import { Colors, isDarkMode } from '../../theme/colors';

export const AppLaunchSplash: React.FC = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introTranslateY = useRef(new Animated.Value(18)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const blobDrift = useRef(new Animated.Value(0)).current;
  const palette = useMemo(() => {
    if (isDarkMode) {
      return {
        background: '#121414',
        cardBg: 'rgba(27, 31, 31, 0.92)',
        cardBorder: 'rgba(63, 175, 115, 0.28)',
        badgeText: '#9BE3BE',
        loadingTrack: 'rgba(63, 175, 115, 0.26)',
        loadingShimmer: 'rgba(56, 189, 248, 0.78)',
        loadingLabel: '#C8D2D8',
        dot: '#67C8F2',
        blobTop: 'rgba(63, 175, 115, 0.2)',
        blobBottom: 'rgba(56, 189, 248, 0.16)',
        shadowColor: '#000000',
      };
    }

    return {
      background: '#F6FBF9',
      cardBg: 'rgba(255, 255, 255, 0.88)',
      cardBorder: 'rgba(63, 175, 115, 0.14)',
      badgeText: '#2E7D5B',
      loadingTrack: 'rgba(63, 175, 115, 0.14)',
      loadingShimmer: 'rgba(56, 189, 248, 0.65)',
      loadingLabel: '#6B7280',
      dot: '#38BDF8',
      blobTop: 'rgba(63, 175, 115, 0.1)',
      blobBottom: 'rgba(56, 189, 248, 0.1)',
      shadowColor: '#0f172a',
    };
  }, []);
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

    const blobDriftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobDrift, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blobDrift, {
          toValue: 0,
          duration: 2600,
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
    blobDriftLoop.start();
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
      blobDriftLoop.stop();
      dot1Loop.stop();
      dot2Loop.stop();
      dot3Loop.stop();
    };
  }, [blobDrift, dot1, dot2, dot3, introOpacity, introTranslateY, logoFloat, shimmer]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });

  const logoFloatY = logoFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const blobShiftX = blobDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const blobShiftXReverse = blobDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.backgroundBlobTop, { transform: [{ translateX: blobShiftX }] }]} />
      <Animated.View style={[styles.backgroundBlobBottom, { transform: [{ translateX: blobShiftXReverse }] }]} />

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
            <Logo size={62} />
          </Animated.View>
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
  cardBorder: string;
  badgeText: string;
  loadingTrack: string;
  loadingShimmer: string;
  loadingLabel: string;
  dot: string;
  blobTop: string;
  blobBottom: string;
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
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 20,
      backgroundColor: palette.cardBg,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      shadowColor: palette.shadowColor,
      shadowOpacity: 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    centerWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    badgeText: {
      marginTop: -8,
      fontSize: 11,
      letterSpacing: 1.2,
      color: palette.badgeText,
      fontWeight: '700',
      marginBottom: 14,
    },
    backgroundBlobTop: {
      position: 'absolute',
      top: -70,
      right: -80,
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: palette.blobTop,
    },
    backgroundBlobBottom: {
      position: 'absolute',
      bottom: -90,
      left: -70,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: palette.blobBottom,
    },
    loadingBarTrack: {
      marginTop: 8,
      width: '84%',
      height: 7,
      borderRadius: 999,
      backgroundColor: palette.loadingTrack,
      overflow: 'hidden',
    },
    loadingBarShimmer: {
      position: 'absolute',
      width: 110,
      height: 7,
      borderRadius: 999,
      backgroundColor: palette.loadingShimmer,
    },
    loadingRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingLabel: {
      marginLeft: 8,
      fontSize: 11,
      color: palette.loadingLabel,
      fontWeight: '500',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.dot,
    },
  });

export default AppLaunchSplash;
