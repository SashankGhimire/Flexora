import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAllPrograms, getExercisesForProgram } from '../data/workoutData';
import type { ApiWorkout } from '../services/api';
import { fetchWorkoutById, fetchWorkouts } from '../services/workoutService';
import { fetchProgressByUser } from '../services/progressService';

type WorkoutLoadState = {
  loading: boolean;
  error: string | null;
};

type SessionState = {
  sessionId: string | null;
  workoutProgramId: string | null;
};

type AppDataContextValue = {
  workouts: ApiWorkout[];
  workoutsState: WorkoutLoadState;
  refreshWorkouts: () => Promise<void>;
  getWorkout: (workoutId: string) => Promise<ApiWorkout | null>;
  sessionState: SessionState;
  setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
  getProgressForUser: (userId: string) => Promise<Record<string, any> | null>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const mapLocalProgramToWorkout = (program: ReturnType<typeof getAllPrograms>[number]): ApiWorkout => {
  const localExercises = getExercisesForProgram(program.id);

  return {
    _id: program.id,
    title: program.name,
    category: program.focus.toLowerCase() as ApiWorkout['category'],
    difficulty: 'beginner',
    duration: program.durationMinutes,
    coverImageUrl: '',
    exercises: localExercises.map((exercise, index) => ({
      order: index + 1,
      reps: exercise.reps,
      duration: exercise.duration,
      exercise: {
        _id: exercise.id,
        name: exercise.name,
        type: exercise.id.includes('ai') ? 'AI' : 'non-AI',
        instructions: exercise.instructions,
        targetMuscle: exercise.focus,
        reps: exercise.reps,
        duration: exercise.duration,
        postureTips: exercise.mistakes,
        mediaUrl: '',
      },
    })),
  };
};

const localWorkoutFallback = getAllPrograms().map(mapLocalProgramToWorkout);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<ApiWorkout[]>([]);
  const [workoutsState, setWorkoutsState] = useState<WorkoutLoadState>({
    loading: false,
    error: null,
  });
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionId: null,
    workoutProgramId: null,
  });

  const refreshWorkouts = useCallback(async () => {
    setWorkoutsState({ loading: true, error: null });
    try {
      const remote = await fetchWorkouts();
      if (Array.isArray(remote) && remote.length > 0) {
        setWorkouts(remote);
      } else {
        setWorkouts(localWorkoutFallback);
      }
      setWorkoutsState({ loading: false, error: null });
    } catch (error: any) {
      setWorkouts(localWorkoutFallback);
      setWorkoutsState({ loading: false, error: error?.message || 'Unable to fetch workouts' });
    }
  }, []);

  const getWorkout = useCallback(
    async (workoutId: string): Promise<ApiWorkout | null> => {
      const existing = workouts.find((item) => item._id === workoutId);
      if (existing) {
        return existing;
      }

      try {
        const workout = await fetchWorkoutById(workoutId);
        return workout;
      } catch {
        return localWorkoutFallback.find((item) => item._id === workoutId) || null;
      }
    },
    [workouts]
  );

  const getProgressForUser = useCallback(async (userId: string) => {
    try {
      const progress = await fetchProgressByUser(userId);
      return progress;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshWorkouts();
  }, [refreshWorkouts]);

  const value = useMemo(
    () => ({
      workouts,
      workoutsState,
      refreshWorkouts,
      getWorkout,
      sessionState,
      setSessionState,
      getProgressForUser,
    }),
    [workouts, workoutsState, refreshWorkouts, getWorkout, sessionState, getProgressForUser]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = (): AppDataContextValue => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
};
