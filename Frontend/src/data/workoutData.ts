import exercisesJson from './exercises.json';
import workoutsJson from './workouts.json';

export type WorkoutExercise = {
  id: string;
  name: string;
  type: 'timer' | 'reps';
  duration: number | null;
  reps: number | null;
  animation: string;
  focus: string[];
  instructions: string;
  mistakes: string[];
};

export type WorkoutProgram = {
  id: string;
  name: string;
  focus: 'Abs' | 'Arm' | 'Chest' | 'Leg' | 'Shoulder' | 'Back' | 'Full Body';
  durationMinutes: number;
  exerciseIds: string[];
};

const EXERCISES = exercisesJson as WorkoutExercise[];
const WORKOUTS = workoutsJson as WorkoutProgram[];

export const BODY_FOCUS = ['Abs', 'Arm', 'Chest', 'Leg', 'Shoulder', 'Back', 'Full Body'] as const;

export const getAllExercises = (): WorkoutExercise[] => EXERCISES;
export const getAllPrograms = (): WorkoutProgram[] => WORKOUTS;

export const getProgramById = (programId: string): WorkoutProgram | undefined =>
  WORKOUTS.find((program) => program.id === programId);

export const getExerciseById = (exerciseId: string): WorkoutExercise | undefined =>
  EXERCISES.find((exercise) => exercise.id === exerciseId);

export const getExercisesForProgram = (programId: string): WorkoutExercise[] => {
  const program = getProgramById(programId);
  if (!program) return [];

  return program.exerciseIds
    .map((exerciseId) => getExerciseById(exerciseId))
    .filter((exercise): exercise is WorkoutExercise => Boolean(exercise));
};

export const getProgramsByFocus = (focus: string): WorkoutProgram[] =>
  WORKOUTS.filter((program) => program.focus.toLowerCase() === focus.toLowerCase());


