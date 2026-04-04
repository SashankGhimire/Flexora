import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_CONFIG,
  ONBOARDING_ENDPOINTS,
  createServerNotReachableError,
  resolveApiBaseUrl,
} from './api';
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
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

onboardingClient.interceptors.request.use(
  async (config) => {
    config.baseURL = await resolveApiBaseUrl();

    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

onboardingClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & {
      __retryWithFallback?: boolean;
    }) | null;

    if (!error.response && originalRequest && !originalRequest.__retryWithFallback) {
      originalRequest.__retryWithFallback = true;
      originalRequest.baseURL = await resolveApiBaseUrl(true);
      return onboardingClient.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

const normalizeOnboardingError = (error: any): never => {
  if (!error?.response) {
    throw createServerNotReachableError(error);
  }

  throw error.response?.data || { message: error.message };
};

export const createOnboardingProfile = async (payload: OnboardingPayload) => {
  try {
    const response = await onboardingClient.post(ONBOARDING_ENDPOINTS.CREATE, payload);
    return response.data;
  } catch (error: any) {
    normalizeOnboardingError(error);
  }
};

export const getOnboardingProfile = async (userId: string) => {
  try {
    const response = await onboardingClient.get(ONBOARDING_ENDPOINTS.GET_BY_USER(userId));
    return response.data;
  } catch (error: any) {
    normalizeOnboardingError(error);
  }
};

export const updateOnboardingProfile = async (payload: Partial<OnboardingPayload>) => {
  try {
    const response = await onboardingClient.put(ONBOARDING_ENDPOINTS.UPDATE, payload);
    return response.data;
  } catch (error: any) {
    normalizeOnboardingError(error);
  }
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


