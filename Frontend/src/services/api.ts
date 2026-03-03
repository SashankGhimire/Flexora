/**
 * API Configuration and Endpoints
 * Centralized backend configuration for development and production
 */

const LAPTOP_LAN_IP = '192.168.1.68';
const BACKEND_PORT = 5000;

export const API_BASE_URL = `http://${LAPTOP_LAN_IP}:${BACKEND_PORT}/api`;

export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GET_ME: '/auth/me',
  UPDATE_ME: '/auth/me',
};

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000,
  IS_DEVELOPMENT: true,
};
