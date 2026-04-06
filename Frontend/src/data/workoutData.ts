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

const normalizeExerciseKey = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const findExerciseByName = (name: string): WorkoutExercise | undefined => {
  const normalizedName = normalizeExerciseKey(name);
  return EXERCISES.find((exercise) => normalizeExerciseKey(exercise.name) === normalizedName || exercise.id === normalizedName);
};

export const resolveExerciseAnimation = (idOrName: string): string => {
  const exercise = getExerciseById(idOrName) || findExerciseByName(idOrName);
  return exercise?.animation || 'jumping_jacks.json';
};

export const resolveExercisePreview = (idOrName: string): WorkoutExercise | undefined => {
  return getExerciseById(idOrName) || findExerciseByName(idOrName);
};

export const getExercisesForProgram = (programId: string): WorkoutExercise[] => {
  const program = getProgramById(programId);
  if (!program) return [];

  return program.exerciseIds
    .map((exerciseId) => getExerciseById(exerciseId))
    .filter((exercise): exercise is WorkoutExercise => Boolean(exercise));
};

export const getProgramsByFocus = (focus: string): WorkoutProgram[] =>
  WORKOUTS.filter((program) => program.focus.toLowerCase() === focus.toLowerCase());

const CATEGORY_TO_FOCUS: Record<string, string> = {
  abs: 'Abs',
  arms: 'Arm',
  chest: 'Chest',
  legs: 'Leg',
  shoulder: 'Shoulder',
  back: 'Back',
  'full body': 'Full Body',
};

export const getLocalProgramFocus = (category: string): string => {
  return CATEGORY_TO_FOCUS[category.toLowerCase()] || 'Full Body';
};

export const getLocalExercisesForCategory = (category: string): WorkoutExercise[] => {
  const focus = getLocalProgramFocus(category);
  const localProgram = getProgramsByFocus(focus)[0];
  return localProgram ? getExercisesForProgram(localProgram.id) : [];
};

export const resolveExerciseForWorkout = (
  workoutCategory: string,
  exerciseName: string,
  orderIndex: number
): WorkoutExercise | undefined => {
  return (
    findExerciseByName(exerciseName) ||
    getLocalExercisesForCategory(workoutCategory)[orderIndex] ||
    getExerciseById(exerciseName)
  );
};


