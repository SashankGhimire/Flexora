import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding';
import { useAuth } from '../../context/AuthContext';
import {
  createOnboardingProfile,
  saveLocalOnboardingProfile,
  updateOnboardingProfile,
} from '../../services/onboardingService';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BMI'>;

const BMI_MIN = 15;
const BMI_MAX = 40;
const BMI_TICKS = [15, 18.5, 25, 30, 40] as const;
const BMI_SEGMENTS = [3.5, 6.5, 5, 10];

const getBmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const getBmiCategoryColor = (category: string): string => {
  switch (category) {
    case 'Underweight':
      return '#5B88E8';
    case 'Normal':
      return '#66F1D4';
    case 'Overweight':
      return '#E8A24E';
    default:
      return '#E65061';
  }
};

const getBmiPercent = (value: number): number => ((value - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100;

export const BMIScreen: React.FC<Props> = ({ route }) => {
  const { user, markOnboardingCompleted } = useAuth();
  const [saving, setSaving] = useState(false);
  const answers = route.params.answers;

  const bmi = useMemo(() => {
    const weight = answers.weight ?? 65;
    const height = answers.heightCm ?? 170;
    const result = weight / ((height / 100) * (height / 100));
    return Number(result.toFixed(1));
  }, [answers.heightCm, answers.weight]);

  const category = getBmiCategory(bmi);
  const categoryColor = getBmiCategoryColor(category);
  const bmiDisplayValue = bmi.toFixed(1);
  const [bmiWhole, bmiDecimal = ''] = bmiDisplayValue.split('.');
  const bmiPointer = Math.max(0, Math.min(100, getBmiPercent(bmi)));

  const handleComplete = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Missing user session. Please log in again.');
      return;
    }

    setSaving(true);
    const payload = {
      goal: answers.goal || 'improve_fitness',
      gender: answers.gender || 'prefer_not',
      age: answers.age || 22,
      height: answers.heightCm || 170,
      weight: answers.weight || 65,
      activityLevel: answers.activityLevel || 'beginner',
      trainingPreference: answers.trainingPreference || 'both',
      workoutDays: answers.workoutDays || 4,
      bmi,
    };

    try {
      try {
        await createOnboardingProfile(payload);
      } catch {
        await updateOnboardingProfile(payload);
      }

      await saveLocalOnboardingProfile(user.id, payload);

      await AsyncStorage.setItem(`@flexora:onboarding_completed:${user.id}`, 'true');
      await markOnboardingCompleted();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={10}
      totalSteps={10}
      title="Your BMI Result"
      subtitle="We use this to personalize workout recommendations and progress tracking."
      nextLabel={saving ? 'Saving...' : 'Start My Fitness Plan'}
      onNext={handleComplete}
      nextDisabled={saving}
    >
      <View style={styles.animWrap}>
        <LottieView
          source={require('../../assets/animations/height_weight.json')}
          autoPlay
          loop
          style={styles.anim}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.bmiValueRow}>
          <Text style={styles.bmiValue}>{bmiWhole}</Text>
          <Text style={styles.bmiValueDecimal}>{`.${bmiDecimal}`}</Text>
          <Text style={styles.bmiUnit}>BMI</Text>
        </View>
        <Text style={[styles.category, { color: categoryColor }]}>{category}</Text>

        <View style={styles.meterWrap}>
          <View style={styles.scaleTrack}>
            {BMI_SEGMENTS.map((segment, index) => (
              <View
                key={`bmi-segment-${index}`}
                style={[
                  styles.segment,
                  index === 0 && styles.segmentUnder,
                  index === 1 && styles.segmentNormal,
                  index === 2 && styles.segmentOver,
                  index === 3 && styles.segmentObese,
                  index === 0 && styles.segmentLeft,
                  index === BMI_SEGMENTS.length - 1 && styles.segmentRight,
                  { flex: segment },
                ]}
              />
            ))}

            <View
              style={[
                styles.pointer,
                {
                  left: `${bmiPointer}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.ticks}>
          {BMI_TICKS.map((tick) => (
            <Text key={`bmi-tick-${tick}`} style={styles.tick}>
              {tick}
            </Text>
          ))}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  animWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  anim: {
    width: 180,
    height: 180,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
  },
  bmiValue: {
    color: Colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bmiValueDecimal: {
    color: '#C7D0DA',
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 5,
    fontVariant: ['tabular-nums'],
  },
  bmiUnit: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginLeft: 6,
    marginBottom: 9,
    letterSpacing: 0.7,
  },
  category: {
    color: Colors.secondary,
    fontSize: Typography.subtitle,
    marginTop: 4,
    fontWeight: '600',
  },
  meterWrap: {
    marginTop: Spacing.md,
  },
  scaleTrack: {
    position: 'relative',
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  segment: {
    height: 12,
  },
  segmentUnder: {
    backgroundColor: '#5B88E8',
  },
  segmentNormal: {
    backgroundColor: '#66F1D4',
  },
  segmentOver: {
    backgroundColor: '#E8A24E',
  },
  segmentObese: {
    backgroundColor: '#E65061',
  },
  segmentLeft: {
    borderTopLeftRadius: Radius.pill,
    borderBottomLeftRadius: Radius.pill,
  },
  segmentRight: {
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
  },
  pointer: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -2 }],
  },
  ticks: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontVariant: ['tabular-nums'],
  },
});
