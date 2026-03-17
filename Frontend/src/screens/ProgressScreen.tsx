import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card, SectionHeader, SimpleIcon, StatCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  getLocalOnboardingProfile,
  getOnboardingProfile,
  saveLocalOnboardingProfile,
  updateOnboardingProfile,
} from '../services/onboardingService';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';

const DEFAULT_WEIGHT_DATA = [75.2, 75.1, 75, 74.9, 74.8, 74.8, 74.9];
const BMI_MIN = 15;
const BMI_MAX = 40;
const BMI_TICKS = [15, 18.5, 25, 30, 40] as const;
const DAYS = ['01', '02', '03', '04', '05', '06', '07'];
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const ACTIVE_STREAK_DAYS = new Set([1, 2, 4, 5, 6, 9, 10, 11, 14, 15, 16, 18, 20, 21, 23, 24, 25, 27]);
const BMI_SEGMENTS = [3.5, 6.5, 5, 10];

const getBmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy weight';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
};

const getBmiPercent = (value: number): number =>
  ((value - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100;

const getBmiCategoryTheme = (category: string) => {
  switch (category) {
    case 'Underweight':
      return {
        pillBorder: Colors.primaryLightA22,
        pillBg: Colors.primaryLightA2,
        dot: Colors.info,
      };
    case 'Healthy weight':
      return {
        pillBorder: Colors.primaryA35,
        pillBg: Colors.primaryLightA16,
        dot: Colors.success,
      };
    case 'Overweight':
      return {
        pillBorder: Colors.warningA45,
        pillBg: Colors.warningA14,
        dot: Colors.warning,
      };
    default:
      return {
        pillBorder: Colors.errorA4,
        pillBg: Colors.errorA14,
        dot: Colors.error,
      };
  }
};

export const ProgressScreen: React.FC = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const calendarCellWidth = compact ? 31 : 36;

  const [weightKg, setWeightKg] = useState('75');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');
  const [weightData, setWeightData] = useState(DEFAULT_WEIGHT_DATA);
  const [savingProfile, setSavingProfile] = useState(false);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const hydrateProfile = async () => {
      const localProfile = await getLocalOnboardingProfile(user.id);
      let profile = localProfile;

      if (!profile) {
        try {
          const remote = await getOnboardingProfile(user.id);
          profile = remote?.profile || remote?.data || null;
        } catch {
          profile = null;
        }
      }

      if (!profile) {
        return;
      }

      if (typeof profile.weight === 'number' && profile.weight > 0) {
        const savedWeight = Number(profile.weight.toFixed(1));
        setWeightKg(String(savedWeight));
        setWeightData((prev) => [...prev.slice(0, prev.length - 1), savedWeight]);
      }

      if (typeof profile.height === 'number' && profile.height > 0) {
        const totalInches = profile.height / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setHeightFt(String(ft));
        setHeightIn(String(inch));
      }
    };

    hydrateProfile();
  }, [user?.id]);

  const clampWeight = (next: string): string => {
    const numeric = Number(next.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numeric)) {
      return '';
    }
    return String(Math.max(30, Math.min(220, Number(numeric.toFixed(1)))));
  };

  const persistProfile = async (closeModal = false) => {
    const kg = Number(weightKg);
    const ft = Number(heightFt);
    const inch = Number(heightIn);
    const totalInches = ft * 12 + inch;

    if (!kg || !totalInches || !user?.id) {
      if (closeModal) {
        setBmiModalVisible(false);
      }
      return;
    }

    const heightCm = Number((totalInches * 2.54).toFixed(0));
    const bmi = Number((kg / Math.pow(heightCm / 100, 2)).toFixed(1));
    const payload = {
      weight: kg,
      height: heightCm,
      bmi,
    };

    setSavingProfile(true);
    try {
      await saveLocalOnboardingProfile(user.id, payload);
      try {
        await updateOnboardingProfile(payload);
      } catch {
        // Keep local persistence even when remote update fails.
      }
      setWeightData((prev) => [...prev.slice(0, prev.length - 1), kg]);
    } finally {
      setSavingProfile(false);
      if (closeModal) {
        setBmiModalVisible(false);
      }
    }
  };

  const parsedWeight = Number(weightKg);
  const currentWeight = Number.isFinite(parsedWeight) && parsedWeight > 0
    ? parsedWeight
    : weightData[weightData.length - 1];
  const chartData = [...weightData.slice(0, weightData.length - 1), currentWeight];
  const heaviestWeight = Math.max(...chartData);
  const lightestWeight = Math.min(...chartData);

  const bmiValue = useMemo(() => {
    const kg = Number(weightKg);
    const ft = Number(heightFt);
    const inch = Number(heightIn);
    const totalInches = ft * 12 + inch;

    if (!kg || !totalInches) {
      return 0;
    }

    const meters = totalInches * 0.0254;
    return kg / (meters * meters);
  }, [heightFt, heightIn, weightKg]);

  const bmiCategory = getBmiCategory(bmiValue);
  const bmiTheme = getBmiCategoryTheme(bmiCategory);
  const bmiDisplayValue = bmiValue ? bmiValue.toFixed(1) : '--';
  const [bmiWhole, bmiDecimal = ''] = bmiDisplayValue.split('.');
  const bmiPointer = Math.max(0, Math.min(100, getBmiPercent(bmiValue || BMI_MIN)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(420)}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Report</Text>
          <Text style={styles.subtitle}>Your weekly body metrics and training consistency</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(340).delay(40)} style={styles.reportHeroCard}>
          <View style={styles.reportHeroTopRow}>
            <View>
              <Text style={styles.reportHeroEyebrow}>Weekly Overview</Text>
              <Text style={styles.reportHeroTitle}>Strong progress this week</Text>
            </View>
            <View style={styles.reportHeroIconWrap}>
              <SimpleIcon name="trending-up" size={18} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.reportHeroText}>
            Your body metrics are steady and your streak is holding strong. Keep showing up and the trend will keep working in your favor.
          </Text>
          <View style={styles.reportHeroPills}>
            <View style={styles.reportHeroPill}>
              <Text style={styles.reportHeroPillValue}>7 Days</Text>
              <Text style={styles.reportHeroPillLabel}>Tracked</Text>
            </View>
            <View style={styles.reportHeroPill}>
              <Text style={styles.reportHeroPillValue}>-0.4 kg</Text>
              <Text style={styles.reportHeroPillLabel}>Weekly change</Text>
            </View>
            <View style={styles.reportHeroPill}>
              <Text style={styles.reportHeroPillValue}>On Track</Text>
              <Text style={styles.reportHeroPillLabel}>Goal status</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(80)} style={[styles.statsRow, compact && styles.statsRowCompact]}>
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
          title="Weight"
          subtitle="Weekly trend and current status"
          rightNode={(
            <Pressable onPress={() => setBmiModalVisible(true)} style={styles.editPill}>
              <SimpleIcon name="edit-2" size={14} color={Colors.error} />
              <Text style={styles.editPillText}>Edit</Text>
            </Pressable>
          )}
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(150)}>
          <Card style={styles.chartCard}>
            <View style={[styles.weightTopRow, compact && styles.weightTopRowCompact]}>
              <View>
                <Text style={styles.weightLabel}>Current</Text>
                <Text style={[styles.weightMain, compact && styles.weightMainCompact]}>{currentWeight.toFixed(1)} kg</Text>
              </View>
              <View>
                <Text style={styles.weightSide}>Heaviest  {heaviestWeight.toFixed(1)} kg</Text>
                <Text style={styles.weightSide}>Lightest   {lightestWeight.toFixed(1)} kg</Text>
              </View>
            </View>

            <View style={styles.graphArea}>
              <View style={styles.graphLinesWrap}>
                {[0, 1, 2, 3, 4].map((line) => (
                  <View key={`line-${line}`} style={styles.graphLine} />
                ))}
              </View>

              <View style={styles.graphDotsRow}>
                {chartData.map((value, index) => {
                  const normalized = (value - lightestWeight) / Math.max(0.01, heaviestWeight - lightestWeight + 0.2);
                  const fromBottom = 12 + normalized * 70;
                  return (
                    <View key={`dot-${index}`} style={styles.graphPointWrap}>
                      <View style={[styles.graphDot, { bottom: fromBottom }]} />
                      <Text style={styles.graphDay}>{DAYS[index]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        </Animated.View>

        <SectionHeader
          title="BMI"
          subtitle="Editable body metric profile"
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(220)}>
          <Card style={styles.bmiCard}>
            <View style={[styles.bmiTopRow, compact && styles.bmiTopRowCompact]}>
              <View style={styles.bmiValueRow}>
                <Text style={[styles.bmiValue, compact && styles.bmiValueCompact]}>{bmiWhole}</Text>
                {bmiDecimal ? <Text style={styles.bmiValueDecimal}>{`.${bmiDecimal}`}</Text> : null}
                <Text style={styles.bmiUnit}>BMI</Text>
              </View>
              <View
                style={[
                  styles.bmiCategoryPill,
                  {
                    borderColor: bmiTheme.pillBorder,
                    backgroundColor: bmiTheme.pillBg,
                  },
                ]}
              >
                <View style={[styles.bmiCategoryDot, { backgroundColor: bmiTheme.dot }]} />
                <Text style={styles.bmiCategoryText}>{bmiCategory}</Text>
              </View>
            </View>

            <View style={styles.bmiMeterWrap}>
              <View style={styles.bmiScaleTrack}>
                {BMI_SEGMENTS.map((segment, index) => (
                  <View
                    key={`bmi-segment-${index}`}
                    style={[
                      styles.bmiSegment,
                      index === 0 && styles.bmiSegmentUnder,
                      index === 1 && styles.bmiSegmentNormal,
                      index === 2 && styles.bmiSegmentOver,
                      index === 3 && styles.bmiSegmentObese,
                      index === 0 && styles.bmiSegmentLeft,
                      index === BMI_SEGMENTS.length - 1 && styles.bmiSegmentRight,
                      { flex: segment },
                    ]}
                  />
                ))}

                <View
                  style={[
                    styles.bmiPointer,
                    {
                      left: `${bmiPointer}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.bmiTicksRow}>
              {BMI_TICKS.map((tick) => (
                <Text key={`bmi-tick-${tick}`} style={styles.bmiTick}>
                  {tick}
                </Text>
              ))}
            </View>

            <View style={[styles.bmiBottomRow, compact && styles.bmiBottomRowCompact]}>
              <Text style={styles.heightText}>Height {heightFt} ft {heightIn} in</Text>
              <Pressable onPress={() => setBmiModalVisible(true)} style={styles.editPill}>
                <SimpleIcon name="edit-2" size={14} color={Colors.error} />
                <Text style={styles.editPillText}>Edit</Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <SectionHeader
          title="Streak Calendar"
          subtitle="Track active training days this month"
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(280)}>
          <Card style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonth}>March</Text>
              <Text style={styles.calendarCount}>{ACTIVE_STREAK_DAYS.size} active days</Text>
            </View>
            <View style={styles.calendarGrid}>
              {CALENDAR_DAYS.map((day) => {
                const active = ACTIVE_STREAK_DAYS.has(day);
                return (
                  <View
                    key={`cal-${day}`}
                    style={[
                      styles.calendarCell,
                      { width: calendarCellWidth },
                      active && styles.calendarCellActive,
                    ]}
                  >
                    <Text style={[styles.calendarCellText, active && styles.calendarCellTextActive]}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <SectionHeader
          title="Highlights"
          subtitle="A quick summary of your current report"
          style={styles.sectionSpace}
        />

        <Animated.View entering={FadeInDown.duration(360).delay(320)} style={styles.highlightsWrap}>
          <Card style={styles.highlightCard}>
            <View style={styles.highlightTopRow}>
              <Text style={styles.highlightTitle}>Body Status</Text>
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightBadgeText}>{bmiCategory}</Text>
              </View>
            </View>
            <Text style={styles.highlightDescription}>
              Your current BMI and weight trend suggest you are maintaining a steady rhythm. Keep balancing training with recovery.
            </Text>
          </Card>
          <Card style={styles.highlightCard}>
            <View style={styles.highlightTopRow}>
              <Text style={styles.highlightTitle}>Training Note</Text>
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightBadgeText}>Weekly</Text>
              </View>
            </View>
            <Text style={styles.highlightDescription}>
              Focus on consistency over intensity. Small improvements each week are building a stronger long-term result.
            </Text>
          </Card>
        </Animated.View>

        <Modal
          visible={bmiModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setBmiModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit BMI Inputs</Text>
              <Text style={styles.modalLabel}>Weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={(text) => setWeightKg(clampWeight(text))}
                keyboardType="numeric"
                placeholder="75"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
              />

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Height (ft)</Text>
                  <TextInput
                    value={heightFt}
                    onChangeText={(text) => setHeightFt(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.input}
                  />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Height (in)</Text>
                  <TextInput
                    value={heightIn}
                    onChangeText={(text) => setHeightIn(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="9"
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.modalBtnGhost} onPress={() => setBmiModalVisible(false)}>
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={() => persistProfile(true)}>
                  <Text style={styles.modalBtnText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: 36,
  },
  contentCompact: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.x3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: Typography.subtitle,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  statsRowCompact: {
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionSpace: {
    marginTop: Spacing.xl,
  },
  reportHeroCard: {
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryA34,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  reportHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  reportHeroEyebrow: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reportHeroTitle: {
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  reportHeroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportHeroText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 20,
  },
  reportHeroPills: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reportHeroPill: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  reportHeroPillValue: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  reportHeroPillLabel: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  chartCard: {
    backgroundColor: Colors.card,
  },
  weightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weightTopRowCompact: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  weightLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  weightMain: {
    marginTop: 4,
    color: Colors.textPrimary,
    fontSize: 38,
    fontWeight: FontWeight.heavy,
  },
  weightMainCompact: {
    fontSize: 32,
  },
  weightSide: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    marginBottom: 5,
  },
  graphArea: {
    marginTop: Spacing.md,
    height: 126,
    justifyContent: 'flex-end',
  },
  graphLinesWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 22,
  },
  graphLine: {
    height: 1,
    backgroundColor: Colors.textSecondaryA2,
  },
  graphDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  graphPointWrap: {
    width: 32,
    alignItems: 'center',
    height: 102,
    justifyContent: 'flex-end',
  },
  graphDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primary,
  },
  graphDay: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  bmiCard: {
    backgroundColor: Colors.card,
  },
  bmiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiTopRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bmiValue: {
    color: Colors.textPrimary,
    fontSize: 50,
    fontWeight: FontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bmiValueDecimal: {
    color: Colors.textSecondary,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginLeft: 1,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  bmiUnit: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    marginLeft: 6,
    marginBottom: 10,
    letterSpacing: 0.7,
  },
  bmiValueCompact: {
    fontSize: 44,
  },
  bmiCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  bmiCategoryDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  bmiCategoryText: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  bmiMeterWrap: {
    marginTop: Spacing.md,
  },
  bmiScaleTrack: {
    position: 'relative',
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  bmiSegment: {
    height: 12,
  },
  bmiSegmentUnder: {
    backgroundColor: Colors.info,
  },
  bmiSegmentNormal: {
    backgroundColor: Colors.success,
  },
  bmiSegmentOver: {
    backgroundColor: Colors.warning,
  },
  bmiSegmentObese: {
    backgroundColor: Colors.error,
  },
  bmiSegmentLeft: {
    borderTopLeftRadius: Radius.pill,
    borderBottomLeftRadius: Radius.pill,
  },
  bmiSegmentRight: {
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
  },
  bmiPointer: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    transform: [{ translateX: -2 }],
  },
  bmiTicksRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  bmiTick: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    fontVariant: ['tabular-nums'],
  },
  bmiBottomRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiBottomRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  heightText: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.errorA35,
    backgroundColor: Colors.errorA12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 5,
  },
  editPillText: {
    color: Colors.error,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  calendarCard: {
    backgroundColor: Colors.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  calendarMonth: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  calendarCount: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  calendarCell: {
    width: 36,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarCellActive: {
    backgroundColor: Colors.primaryLightA22,
    borderColor: Colors.primaryA42,
  },
  calendarCellText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  calendarCellTextActive: {
    color: Colors.primaryDark,
  },
  highlightsWrap: {
    gap: Spacing.md,
  },
  highlightCard: {
    backgroundColor: Colors.card,
  },
  highlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  highlightTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  highlightBadge: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  highlightBadgeText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  highlightDescription: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.blackA58,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
    marginBottom: Spacing.md,
  },
  modalLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginBottom: 6,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.subtitle,
    marginBottom: Spacing.sm,
  },
  modalTwoCol: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCol: {
    flex: 1,
  },
  modalActions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalBtnGhost: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  modalBtnGhostText: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  modalBtn: {
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  modalBtnText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  bottomSpace: {
    height: 70,
  },
});



