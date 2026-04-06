import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export {
  API_BASE_URL,
  API_URL_LOCAL,
  API_URL_NGROK,
  DEMO_MODE,
  resolveApiBaseUrl,
  getApiBaseUrlSync,
  getApiServerOrigin,
  resetResolvedApiBaseUrl,
  createServerNotReachableError,
} from '../config/api';
import {
  createServerNotReachableError,
  resolveApiBaseUrl,
} from '../config/api';

const API_CONFIG = {
  TIMEOUT: 10000,
};

export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GET_ME: '/auth/me',
  UPDATE_ME: '/auth/me',
};

export const USER_ENDPOINTS = {
  PROFILE: '/user/profile',
  UPDATE: '/user/update',
};

export const ONBOARDING_ENDPOINTS = {
  CREATE: '/onboarding',
  GET_BY_USER: (userId: string) => `/onboarding/${userId}`,
  UPDATE: '/onboarding/update',
};

export const WORKOUT_ENDPOINTS = {
  LIST: '/workouts',
  DETAILS: (id: string) => `/workouts/${id}`,
};

export const EXERCISE_ENDPOINTS = {
  LIST: '/exercises',
  DETAILS: (id: string) => `/exercises/${id}`,
};

export const SESSION_ENDPOINTS = {
  START: '/session/start',
  SAVE: '/session/save',
};

export const PROGRESS_ENDPOINTS = {
  BY_USER: (userId: string) => `/progress/${userId}`,
};

export const ADMIN_ENDPOINTS = {
  ADD_WORKOUT: '/admin/add-workout',
  ADD_EXERCISE: '/admin/add-exercise',
};

const TOKEN_KEY = '@flexora:auth_token';
let authToken: string | null = null;

const apiClient: AxiosInstance = axios.create({
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    config.baseURL = await resolveApiBaseUrl();

    if (!authToken) {
      authToken = await AsyncStorage.getItem(TOKEN_KEY);
    }

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & {
      __retryWithFallback?: boolean;
    }) | null;

    if (!error.response && originalRequest && !originalRequest.__retryWithFallback) {
      originalRequest.__retryWithFallback = true;
      originalRequest.baseURL = await resolveApiBaseUrl(true);
      return apiClient.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

const throwNormalizedApiError = (error: any): never => {
  if (!error?.response) {
    throw createServerNotReachableError(error);
  }

  const payload = error.response?.data;
  const firstValidationError =
    Array.isArray(payload?.errors) && payload.errors.length > 0 ? String(payload.errors[0]) : undefined;

  const message = payload?.message || payload?.error || firstValidationError || error.message || 'Request failed';
  const normalized = new Error(message) as Error & {
    status?: number;
    data?: unknown;
  };

  normalized.status = error.response?.status;
  normalized.data = payload;

  throw normalized;
};

const request = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  try {
    const response = await promise;
    return response.data;
  } catch (error: any) {
    throwNormalizedApiError(error);
    throw error;
  }
};

export const setAuthToken = async (token: string | null): Promise<void> => {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

export const getStoredToken = (): string | null => authToken;

export type ApiAuthUser = {
  id: string;
  name: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
  avatarUrl?: string;
  completedOnboarding?: boolean;
  role?: 'user' | 'admin';
};

export type ApiWorkout = {
  _id: string;
  title: string;
  category: 'abs' | 'arms' | 'legs' | 'full body';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: Array<{
    exercise: {
      _id: string;
      name: string;
      type: 'AI' | 'non-AI';
      instructions: string;
      mediaUrl?: string;
      targetMuscle?: string[];
      reps?: number | null;
      duration?: number | null;
      postureTips?: string[];
    };
    order: number;
    reps?: number | null;
    duration?: number | null;
  }>;
  coverImageUrl?: string;
};

export type SessionExercisePayload = {
  exercise: string;
  reps?: number;
  duration?: number;
  accuracy?: number;
};

export const register = (payload: {
  name: string;
  email: string;
  password: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
}) => request<{ message: string; token: string; user: ApiAuthUser }>(apiClient.post(AUTH_ENDPOINTS.REGISTER, payload));

export const login = (payload: { email: string; password: string }) =>
  request<{ message: string; token: string; user: ApiAuthUser }>(apiClient.post(AUTH_ENDPOINTS.LOGIN, payload));

export const getCurrentUser = () => request<{ message: string; user: ApiAuthUser }>(apiClient.get(AUTH_ENDPOINTS.GET_ME));

export const updateCurrentUser = (payload: {
  name?: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
}) => request<{ message: string; user: ApiAuthUser }>(apiClient.put(USER_ENDPOINTS.UPDATE, payload));

export const updateCurrentUserMultipart = async (payload: {
  name?: string;
  avatar?: { uri: string; name?: string; type?: string } | null;
}) => {
  const formData = new FormData();
  if (payload.name) {
    formData.append('name', payload.name);
  }

  if (payload.avatar?.uri) {
    formData.append('avatar', {
      uri: payload.avatar.uri,
      name: payload.avatar.name || `avatar-${Date.now()}.jpg`,
      type: payload.avatar.type || 'image/jpeg',
    } as any);
  }

  return request<{ message: string; user: ApiAuthUser }>(
    apiClient.put(AUTH_ENDPOINTS.UPDATE_ME, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
};

export const fetchUserProfile = () => request<{ message: string; user: ApiAuthUser }>(apiClient.get(USER_ENDPOINTS.PROFILE));

export const createOnboarding = (payload: Record<string, unknown>) =>
  request<{ message: string; profile: Record<string, unknown> }>(apiClient.post(ONBOARDING_ENDPOINTS.CREATE, payload));

export const fetchOnboarding = (userId: string) =>
  request<{ message: string; profile: Record<string, any> }>(apiClient.get(ONBOARDING_ENDPOINTS.GET_BY_USER(userId)));

export const updateOnboarding = (payload: Record<string, unknown>) =>
  request<{ message: string; profile: Record<string, unknown> }>(apiClient.put(ONBOARDING_ENDPOINTS.UPDATE, payload));

export const getWorkouts = () => request<{ message: string; workouts: ApiWorkout[] }>(apiClient.get(WORKOUT_ENDPOINTS.LIST));

export const getWorkoutById = (id: string) =>
  request<{ message: string; workout: ApiWorkout }>(apiClient.get(WORKOUT_ENDPOINTS.DETAILS(id)));

export const getExercises = () => request<{ message: string; exercises: Record<string, any>[] }>(apiClient.get(EXERCISE_ENDPOINTS.LIST));

export const getExerciseById = (id: string) =>
  request<{ message: string; exercise: Record<string, any> }>(apiClient.get(EXERCISE_ENDPOINTS.DETAILS(id)));

export const startSession = (payload: { workoutProgramId?: string }) =>
  request<{ message: string; session: { _id: string } }>(apiClient.post(SESSION_ENDPOINTS.START, payload));

export const saveSession = (payload: {
  sessionId?: string;
  workoutProgramId?: string;
  exercisesPerformed: SessionExercisePayload[];
  caloriesBurned?: number;
  durationSeconds?: number;
}) => request<{ message: string; session: Record<string, any>; progress: Record<string, any> }>(apiClient.post(SESSION_ENDPOINTS.SAVE, payload));

export const getProgress = (userId: string) =>
  request<{ message: string; progress: Record<string, any> }>(apiClient.get(PROGRESS_ENDPOINTS.BY_USER(userId)));

export const addWorkoutAdmin = (payload: Record<string, unknown>) =>
  request<{ message: string; workout: Record<string, any> }>(apiClient.post(ADMIN_ENDPOINTS.ADD_WORKOUT, payload));

export const addExerciseAdmin = (payload: Record<string, unknown>) =>
  request<{ message: string; exercise: Record<string, any> }>(apiClient.post(ADMIN_ENDPOINTS.ADD_EXERCISE, payload));

export const retry = async <T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError;
};
