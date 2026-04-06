import { getWorkoutById, getWorkouts } from './api';

export const fetchWorkouts = async () => {
  const response = await getWorkouts();
  return response.workouts || [];
};

export const fetchWorkoutById = async (id: string) => {
  const response = await getWorkoutById(id);
  return response.workout;
};
