/**
 * API Service
 * Handles all communication with the backend
 */

import axios from 'axios';
import type { AxiosError } from 'axios';
import {
  AUTH_ENDPOINTS,
  API_CONFIG,
  createServerNotReachableError,
  resolveApiBaseUrl,
} from './api';

// Simple in-memory token storage
let authToken: string | null = null;

/**
 * API Client Configuration
 * Uses centralized config from services/api.ts
 * Works universally across Android emulator, real device, and iOS
 */
const apiClient = axios.create({
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    config.baseURL = await resolveApiBaseUrl();

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
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

  throw error.response?.data || { message: error.message };
};

/**
 * User Registration API Call
 * @param {{ name: string, email: string, password: string }} userData - User registration data
 * @returns {Promise} Response with token and user data
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, userData);
    // Save token in memory
    if (response.data.token) {
      authToken = response.data.token;
    }
    return response.data;
  } catch (error: any) {
    throwNormalizedApiError(error);
  }
};

/**
 * User Login API Call
 * @param {{ email: string, password: string }} credentials - Login credentials
 * @returns {Promise} Response with token and user data
 */
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
    // Save token in memory
    if (response.data.token) {
      authToken = response.data.token;
    }
    return response.data;
  } catch (error: any) {
    throwNormalizedApiError(error);
  }
};

/**
 * Get Current User API Call
 * Requires valid JWT token
 * @returns {Promise} Response with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(AUTH_ENDPOINTS.GET_ME);
    return response.data;
  } catch (error: any) {
    throwNormalizedApiError(error);
  }
};

/**
 * Update Current User API Call
 * Requires valid JWT token
 * @param {{ name?: string, avatar?: { uri: string, name?: string, type?: string } }} data
 * @returns {Promise} Response with updated user data
 */
export const updateProfile = async (data: {
  name?: string;
  avatar?: { uri: string; name?: string; type?: string } | null;
}) => {
  try {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }

    if (data.avatar?.uri) {
      formData.append('avatar', {
        uri: data.avatar.uri,
        name: data.avatar.name || `avatar-${Date.now()}.jpg`,
        type: data.avatar.type || 'image/jpeg',
      } as any);
    }

    const response = await apiClient.put(AUTH_ENDPOINTS.UPDATE_ME, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throwNormalizedApiError(error);
  }
};

/**
 * Logout
 * Clears token from memory
 */
export const logout = async () => {
  authToken = null;
};

/**
 * Get stored authentication token
 * @returns {string|null} Authentication token or null
 */
export const getStoredToken = () => {
  return authToken;
};


