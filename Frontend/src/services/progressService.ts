import { getProgress } from './api';

export const fetchProgressByUser = async (userId: string) => {
  const response = await getProgress(userId);
  return response.progress;
};
