/**
 * API Service
 * Handles all communication with the backend
 */

import axios from 'axios';
import type { AxiosError } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../constants/api';

// Simple in-memory token storage
let authToken: string | null = null;

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

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
    console.error('Registration API Error:', error);
    
    // Handle network errors
    if (!error.response) {
      throw {
        message: `Network Error: Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running.`,
      };
    }
    
    throw error.response?.data || { message: error.message };
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
    console.error('Login API Error:', error);
    
    // Handle network errors
    if (!error.response) {
      throw {
        message: `Network Error: Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running.`,
      };
    }
    
    throw error.response?.data || { message: error.message };
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
    throw error.response?.data || error;
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
    throw error.response?.data || error;
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
