import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, Typography } from '../../theme/tokens';
import { NextButton } from './NextButton';
import { ProgressHeader } from './ProgressHeader';
import { SimpleIcon } from '../ui';

type OnboardingLayoutProps = {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
  children?: React.ReactNode;
};

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  title,
  subtitle,
  step,
  totalSteps,
  nextLabel,
  onNext,
  nextDisabled,
  children,
}) => {
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const androidTopInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          { paddingTop: (compact ? Spacing.sm : Spacing.md) + androidTopInset },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressHeader step={step} total={totalSteps} />
        <View style={[styles.headerCard, compact && styles.headerCardCompact]}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              <SimpleIcon name="target" size={14} color={Colors.primary} />
            </View>
            <Text style={styles.badgeText}>Personalized setup</Text>
          </View>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
        </View>
        <View style={[styles.body, compact && styles.bodyCompact]}>{children}</View>
        <NextButton title={nextLabel} onPress={onNext} disabled={nextDisabled} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C1015',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -120,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(110, 231, 183, 0.08)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.x2,
  },
  contentCompact: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerCard: {
    marginTop: Spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(23, 29, 35, 0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerCardCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    marginRight: Spacing.xs,
  },
  badgeText: {
    color: '#98A4B3',
    fontSize: Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: '#B5BEC9',
    fontSize: Typography.body,
    lineHeight: 20,
  },
  subtitleCompact: {
    fontSize: Typography.caption,
    lineHeight: 18,
  },
  body: {
    marginTop: Spacing.xl,
  },
  bodyCompact: {
    marginTop: Spacing.lg,
  },
});
