/**
 * API Configuration and Endpoints
 */

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

export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GET_ME: '/auth/me',
  UPDATE_ME: '/auth/me',
};

export const ONBOARDING_ENDPOINTS = {
  CREATE: '/onboarding',
  GET_BY_USER: (userId: string) => `/onboarding/${userId}`,
  UPDATE: '/onboarding/update',
};

export const API_CONFIG = {
  TIMEOUT: 10000,
  IS_DEVELOPMENT: true,
};


