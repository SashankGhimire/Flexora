import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding';
import { OnboardingAnswers, OnboardingStackParamList } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const initialAnswers: OnboardingAnswers = {
    age: 22,
    heightUnit: 'cm',
    heightCm: 170,
    heightFt: 5,
    heightIn: 7,
    weight: 65,
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={10}
      title="Welcome to Flexora"
      subtitle="Your AI-powered fitness trainer. Answer a few quick questions to personalize your workouts."
      nextLabel="Get Started"
      onNext={() => navigation.navigate('Goal', { answers: initialAnswers })}
    >
      <View style={styles.animWrap}>
        <LottieView
          source={require('../../assets/animations/fitness_welcome.json')}
          autoPlay
          loop
          style={styles.anim}
        />
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  animWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  anim: {
    width: 250,
    height: 250,
  },
});
