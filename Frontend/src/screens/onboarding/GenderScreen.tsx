import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, OptionCard } from '../../components/onboarding';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Gender'>;

const OPTIONS = [
  { label: 'Male', value: 'male', iconName: 'person' },
  { label: 'Female', value: 'female', iconName: 'female' },
  { label: 'Prefer not to say', value: 'prefer_not', iconName: 'circle' },
] as const;

export const GenderScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;

  return (
    <OnboardingLayout
      step={3}
      totalSteps={10}
      title="What is your gender?"
      subtitle="This helps improve your personalized recommendations."
      nextLabel="Continue"
      nextDisabled={!answers.gender}
      onNext={() => navigation.navigate('Age', { answers })}
    >
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          iconName={option.iconName}
          selected={answers.gender === option.value}
          onPress={() => navigation.setParams({ answers: { ...answers, gender: option.value } })}
        />
      ))}
    </OnboardingLayout>
  );
};


