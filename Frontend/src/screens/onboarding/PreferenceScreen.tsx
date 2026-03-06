import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, OptionCard } from '../../components/onboarding';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Preference'>;

const OPTIONS = [
  { label: 'AI Trainer', value: 'ai_trainer', iconName: 'bot' },
  { label: 'Bodyweight Workouts', value: 'bodyweight', iconName: 'activity' },
  { label: 'Both', value: 'both', iconName: 'zap' },
] as const;

export const PreferenceScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;

  return (
    <OnboardingLayout
      step={8}
      totalSteps={10}
      title="How do you want to train?"
      subtitle="Choose your preferred training style."
      nextLabel="Continue"
      nextDisabled={!answers.trainingPreference}
      onNext={() => navigation.navigate('WeeklyGoal', { answers })}
    >
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          iconName={option.iconName}
          selected={answers.trainingPreference === option.value}
          onPress={() => navigation.setParams({ answers: { ...answers, trainingPreference: option.value } })}
        />
      ))}
    </OnboardingLayout>
  );
};
