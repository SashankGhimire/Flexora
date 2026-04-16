export type AnimationAsset = {
  kind: 'lottie' | 'gif' | 'mp4';
  source: any | null;
};

const normalizeAnimationKey = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/\.json$/i, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const animationAssetMap: Record<string, AnimationAsset> = {
  'jumping_jacks.json': { kind: 'gif', source: require('./media/Jumping Jack.gif') },
  'crunches.json': { kind: 'gif', source: require('./media/Chruncges.gif') },
  'russian_twist.json': { kind: 'gif', source: require('./media/Russian Twist.gif') },
  'mountain_climbers.json': { kind: 'gif', source: require('./media/Mountain Claimbers.gif') },
  'plank.json': { kind: 'gif', source: require('./media/Plank.gif') },
  'arm_circles.json': { kind: 'gif', source: require('./media/Arm Circle.gif') },
  'tricep_dips.json': { kind: 'gif', source: require('./media/Tricep Drip.gif') },
  'incline_pushups.json': { kind: 'mp4', source: require('./media/incline pushup.mp4') },
  'bodyweight_squats.json': { kind: 'mp4', source: require('./media/man-doing-air-squat-exercise-for-legs-animation-gif-download-10520802.mp4') },
  'reverse_lunges.json': { kind: 'mp4', source: require('./media/man-doing-reverse-lunges-alternating-exercise-for-legs-animation-gif-download-10634198.mp4') },
  'high_knees.json': { kind: 'mp4', source: require('./media/man-doing-high-knee-taps-cardio-exercise-animation-gif-download-10520796.mp4') },
  'pushups.json': { kind: 'mp4', source: require('./media/man-doing-pushup-animation-gif-download-11862265.mp4') },
  'glute_bridge.json': { kind: 'mp4', source: require('./media/man-doing-glute-bridge-exercise-for-legs-animation-gif-download-10634179.mp4') },
  'shoulder_taps.json': { kind: 'mp4', source: require('./media/man-doing-shoulder-tap-push-up-exercise-for-chest-and-shoulders-animation-gif-download-10469910.mp4') },
};

const animationAliasMap: Record<string, string> = {
  jumping_jacks: 'jumping_jacks.json',
  jumping_jack: 'jumping_jacks.json',
  jumpingjacks: 'jumping_jacks.json',
  crunches: 'crunches.json',
  russian_twist: 'russian_twist.json',
  russiantwist: 'russian_twist.json',
  mountain_climbers: 'mountain_climbers.json',
  mountainclimbers: 'mountain_climbers.json',
  plank: 'plank.json',
  plank_hold: 'plank.json',
  arm_circles: 'arm_circles.json',
  armcircles: 'arm_circles.json',
  tricep_dips: 'tricep_dips.json',
  tricepdips: 'tricep_dips.json',
  incline_pushups: 'incline_pushups.json',
  inclinepushups: 'incline_pushups.json',
  bodyweight_squats: 'bodyweight_squats.json',
  bodyweight_squat: 'bodyweight_squats.json',
  bodyweightsquats: 'bodyweight_squats.json',
  reverse_lunges: 'reverse_lunges.json',
  reverselunges: 'reverse_lunges.json',
  high_knees: 'high_knees.json',
  highknees: 'high_knees.json',
  pushups: 'pushups.json',
  push_up: 'pushups.json',
  pushup: 'pushups.json',
  glute_bridge: 'glute_bridge.json',
  glutebridge: 'glute_bridge.json',
  shoulder_taps: 'shoulder_taps.json',
  shouldertaps: 'shoulder_taps.json',
};

export const resolveAnimationAsset = (name: string): AnimationAsset => {
  const media = animationAssetMap[name];
  if (media) {
    return media;
  }

  const normalized = normalizeAnimationKey(name);
  const normalizedJsonKey = `${normalized}.json`;
  const aliasKey = animationAliasMap[normalized] || animationAliasMap[normalized.replace(/_/g, '')];
  const normalizedMedia = animationAssetMap[normalizedJsonKey] || (aliasKey ? animationAssetMap[aliasKey] : undefined);
  if (normalizedMedia) {
    return normalizedMedia;
  }

  return {
    kind: 'lottie',
    source: null,
  };
};

export const animationSpeedByType = {
  timer: 1,
  reps: 0.9,
} as const;


