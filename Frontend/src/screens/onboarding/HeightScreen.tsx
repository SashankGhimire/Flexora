import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, PickerInput } from '../../components/onboarding';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Height'>;

const cmFromFeet = (ft: number, inch: number) => Math.round((ft * 12 + inch) * 2.54);

export const HeightScreen: React.FC<Props> = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const answers = route.params.answers;
  const unit = answers.heightUnit ?? 'cm';
  const cm = answers.heightCm ?? 170;
  const ft = answers.heightFt ?? 5;
  const inch = answers.heightIn ?? 7;
  const [cmInput, setCmInput] = useState(String(cm));
  const [ftInput, setFtInput] = useState(String(ft));
  const [inInput, setInInput] = useState(String(inch));

  const commitCmInput = () => {
    const parsed = Number(cmInput);
    if (Number.isNaN(parsed) || !cmInput.trim()) {
      return null;
    }

    const safeCm = Math.max(120, Math.min(230, Math.round(parsed)));
    const nextFt = Math.floor(safeCm / 30.48);
    const nextIn = Math.round((safeCm / 2.54) % 12);

    setCmInput(String(safeCm));
    setFtInput(String(nextFt));
    setInInput(String(nextIn));

    const nextAnswers = {
      ...answers,
      heightUnit: 'cm' as const,
      heightCm: safeCm,
      heightFt: nextFt,
      heightIn: nextIn,
    };
    navigation.setParams({ answers: nextAnswers });
    return nextAnswers;
  };

  const commitFtInInput = () => {
    const parsedFt = Number(ftInput);
    const parsedIn = Number(inInput);
    if (Number.isNaN(parsedFt) || !ftInput.trim()) {
      return null;
    }

    const safeFt = Math.max(3, Math.min(8, Math.round(parsedFt)));
    const safeIn = Number.isNaN(parsedIn) || !inInput.trim()
      ? 0
      : Math.max(0, Math.min(11, Math.round(parsedIn)));
    const safeCm = cmFromFeet(safeFt, safeIn);

    setFtInput(String(safeFt));
    setInInput(String(safeIn));
    setCmInput(String(safeCm));

    const nextAnswers = {
      ...answers,
      heightUnit: 'ft' as const,
      heightFt: safeFt,
      heightIn: safeIn,
      heightCm: safeCm,
    };
    navigation.setParams({ answers: nextAnswers });
    return nextAnswers;
  };

  const setUnit = (nextUnit: 'cm' | 'ft') => {
    const nextAnswers = { ...answers, heightUnit: nextUnit };
    if (nextUnit === 'cm') {
      nextAnswers.heightCm = cmFromFeet(ft, inch);
      setCmInput(String(nextAnswers.heightCm));
    } else {
      nextAnswers.heightFt = Math.floor(cm / 30.48);
      nextAnswers.heightIn = Math.round((cm / 2.54) % 12);
      setFtInput(String(nextAnswers.heightFt));
      setInInput(String(nextAnswers.heightIn));
    }
    navigation.setParams({ answers: nextAnswers });
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={10}
      title="What is your height?"
      subtitle="You can choose cm or ft/in units."
      nextLabel="Continue"
      onNext={() => {
        const committedAnswers = unit === 'cm' ? commitCmInput() : commitFtInInput();
        if (!committedAnswers) {
          return;
        }
        navigation.navigate('Weight', {
          answers: {
            ...committedAnswers,
            heightCm: committedAnswers.heightCm,
          },
        });
      }}
    >
      <View style={styles.unitRow}>
        <TouchableOpacity style={[styles.unitChip, unit === 'cm' && styles.unitChipActive]} onPress={() => setUnit('cm')}>
          <Text style={[styles.unitText, unit === 'cm' && styles.unitTextActive]}>cm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.unitChip, unit === 'ft' && styles.unitChipActive]} onPress={() => setUnit('ft')}>
          <Text style={[styles.unitText, unit === 'ft' && styles.unitTextActive]}>ft</Text>
        </TouchableOpacity>
      </View>

      {unit === 'cm' ? (
        <>
          <View style={styles.keyboardCard}>
            <Text style={styles.keyboardLabel}>Type height (cm)</Text>
            <TextInput
              value={cmInput}
              onChangeText={(text) => setCmInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="170"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              onBlur={commitCmInput}
              onSubmitEditing={commitCmInput}
              returnKeyType="done"
            />
          </View>

          <PickerInput
            value={cm}
            min={120}
            max={230}
            suffix="cm"
            onChange={(value) => {
              setCmInput(String(value));
              navigation.setParams({ answers: { ...answers, heightCm: value, heightUnit: 'cm' } });
            }}
          />
        </>
      ) : (
        <>
          <View style={styles.keyboardCard}>
            <Text style={styles.keyboardLabel}>Type height (ft/in)</Text>
            <View style={styles.keyboardRow}>
              <TextInput
                value={ftInput}
                onChangeText={(text) => setFtInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.inputHalf]}
                onBlur={commitFtInInput}
                onSubmitEditing={commitFtInInput}
                returnKeyType="done"
              />
              <TextInput
                value={inInput}
                onChangeText={(text) => setInInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.inputHalf]}
                onBlur={commitFtInInput}
                onSubmitEditing={commitFtInInput}
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={[styles.ftWrap, compact && styles.ftWrapCompact]}>
            <PickerInput
              value={ft}
              min={3}
              max={8}
              suffix="ft"
              onChange={(value) => {
                setFtInput(String(value));
                navigation.setParams({
                  answers: {
                    ...answers,
                    heightUnit: 'ft',
                    heightFt: value,
                    heightCm: cmFromFeet(value, inch),
                  },
                });
              }}
            />
            <View style={[styles.gap, compact && styles.gapCompact]} />
            <PickerInput
              value={inch}
              min={0}
              max={11}
              suffix="in"
              onChange={(value) => {
                setInInput(String(value));
                navigation.setParams({
                  answers: {
                    ...answers,
                    heightUnit: 'ft',
                    heightIn: value,
                    heightCm: cmFromFeet(ft, value),
                  },
                });
              }}
            />
          </View>
        </>
      )}
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  unitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  unitChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  unitChipActive: {
    borderColor: Colors.primaryA42,
    backgroundColor: Colors.primaryLightA18,
  },
  unitText: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  unitTextActive: {
    color: Colors.primary,
  },
  ftWrap: {
    flexDirection: 'row',
  },
  ftWrapCompact: {
    flexDirection: 'column',
  },
  keyboardCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  keyboardLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginBottom: Spacing.xs,
  },
  keyboardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  inputHalf: {
    flex: 1,
  },
  gap: {
    width: Spacing.sm,
  },
  gapCompact: {
    width: 0,
    height: Spacing.sm,
  },
});



