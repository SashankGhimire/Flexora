export const animationMap: Record<string, any> = {
  'jumping_jacks.json': require('./jumping_jacks.json'),
  'crunches.json': require('./crunches.json'),
  'plank.json': require('./plank.json'),
  'lunges.json': require('./lunges.json'),
  'mountain_climbers.json': require('./mountain_climbers.json'),
  'russian_twist.json': require('./russian_twist.json'),
  'arm_circles.json': require('./arm_circles.json'),
  'tricep_dips.json': require('./tricep_dips.json'),
  'incline_pushups.json': require('./incline_pushups.json'),
  'bodyweight_squats.json': require('./bodyweight_squats.json'),
  'reverse_lunges.json': require('./reverse_lunges.json'),
  'high_knees.json': require('./high_knees.json'),
  'pushups.json': require('./pushups.json'),
  'glute_bridge.json': require('./glute_bridge.json'),
  'shoulder_taps.json': require('./shoulder_taps.json'),
};

export type AnimationAsset = {
  kind: 'lottie' | 'gif' | 'mp4';
  source: any;
};

export const animationAssetMap: Record<string, AnimationAsset> = {
  'jumping_jacks.json': { kind: 'gif', source: require('../../../Animation/Jumping Jack.gif') },
  'crunches.json': { kind: 'gif', source: require('../../../Animation/Chruncges.gif') },
  'russian_twist.json': { kind: 'gif', source: require('../../../Animation/Russian Twist.gif') },
  'mountain_climbers.json': { kind: 'gif', source: require('../../../Animation/Mountain Claimbers.gif') },
  'plank.json': { kind: 'gif', source: require('../../../Animation/Plank.gif') },
  'arm_circles.json': { kind: 'gif', source: require('../../../Animation/Arm Circle.gif') },
  'tricep_dips.json': { kind: 'gif', source: require('../../../Animation/Tricep Drip.gif') },
  'incline_pushups.json': { kind: 'mp4', source: require('../../../Animation/incline pushup.mp4') },
  'bodyweight_squats.json': { kind: 'mp4', source: require('../../../Animation/man-doing-air-squat-exercise-for-legs-animation-gif-download-10520802.mp4') },
  'reverse_lunges.json': { kind: 'mp4', source: require('../../../Animation/man-doing-reverse-lunges-alternating-exercise-for-legs-animation-gif-download-10634198.mp4') },
  'high_knees.json': { kind: 'mp4', source: require('../../../Animation/man-doing-high-knee-taps-cardio-exercise-animation-gif-download-10520796.mp4') },
  'pushups.json': { kind: 'mp4', source: require('../../../Animation/man-doing-pushup-animation-gif-download-11862265.mp4') },
  'glute_bridge.json': { kind: 'mp4', source: require('../../../Animation/man-doing-glute-bridge-exercise-for-legs-animation-gif-download-10634179.mp4') },
  'shoulder_taps.json': { kind: 'mp4', source: require('../../../Animation/man-doing-shoulder-tap-push-up-exercise-for-chest-and-shoulders-animation-gif-download-10469910.mp4') },
};

export const resolveAnimationAsset = (name: string): AnimationAsset => {
  const media = animationAssetMap[name];
  if (media) {
    return media;
  }

  return {
    kind: 'lottie',
    source: animationMap[name],
  };
};

export const animationSpeedByType = {
  timer: 1,
  reps: 0.9,
} as const;
