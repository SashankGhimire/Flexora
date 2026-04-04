import { PoseKeypoint } from './motionIntelligence';

type JumpingJackPhase = 'open' | 'close';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type JumpingJackState = {
  repCount: number;
  phase: JumpingJackPhase;
  pendingPhase: JumpingJackPhase | null;
  pendingFrames: number;
  ankleDistanceBuffer: number[];
  lastAnkleDistance: number;
  repStartTime: number | null;
  lastRepSpeedSec: number;
  lastSpeedFeedback: RepSpeedFeedback;
  maxAnkleDistance: number;
  minAnkleDistance: number;
  totalAccuracy: number;
  completedReps: number;
  averageAccuracy: number;
};

export type JumpingJackResult = {
  repCount: number;
  phase: JumpingJackPhase;
  ankleDistance: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

type JumpingJackProfile = {
  openThreshold: number;
  closeThreshold: number;
  strict: { maxOpen: number; minClose: number };
  assisted: { maxOpen: number; minClose: number };
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const ANKLE_SMOOTHING_WINDOW = 3;
const ARM_Y_OFFSET = 0.05;
const LEGS_OPEN_THRESHOLD = 0.25;
const LEGS_CLOSED_THRESHOLD = 0.15;

const JUMPING_JACK_PROFILES: Record<string, JumpingJackProfile> = {
  default: {
    openThreshold: 0.25,
    closeThreshold: 0.15,
    strict: { maxOpen: 0.35, minClose: 0.1 },
    assisted: { maxOpen: 0.28, minClose: 0.14 },
  },
};

const MOVENET = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

const state: JumpingJackState = {
  repCount: 0,
  phase: 'close',
  pendingPhase: null,
  pendingFrames: 0,
  ankleDistanceBuffer: [],
  lastAnkleDistance: 0,
  repStartTime: null,
  lastRepSpeedSec: 0,
  lastSpeedFeedback: 'Controlled',
  maxAnkleDistance: 0,
  minAnkleDistance: 0.5,
  totalAccuracy: 0,
  completedReps: 0,
  averageAccuracy: 0,
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const smoothAnkleDistance = (distance: number): number => {
  state.ankleDistanceBuffer.push(distance);
  if (state.ankleDistanceBuffer.length > ANKLE_SMOOTHING_WINDOW) {
    state.ankleDistanceBuffer.shift();
  }

  let sum = 0;
  for (let index = 0; index < state.ankleDistanceBuffer.length; index += 1) {
    sum += state.ankleDistanceBuffer[index];
  }

  return state.ankleDistanceBuffer.length > 0 ? sum / state.ankleDistanceBuffer.length : distance;
};

const getSpeedFeedback = (repSpeedSec: number): { score: number; feedback: RepSpeedFeedback } => {
  if (repSpeedSec <= 0) {
    return { score: 0, feedback: 'Controlled' };
  }
  if (repSpeedSec < 0.8) {
    return { score: 40, feedback: 'Too fast' };
  }
  if (repSpeedSec > 3.5) {
    return { score: 45, feedback: 'Too slow' };
  }
  if (repSpeedSec >= 1.2 && repSpeedSec <= 2.8) {
    return { score: 100, feedback: 'Controlled' };
  }
  const score = repSpeedSec < 1.2 ? 75 + ((repSpeedSec - 0.8) / 0.4) * 25 : 75 + ((3.5 - repSpeedSec) / 0.7) * 25;
  return { score: Math.min(100, score), feedback: 'Controlled' };
};

const getAccuracyScore = (ankleRange: number, repSpeed: number): number => {
  const profile = JUMPING_JACK_PROFILES.default;
  const rangeScore = ankleRange >= 0.2 ? 100 : Math.max(0, Math.min(100, (ankleRange / 0.2) * 100));
  const speedResult = getSpeedFeedback(repSpeed);
  return rangeScore * 0.6 + speedResult.score * 0.4;
};

const toResult = (): JumpingJackResult => ({
  repCount: state.repCount,
  phase: state.phase,
  ankleDistance: state.lastAnkleDistance,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
});

const applyPhaseTransition = (nextPhase: JumpingJackPhase): void => {
  if (nextPhase === state.phase) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return;
  }

  if (state.pendingPhase === nextPhase) {
    state.pendingFrames += 1;
  } else {
    state.pendingPhase = nextPhase;
    state.pendingFrames = 1;
  }

  if (state.pendingFrames < PHASE_CONFIRMATION_FRAMES) {
    return;
  }

  const previous = state.phase;
  state.phase = nextPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  if (previous === 'close' && nextPhase === 'open') {
    state.repStartTime = Date.now();
    state.maxAnkleDistance = 0;
    state.minAnkleDistance = 0.5;
    return;
  }

  if (previous === 'open' && nextPhase === 'close' && state.repStartTime !== null) {
    const profile = JUMPING_JACK_PROFILES.default;
    const endTime = Date.now();
    const ankleRange = state.maxAnkleDistance - state.minAnkleDistance;
    const repSpeed = (endTime - state.repStartTime) / 1000;
    const speedResult = getSpeedFeedback(repSpeed);
    const accuracy = getAccuracyScore(ankleRange, repSpeed);

    const hasStrictRep = 
      state.maxAnkleDistance >= profile.strict.maxOpen &&
      state.minAnkleDistance <= profile.strict.minClose;
    const hasAssistedRep =
      state.maxAnkleDistance >= profile.assisted.maxOpen &&
      state.minAnkleDistance <= profile.assisted.minClose;

    if (hasStrictRep || hasAssistedRep) {
      state.repCount += 1;
    }

    state.lastRepSpeedSec = repSpeed;
    state.lastSpeedFeedback = speedResult.feedback;
    state.completedReps += 1;
    state.totalAccuracy += accuracy;
    state.averageAccuracy = state.totalAccuracy / state.completedReps;

    state.repStartTime = null;
  }
};

export const updateJumpingJack = (keypoints: PoseKeypoint[]): JumpingJackResult => {
  const leftShoulder = keypoints[MOVENET.LEFT_SHOULDER];
  const rightShoulder = keypoints[MOVENET.RIGHT_SHOULDER];
  const leftWrist = keypoints[MOVENET.LEFT_WRIST];
  const rightWrist = keypoints[MOVENET.RIGHT_WRIST];
  const leftAnkle = keypoints[MOVENET.LEFT_ANKLE];
  const rightAnkle = keypoints[MOVENET.RIGHT_ANKLE];

  if (
    !hasConfidence(leftShoulder) ||
    !hasConfidence(rightShoulder) ||
    !hasConfidence(leftWrist) ||
    !hasConfidence(rightWrist) ||
    !hasConfidence(leftAnkle) ||
    !hasConfidence(rightAnkle)
  ) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  const leftArmUp = leftWrist.y < leftShoulder.y - ARM_Y_OFFSET;
  const rightArmUp = rightWrist.y < rightShoulder.y - ARM_Y_OFFSET;
  const armsUp = leftArmUp && rightArmUp;

  const armsDown =
    leftWrist.y > leftShoulder.y + ARM_Y_OFFSET &&
    rightWrist.y > rightShoulder.y + ARM_Y_OFFSET;

  const profile = JUMPING_JACK_PROFILES.default;
  const rawAnkleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
  const ankleDistance = smoothAnkleDistance(rawAnkleDistance);
  state.lastAnkleDistance = ankleDistance;

  // Track min/max for ROM
  if (state.phase === 'open' || state.pendingPhase === 'open') {
    if (ankleDistance > state.maxAnkleDistance) {
      state.maxAnkleDistance = ankleDistance;
    }
    if (ankleDistance < state.minAnkleDistance) {
      state.minAnkleDistance = ankleDistance;
    }
  }

  const legsOpen = ankleDistance > profile.openThreshold;
  const legsClosed = ankleDistance < profile.closeThreshold;

  const isOpenPose = armsUp && legsOpen;
  const isClosePose = armsDown && legsClosed;

  if (state.phase === 'close' && isOpenPose) {
    applyPhaseTransition('open');
  } else if (state.phase === 'open' && isClosePose) {
    applyPhaseTransition('close');
  } else {
    state.pendingPhase = null;
    state.pendingFrames = 0;
  }

  return toResult();
};

export const resetJumpingJackDetector = (): void => {
  state.repCount = 0;
  state.phase = 'close';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.ankleDistanceBuffer = [];
  state.lastAnkleDistance = 0;
  state.repStartTime = null;
  state.lastRepSpeedSec = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.maxAnkleDistance = 0;
  state.minAnkleDistance = 0.5;
  state.totalAccuracy = 0;
  state.completedReps = 0;
  state.averageAccuracy = 0;
};


