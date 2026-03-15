import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout, OptionCard } from '../../components/onboarding';
import { OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goal'>;

const OPTIONS = [
  { label: 'Lose Weight', value: 'lose_weight', iconName: 'trending-down' },
  { label: 'Build Muscle', value: 'build_muscle', iconName: 'dumbbell' },
  { label: 'Improve Fitness', value: 'improve_fitness', iconName: 'bar-chart' },
  { label: 'Stay Active', value: 'stay_active', iconName: 'heart' },
] as const;

export const GoalScreen: React.FC<Props> = ({ navigation, route }) => {
  const answers = route.params.answers;

  return (
    <OnboardingLayout
      step={2}
      totalSteps={10}
      title="What is your main fitness goal?"
      subtitle="Choose one primary goal so we can tailor your plan."
      nextLabel="Continue"
      nextDisabled={!answers.goal}
      onNext={() => navigation.navigate('Gender', { answers })}
    >
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          iconName={option.iconName}
          selected={answers.goal === option.value}
          onPress={() => navigation.setParams({ answers: { ...answers, goal: option.value } })}
        />
      ))}
    </OnboardingLayout>
  );
};


