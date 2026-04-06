import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOnboarding, fetchOnboarding, updateOnboarding } from './api';

export type OnboardingPayload = {
  goal: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activityLevel: string;
  trainingPreference: string;
  workoutDays: number;
  bmi: number;
};

const onboardingProfileKey = (userId: string) => `@flexora:onboarding_profile:${userId}`;

export const createOnboardingProfile = async (payload: OnboardingPayload) => {
  return createOnboarding(payload);
};

export const getOnboardingProfile = async (userId: string) => {
  return fetchOnboarding(userId);
};

export const updateOnboardingProfile = async (payload: Partial<OnboardingPayload>) => {
  return updateOnboarding(payload);
};

export const saveLocalOnboardingProfile = async (userId: string, payload: Partial<OnboardingPayload>) => {
  const existing = await getLocalOnboardingProfile(userId);
  const next = {
    ...existing,
    ...payload,
  };

  await AsyncStorage.setItem(onboardingProfileKey(userId), JSON.stringify(next));
  return next;
};

export const getLocalOnboardingProfile = async (userId: string): Promise<Partial<OnboardingPayload> | null> => {
  const raw = await AsyncStorage.getItem(onboardingProfileKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<OnboardingPayload>;
  } catch {
    return null;
  }
};
