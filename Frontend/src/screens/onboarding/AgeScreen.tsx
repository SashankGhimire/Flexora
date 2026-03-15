import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, PickerInput } from '../../components/onboarding';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Age'>;

export const AgeScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;
  const age = answers.age ?? 22;
  const [ageInput, setAgeInput] = useState(String(age));

  const commitAgeInput = () => {
    const parsed = Number(ageInput);
    if (Number.isNaN(parsed) || !ageInput.trim()) {
      return null;
    }

    const safeAge = Math.max(13, Math.min(70, Math.round(parsed)));
    setAgeInput(String(safeAge));
    const nextAnswers = { ...answers, age: safeAge };
    navigation.setParams({ answers: nextAnswers });
    return nextAnswers;
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={10}
      title="How old are you?"
      subtitle="Use the picker to choose your age."
      nextLabel="Continue"
      onNext={() => {
        const nextAnswers = commitAgeInput();
        if (!nextAnswers) {
          return;
        }
        navigation.navigate('Height', { answers: nextAnswers });
      }}
    >
      <View style={styles.keyboardCard}>
        <Text style={styles.keyboardLabel}>Type age</Text>
        <TextInput
          value={ageInput}
          onChangeText={(text) => setAgeInput(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder="22"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          onBlur={commitAgeInput}
          onSubmitEditing={commitAgeInput}
          returnKeyType="done"
        />
      </View>

      <PickerInput
        value={age}
        min={13}
        max={70}
        onChange={(value) => {
          setAgeInput(String(value));
          navigation.setParams({ answers: { ...answers, age: value } });
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


