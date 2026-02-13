/**
 * API Configuration
 * Centralized API base URL and endpoints
 */

// API Base URL Configuration
// For Android Emulator: Use 10.0.2.2 to access host machine
// For iOS Simulator: Use localhost
// For Physical Device: Use your machine's IP address (e.g., 192.168.x.x)
// 
// IMPORTANT: Update this to match your backend server address
// Android Emulator: http://10.0.2.2:5000
// iOS Simulator: http://localhost:5000
// Physical Device: http://YOUR_MACHINE_IP:5000 (e.g., http://192.168.1.100:5000)

export const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Auth Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GET_ME: '/auth/me',
};
