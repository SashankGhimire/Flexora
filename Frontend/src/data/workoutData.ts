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

const compactExerciseKey = (value: string): string => normalizeExerciseKey(value).replace(/-/g, '');

const EXERCISE_ALIAS_TO_ID: Record<string, string> = {
  'jumping-jack': 'jumping-jacks',
  jumpingjack: 'jumping-jacks',
  jumpingjacks: 'jumping-jacks',
  'plank-hold': 'plank-hold',
  plankhold: 'plank-hold',
  plank: 'plank-hold',
  'push-up': 'pushups',
  pushup: 'pushups',
  pushups: 'pushups',
  'bodyweight-squat': 'bodyweight-squats',
  bodyweightsquat: 'bodyweight-squats',
  bodyweightsquats: 'bodyweight-squats',
  'shoulder-tap': 'shoulder-taps',
  shouldertap: 'shoulder-taps',
  shouldertaps: 'shoulder-taps',
  'mountain-climber': 'mountain-climbers',
  mountainclimber: 'mountain-climbers',
  mountainclimbers: 'mountain-climbers',
  'reverse-lunge': 'reverse-lunges',
  reverselunge: 'reverse-lunges',
  reverselunges: 'reverse-lunges',
  'triceps-dips': 'tricep-dips',
  tricepsdips: 'tricep-dips',
  'arm-circle': 'arm-circles',
  armcircle: 'arm-circles',
  armcircles: 'arm-circles',
  'high-knee': 'high-knees',
  highknee: 'high-knees',
  highknees: 'high-knees',
};

const resolveAliasExerciseId = (value: string): string | undefined => {
  const normalized = normalizeExerciseKey(value);
  const compact = compactExerciseKey(value);
  return EXERCISE_ALIAS_TO_ID[normalized] || EXERCISE_ALIAS_TO_ID[compact];
};

const findExerciseByFlexibleId = (value: string): WorkoutExercise | undefined => {
  const normalized = normalizeExerciseKey(value);
  const compact = compactExerciseKey(value);
  const aliasId = resolveAliasExerciseId(value);

  if (aliasId) {
    const aliasMatch = getExerciseById(aliasId);
    if (aliasMatch) {
      return aliasMatch;
    }
  }

  return EXERCISES.find((exercise) => {
    const normalizedId = normalizeExerciseKey(exercise.id);
    return normalizedId === normalized || compactExerciseKey(normalizedId) === compact;
  });
};

export const findExerciseByName = (name: string): WorkoutExercise | undefined => {
  const aliasId = resolveAliasExerciseId(name);
  if (aliasId) {
    const aliasMatch = getExerciseById(aliasId);
    if (aliasMatch) {
      return aliasMatch;
    }
  }

  const normalizedName = normalizeExerciseKey(name);
  const compactName = compactExerciseKey(name);

  return EXERCISES.find((exercise) => {
    const normalizedExerciseName = normalizeExerciseKey(exercise.name);
    const compactExerciseName = compactExerciseKey(exercise.name);
    const compactExerciseId = compactExerciseKey(exercise.id);

    return (
      normalizedExerciseName === normalizedName ||
      exercise.id === normalizedName ||
      compactExerciseName === compactName ||
      compactExerciseId === compactName
    );
  });
};

export const resolveExerciseAnimation = (idOrName: string): string => {
  const exercise = getExerciseById(idOrName) || findExerciseByFlexibleId(idOrName) || findExerciseByName(idOrName);
  return exercise?.animation || 'jumping_jacks.json';
};

export const resolveExercisePreview = (idOrName: string): WorkoutExercise | undefined => {
  return getExerciseById(idOrName) || findExerciseByFlexibleId(idOrName) || findExerciseByName(idOrName);
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
    resolveExercisePreview(exerciseName) ||
    findExerciseByName(exerciseName) ||
    getLocalExercisesForCategory(workoutCategory)[orderIndex] ||
    getExerciseById(exerciseName)
  );
};


