import {
  getCurrentUser,
  getStoredToken,
  login,
  register,
  setAuthToken,
  updateCurrentUserMultipart,
} from './api';

export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
}) => {
  const response = await register(userData);
  await setAuthToken(response.token);
  return response;
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  const response = await login(credentials);
  await setAuthToken(response.token);
  return response;
};

export const logout = async () => {
  await setAuthToken(null);
};

export const updateProfile = async (data: {
  name?: string;
  avatar?: { uri: string; name?: string; type?: string } | null;
}) => {
  return updateCurrentUserMultipart(data);
};

export const getStoredTokenValue = () => getStoredToken();
export { getCurrentUser };
