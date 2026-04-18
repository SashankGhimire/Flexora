import { getProgress, resetProgress } from './api';

export const fetchProgressByUser = async (userId: string) => {
  const response = await getProgress(userId);
  return response.progress;
};

export const resetWorkoutProgress = async () => {
  return resetProgress();
};
