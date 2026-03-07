import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Video from 'react-native-video';
import { Colors } from '../../theme/colors';
import { FontWeight, Typography } from '../../theme/tokens';
import { resolveAnimationAsset } from '../../assets/animations/registry';

type WorkoutAnimationProps = {
  animation: string;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
};

const WorkoutAnimationComponent: React.FC<WorkoutAnimationProps> = ({
  animation,
  size = 120,
  loop,
  autoPlay,
  speed = 1,
}) => {
  const [failed, setFailed] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const pulse = useSharedValue(0);
  const asset = useMemo(() => resolveAnimationAsset(animation), [animation]);
  const source = asset?.source;

  useEffect(() => {
    setFailed(false);
  }, [animation]);

  useEffect(() => {
    if (asset?.kind !== 'lottie' || !source || failed || autoPlay === false) {
      return;
    }

    const timer = setTimeout(() => {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    }, 60);

    return () => clearTimeout(timer);
  }, [animation, asset?.kind, autoPlay, failed, source]);

  useEffect(() => {
    if (asset?.kind && source && !failed) {
      return;
    }

    pulse.value = withRepeat(
      withTiming(1, { duration: 650 / speed, easing: Easing.inOut(Easing.quad) }),
      loop === false ? 1 : -1,
      true
    );
  }, [asset?.kind, failed, loop, pulse, source, speed]);

  const fallbackAnimated = useAnimatedStyle(() =>
    ({
      transform: [{ scale: 0.88 + pulse.value * 0.22 }, { rotate: `${-12 + pulse.value * 24}deg` }],
      opacity: 0.72 + pulse.value * 0.28,
    } as any)
  );

  if (asset?.kind === 'gif' && source && !failed) {
    return (
      <View style={[styles.frame, styles.mediaFrame, { width: size, height: size }]}>
        <Image
          key={`${animation}-gif`}
          source={source}
          resizeMode="contain"
          style={{ width: size * 0.9, height: size * 0.9 }}
          onError={() => setFailed(true)}
          fadeDuration={0}
        />
      </View>
    );
  }

  if (asset?.kind === 'mp4' && source && !failed) {
    return (
      <View style={[styles.frame, styles.mediaFrame, { width: size, height: size }]}>
        <Video
          key={`${animation}-mp4`}
          source={source}
          paused={autoPlay === false || failed}
          repeat={loop !== false}
          muted
          controls={false}
          playInBackground={false}
          playWhenInactive={false}
          resizeMode="contain"
          style={{ width: size * 0.9, height: size * 0.9 }}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  if (asset?.kind === 'lottie' && source && !failed) {
    return (
      <View style={[styles.frame, styles.lottieFrame, { width: size, height: size }]}>
        <LottieView
          ref={lottieRef}
          key={animation}
          source={source}
          autoPlay={autoPlay !== false}
          loop={loop !== false}
          speed={speed}
          resizeMode="contain"
          style={{ width: size * 0.88, height: size * 0.88 }}
          onAnimationFailure={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Animated.View style={[styles.fallbackOrb, fallbackAnimated]} />
      <Text style={styles.caption}>Preview motion active</Text>
      <Text style={styles.subCaption}>{animation.replace('.json', '').replace(/_/g, ' ')}</Text>
    </View>
  );
};

export const WorkoutAnimation = memo(
  WorkoutAnimationComponent,
  (prev, next) => (
    prev.animation === next.animation &&
    prev.size === next.size &&
    prev.loop === next.loop &&
    prev.autoPlay === next.autoPlay &&
    prev.speed === next.speed
  )
);

const styles = StyleSheet.create({
  frame: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.26)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  lottieFrame: {
    paddingHorizontal: 0,
  },
  mediaFrame: {
    paddingHorizontal: 0,
  },
  fallbackOrb: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.65)',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  caption: {
    marginTop: 10,
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  subCaption: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
});
