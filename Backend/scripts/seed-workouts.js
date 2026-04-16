const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const envResult = dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (envResult.error) {
  dotenv.config();
}

const connectDB = require('../config/db');
const Exercise = require('../models/Exercise');
const WorkoutProgram = require('../models/WorkoutProgram');

const exerciseSeed = [
  {
    name: 'Bodyweight Squat',
    slug: 'bodyweight-squat',
    type: 'AI',
    instructions: 'Stand with feet shoulder-width apart. Lower hips until thighs are near parallel, then stand up.',
    targetMuscle: ['quads', 'glutes', 'core'],
    reps: 12,
    postureTips: ['Keep chest up', 'Knees track over toes', 'Drive through heels'],
    caloriesPerMinute: 7,
  },
  {
    name: 'Push-Up',
    slug: 'push-up',
    type: 'AI',
    instructions: 'Start in plank. Lower chest with neutral spine, then push back to full elbow extension.',
    targetMuscle: ['chest', 'triceps', 'core'],
    reps: 10,
    postureTips: ['Keep body straight', 'Elbows about 45 degrees', 'Avoid hip sag'],
    caloriesPerMinute: 8,
  },
  {
    name: 'Shoulder Press',
    slug: 'shoulder-press',
    type: 'AI',
    instructions: 'Press arms overhead from shoulder level and return with control.',
    targetMuscle: ['shoulders', 'triceps'],
    reps: 12,
    postureTips: ['Brace core', 'Do not arch lower back', 'Lock out softly'],
    caloriesPerMinute: 6,
  },
  {
    name: 'Standing Knee Raise',
    slug: 'standing-knee-raise',
    type: 'AI',
    instructions: 'Raise one knee toward your chest, lower it, then alternate sides.',
    targetMuscle: ['core', 'hip flexors'],
    reps: 16,
    postureTips: ['Stay upright', 'Lift with control', 'Avoid leaning back'],
    caloriesPerMinute: 6,
  },
  {
    name: 'Jumping Jack',
    slug: 'jumping-jack',
    type: 'AI',
    instructions: 'Jump feet apart while raising arms overhead, then return to start.',
    targetMuscle: ['full body', 'cardio'],
    reps: null,
    duration: 45,
    postureTips: ['Land softly', 'Keep rhythm steady', 'Arms fully overhead'],
    caloriesPerMinute: 9,
  },
  {
    name: 'Bicep Curl',
    slug: 'bicep-curl',
    type: 'AI',
    instructions: 'Keep elbows close to torso, curl up, and lower slowly.',
    targetMuscle: ['biceps', 'forearms'],
    reps: 12,
    postureTips: ['Avoid swinging', 'Keep wrists neutral', 'Full range each rep'],
    caloriesPerMinute: 5,
  },
  {
    name: 'Crunches',
    slug: 'crunches',
    type: 'non-AI',
    instructions: 'Lie on your back, bend knees, lift shoulder blades off floor, and lower with control.',
    targetMuscle: ['abs'],
    reps: 20,
    postureTips: ['Keep chin tucked', 'Do not pull neck', 'Slow controlled reps'],
    caloriesPerMinute: 5,
  },
  {
    name: 'Plank Hold',
    slug: 'plank-hold',
    type: 'non-AI',
    instructions: 'Hold forearm plank with straight body line and tight core.',
    targetMuscle: ['core', 'shoulders'],
    reps: null,
    duration: 45,
    postureTips: ['Squeeze glutes', 'Neutral neck', 'Do not drop hips'],
    caloriesPerMinute: 4,
  },
];

const workoutSeed = [
  {
    title: 'Abs Starter Burn',
    category: 'abs',
    difficulty: 'beginner',
    duration: 18,
    exercises: [
      { slug: 'standing-knee-raise', reps: 16 },
      { slug: 'crunches', reps: 20 },
      { slug: 'plank-hold', duration: 45 },
    ],
  },
  {
    title: 'Arms Starter Pump',
    category: 'arms',
    difficulty: 'beginner',
    duration: 20,
    exercises: [
      { slug: 'bicep-curl', reps: 12 },
      { slug: 'push-up', reps: 10 },
      { slug: 'shoulder-press', reps: 12 },
    ],
  },
  {
    title: 'Legs Starter Strength',
    category: 'legs',
    difficulty: 'beginner',
    duration: 20,
    exercises: [
      { slug: 'bodyweight-squat', reps: 12 },
      { slug: 'standing-knee-raise', reps: 16 },
      { slug: 'jumping-jack', duration: 45 },
    ],
  },
  {
    title: 'Full Body Starter Circuit',
    category: 'full body',
    difficulty: 'beginner',
    duration: 24,
    exercises: [
      { slug: 'bodyweight-squat', reps: 12 },
      { slug: 'push-up', reps: 10 },
      { slug: 'jumping-jack', duration: 45 },
      { slug: 'plank-hold', duration: 45 },
    ],
  },
];

const upsertExercises = async () => {
  const idBySlug = new Map();

  for (const item of exerciseSeed) {
    const payload = {
      name: item.name,
      slug: item.slug,
      type: item.type,
      instructions: item.instructions,
      targetMuscle: item.targetMuscle,
      reps: item.reps ?? null,
      duration: item.duration ?? null,
      postureTips: item.postureTips,
      caloriesPerMinute: item.caloriesPerMinute,
      isActive: true,
    };

    const exercise = await Exercise.findOneAndUpdate(
      { slug: item.slug },
      { $set: payload },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    idBySlug.set(item.slug, exercise._id);
  }

  return idBySlug;
};

const upsertWorkouts = async (idBySlug) => {
  for (const workout of workoutSeed) {
    const mappedExercises = workout.exercises
      .map((entry, index) => {
        const exerciseId = idBySlug.get(entry.slug);
        if (!exerciseId) {
          return null;
        }

        return {
          exercise: exerciseId,
          order: index + 1,
          reps: entry.reps ?? null,
          duration: entry.duration ?? null,
        };
      })
      .filter(Boolean);

    if (!mappedExercises.length) {
      continue;
    }

    await WorkoutProgram.findOneAndUpdate(
      { title: workout.title },
      {
        $set: {
          title: workout.title,
          category: workout.category,
          difficulty: workout.difficulty,
          duration: workout.duration,
          exercises: mappedExercises,
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  }
};

const run = async () => {
  try {
    await connectDB();

    const idBySlug = await upsertExercises();
    await upsertWorkouts(idBySlug);

    const [exerciseCount, workoutCount] = await Promise.all([
      Exercise.countDocuments({}),
      WorkoutProgram.countDocuments({}),
    ]);

    console.log(`Seed complete. Exercises: ${exerciseCount}, Workouts: ${workoutCount}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // Ignore secondary close error
    }
    process.exit(1);
  }
};

run();
