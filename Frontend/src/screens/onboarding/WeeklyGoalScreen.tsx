import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, OptionCard } from '../../components/onboarding';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'WeeklyGoal'>;

const OPTIONS = [
  { label: '3 days', value: 3, iconName: 'bar-chart' },
  { label: '4 days', value: 4, iconName: 'target' },
  { label: '5 days', value: 5, iconName: 'award' },
  { label: 'Daily', value: 7, iconName: 'calendar' },
] as const;

export const WeeklyGoalScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;

  return (
    <OnboardingLayout
      step={9}
      totalSteps={10}
      title="How many days per week do you want to train?"
      subtitle="Set a realistic weekly commitment goal."
      nextLabel="Continue"
      nextDisabled={!answers.workoutDays}
      onNext={() => navigation.navigate('BMI', { answers })}
    >
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          iconName={option.iconName}
          selected={answers.workoutDays === option.value}
          onPress={() => navigation.setParams({ answers: { ...answers, workoutDays: option.value } })}
        />
      ))}
    </OnboardingLayout>
  );
};


