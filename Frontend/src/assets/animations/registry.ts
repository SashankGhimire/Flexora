export type AnimationAsset = {
  kind: 'lottie' | 'gif' | 'mp4';
  source: any | null;
};

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

export const resolveAnimationAsset = (name: string): AnimationAsset => {
  const media = animationAssetMap[name];
  if (media) {
    return media;
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
