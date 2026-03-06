import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, OptionCard } from '../../components/onboarding';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Activity'>;

const OPTIONS = [
  { label: 'Beginner', value: 'beginner', iconName: 'circle' },
  { label: 'Occasionally active', value: 'occasional', iconName: 'clock' },
  { label: 'Regularly active', value: 'regular', iconName: 'activity' },
] as const;

export const ActivityScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;

  return (
    <OnboardingLayout
      step={7}
      totalSteps={10}
      title="How active are you currently?"
      subtitle="This helps us set a suitable starting level."
      nextLabel="Continue"
      nextDisabled={!answers.activityLevel}
      onNext={() => navigation.navigate('Preference', { answers })}
    >
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          iconName={option.iconName}
          selected={answers.activityLevel === option.value}
          onPress={() => navigation.setParams({ answers: { ...answers, activityLevel: option.value } })}
        />
      ))}
    </OnboardingLayout>
  );
};
