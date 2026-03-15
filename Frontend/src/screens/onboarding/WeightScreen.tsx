import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, PickerInput } from '../../components/onboarding';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Weight'>;

export const WeightScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;
  const weight = answers.weight ?? 65;
  const [weightInput, setWeightInput] = useState(String(weight));

  const commitWeightInput = () => {
    const parsed = Number(weightInput);
    if (Number.isNaN(parsed) || !weightInput.trim()) {
      return null;
    }

    const safeWeight = Math.max(30, Math.min(220, Math.round(parsed)));
    setWeightInput(String(safeWeight));
    const nextAnswers = { ...answers, weight: safeWeight };
    navigation.setParams({ answers: nextAnswers });
    return nextAnswers;
  };

  return (
    <OnboardingLayout
      step={6}
      totalSteps={10}
      title="What is your current weight?"
      subtitle="This will be used for BMI and progress tracking."
      nextLabel="Continue"
      onNext={() => {
        const nextAnswers = commitWeightInput();
        if (!nextAnswers) {
          return;
        }
        navigation.navigate('Activity', { answers: nextAnswers });
      }}
    >
      <View style={styles.keyboardCard}>
        <Text style={styles.keyboardLabel}>Type weight (kg)</Text>
        <TextInput
          value={weightInput}
          onChangeText={(text) => setWeightInput(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder="65"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          onBlur={commitWeightInput}
          onSubmitEditing={commitWeightInput}
          returnKeyType="done"
        />
      </View>

      <PickerInput
        value={weight}
        min={30}
        max={220}
        suffix="kg"
        onChange={(value) => {
          setWeightInput(String(value));
          navigation.setParams({ answers: { ...answers, weight: value } });
        }}
      />
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
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
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: FontWeight.heavy,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
});


