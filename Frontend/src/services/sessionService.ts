import { saveSession, startSession, type SessionExercisePayload } from './api';

export const startWorkoutSession = async (workoutProgramId?: string) => {
  const response = await startSession({ workoutProgramId });
  return response.session;
};

export const saveWorkoutSession = async (payload: {
  sessionId?: string;
  workoutProgramId?: string;
  exercisesPerformed: SessionExercisePayload[];
  caloriesBurned?: number;
  durationSeconds?: number;
}) => {
  const response = await saveSession(payload);
  return response;
};
