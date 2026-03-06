import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card, SectionHeader, SimpleIcon, StatCard } from '../components/ui';
import { Colors } from '../theme/colors';
import { FontWeight, Spacing, Typography } from '../theme/tokens';

const WEEK_DATA = [58, 64, 49, 72, 67, 70, 54];

export const ProgressScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(420)}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track consistency, reps, and posture performance</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(80)} style={styles.statsRow}>
          <StatCard
            label="Sessions"
            value="24"
            icon={<SimpleIcon name="activity" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Avg Accuracy"
            value="91%"
            icon={<SimpleIcon name="target" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Streak"
            value="12d"
            icon={<SimpleIcon name="award" size={16} color={Colors.primary} />}
          />
        </Animated.View>

        <SectionHeader
          title="Weekly Intensity"
          subtitle="A quick view of your effort trend"
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(150)}>
          <Card style={styles.chartCard}>
          <View style={styles.chartRow}>
            {WEEK_DATA.map((value, index) => (
              <View key={`bar-${index}`} style={styles.barWrap}>
                <Text style={styles.barValue}>{value}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${value}%` }]} />
                </View>
                <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
              </View>
            ))}
          </View>
          </Card>
        </Animated.View>

        <SectionHeader
          title="This Week"
          subtitle="Highlights from your recent workouts"
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(220)}>
          <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightIcon}>
              <SimpleIcon name="zap" size={16} color={Colors.primary} />
            </View>
            <View style={styles.highlightTextWrap}>
              <Text style={styles.highlightTitle}>Best Accuracy Day</Text>
              <Text style={styles.highlightSubtitle}>Thursday • 96% posture score</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.highlightRow}>
            <View style={styles.highlightIcon}>
              <SimpleIcon name="clock" size={16} color={Colors.primary} />
            </View>
            <View style={styles.highlightTextWrap}>
              <Text style={styles.highlightTitle}>Total Training Time</Text>
              <Text style={styles.highlightSubtitle}>2h 45m completed this week</Text>
            </View>
          </View>
          </Card>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x2,
    paddingBottom: 36,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.display,
    fontWeight: FontWeight.heavy,
    lineHeight: Typography.displayLine,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  sectionSpace: {
    marginTop: Spacing.xl,
  },
  chartCard: {
    backgroundColor: Colors.card,
  },
  chartRow: {
    flexDirection: 'row',
    height: 190,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginBottom: 6,
  },
  barTrack: {
    width: 20,
    height: 130,
    borderRadius: 999,
    backgroundColor: Colors.border,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  barLabel: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  highlightCard: {
    backgroundColor: Colors.card,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.24)',
    marginRight: 10,
  },
  highlightTextWrap: {
    flex: 1,
  },
  highlightTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  highlightSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  bottomSpace: {
    height: 70,
  },
});
