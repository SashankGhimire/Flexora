import {
  getCurrentUser,
  getStoredToken,
  login,
  register,
  setAuthToken,
  updateCurrentUser,
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
  const normalizedName = typeof data.name === 'string' ? data.name.trim() : undefined;

  if (!data.avatar?.uri) {
    return updateCurrentUser({ ...(normalizedName ? { name: normalizedName } : {}) });
  }

  try {
    return await updateCurrentUserMultipart({
      ...(normalizedName ? { name: normalizedName } : {}),
      avatar: data.avatar,
    });
  } catch (error) {
    if (normalizedName) {
      return updateCurrentUser({ name: normalizedName });
    }

    throw error;
  }
};

export const getStoredTokenValue = () => getStoredToken();
export { getCurrentUser };
