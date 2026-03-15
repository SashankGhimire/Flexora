import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_CONFIG, ONBOARDING_ENDPOINTS } from './api';
import { getStoredToken } from './authService';

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

const onboardingClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

onboardingClient.interceptors.request.use(
  async (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export const createOnboardingProfile = async (payload: OnboardingPayload) => {
  const response = await onboardingClient.post(ONBOARDING_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const getOnboardingProfile = async (userId: string) => {
  const response = await onboardingClient.get(ONBOARDING_ENDPOINTS.GET_BY_USER(userId));
  return response.data;
};

export const updateOnboardingProfile = async (payload: Partial<OnboardingPayload>) => {
  const response = await onboardingClient.put(ONBOARDING_ENDPOINTS.UPDATE, payload);
  return response.data;
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


