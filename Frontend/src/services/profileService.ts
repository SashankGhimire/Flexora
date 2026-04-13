import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserProfile, updateCurrentUser } from './api';

export const getProfileGoal = async (): Promise<string | null> => {
  try {
    const profile = await fetchUserProfile();
    const goal = profile?.user?.goal;
    return typeof goal === 'string' && goal.trim().length > 0 ? goal.trim() : null;
  } catch {
    return null;
  }
};

export const updateProfileGoal = async (goal: string): Promise<void> => {
  await updateCurrentUser({ goal });
};

export const getNotificationPreference = async (userId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(`@flexora:notifications:${userId}`);
  return value !== 'off';
};

export const setNotificationPreference = async (userId: string, enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(`@flexora:notifications:${userId}`, enabled ? 'on' : 'off');
};
