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
  const hasAvatar = Boolean(data.avatar?.uri);

  // Fast path: no avatar upload required, use standard JSON profile update.
  if (!hasAvatar) {
    return updateCurrentUser({ ...(normalizedName ? { name: normalizedName } : {}) });
  }

  const multipartPayload = {
    ...(normalizedName ? { name: normalizedName } : {}),
    avatar: data.avatar,
  };

  const getReadableError = (error: any): string => {
    const message = error?.message || error?.data?.message || 'Unknown upload error';
    return String(message).trim();
  };

  try {
    return await updateCurrentUserMultipart(multipartPayload);
  } catch {
    // Retry once in case ngrok route or transient network caused the first multipart failure.
    try {
      return await updateCurrentUserMultipart(multipartPayload);
    } catch (error: any) {
      // Keep profile save reliable even when avatar upload fails (e.g. Cloudinary/network timeout).
      if (normalizedName) {
        const fallback = await updateCurrentUser({ name: normalizedName });

        // Try avatar-only upload once more after name is safely updated.
        try {
          return await updateCurrentUserMultipart({ avatar: data.avatar });
        } catch (avatarOnlyError: any) {
          const detail = getReadableError(avatarOnlyError);
          return {
            ...fallback,
            warning: `Profile name was saved, but avatar upload failed (${detail}). Please try a smaller JPG/PNG image and retry.`,
          };
        }
      }

      throw error;
    }
  }
};

export const getStoredTokenValue = () => getStoredToken();
export { getCurrentUser };
