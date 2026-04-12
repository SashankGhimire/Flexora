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
const PHASE_CONFIRMATION_FRAMES = 1;
const ANKLE_SMOOTHING_WINDOW = 3;
const ARM_UP_OFFSET = 0.035;
const ARM_DOWN_OFFSET = 0.005;

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

const getCenterY = (
  left: PoseKeypoint | undefined,
  right: PoseKeypoint | undefined
): number | null => {
  const leftOk = hasConfidence(left);
  const rightOk = hasConfidence(right);

  if (leftOk && rightOk) {
    return (left.y + right.y) * 0.5;
  }

  if (leftOk) {
    return left.y;
  }

  if (rightOk) {
    return right.y;
  }

  return null;
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const getAdaptiveProfile = (shoulderWidth: number): JumpingJackProfile => {
  const safeShoulderWidth = clamp(shoulderWidth, 0.07, 0.26);
  const openThreshold = clamp(safeShoulderWidth * 1.45, 0.13, 0.26);
  const closeThreshold = clamp(safeShoulderWidth * 0.9, 0.08, 0.17);

  return {
    openThreshold,
    closeThreshold,
    strict: {
      maxOpen: clamp(safeShoulderWidth * 1.75, openThreshold + 0.02, 0.32),
      minClose: clamp(safeShoulderWidth * 0.75, 0.06, closeThreshold),
    },
    assisted: {
      maxOpen: clamp(safeShoulderWidth * 1.45, openThreshold, 0.28),
      minClose: clamp(safeShoulderWidth * 0.95, 0.08, 0.18),
    },
  };
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

const getAccuracyScore = (ankleRange: number, repSpeed: number, profile: JumpingJackProfile): number => {
  const targetRange = Math.max(0.1, profile.assisted.maxOpen - profile.assisted.minClose);
  const rangeScore = ankleRange >= targetRange
    ? 100
    : Math.max(0, Math.min(100, (ankleRange / targetRange) * 100));
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

const applyPhaseTransition = (nextPhase: JumpingJackPhase, profile: JumpingJackProfile): void => {
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
    const endTime = Date.now();
    const ankleRange = state.maxAnkleDistance - state.minAnkleDistance;
    const repSpeed = (endTime - state.repStartTime) / 1000;
    const speedResult = getSpeedFeedback(repSpeed);
    const accuracy = getAccuracyScore(ankleRange, repSpeed, profile);

    // Lenient counting: every confirmed open -> close cycle is a rep.
    state.repCount += 1;

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

  const shoulderCenterY = getCenterY(leftShoulder, rightShoulder);
  const wristCenterY = getCenterY(leftWrist, rightWrist);
  const hasLegs = hasConfidence(leftAnkle) && hasConfidence(rightAnkle);

  if (shoulderCenterY === null || wristCenterY === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  const armsUp = wristCenterY < shoulderCenterY - ARM_UP_OFFSET;
  const armsDown = wristCenterY > shoulderCenterY + ARM_DOWN_OFFSET;

  const shoulderWidth = hasConfidence(leftShoulder) && hasConfidence(rightShoulder)
    ? Math.abs(leftShoulder.x - rightShoulder.x)
    : 0.16;
  const profile = getAdaptiveProfile(shoulderWidth);
  const rawAnkleDistance = hasLegs ? Math.abs(leftAnkle.x - rightAnkle.x) : state.lastAnkleDistance;
  const ankleDistance = hasLegs ? smoothAnkleDistance(rawAnkleDistance) : rawAnkleDistance;
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

  const legsOpen = hasLegs ? ankleDistance > profile.openThreshold : true;
  const legsClosed = hasLegs ? ankleDistance < profile.closeThreshold : true;

  // Lenient mode: arm movement alone can drive phases when the lower body is out of frame.
  const isOpenPose = armsUp && (hasLegs ? legsOpen || armsUp : true);
  const isClosePose = armsDown && (hasLegs ? legsClosed || armsDown : true);

  if (state.phase === 'close' && isOpenPose) {
    applyPhaseTransition('open', profile);
  } else if (state.phase === 'open' && isClosePose) {
    applyPhaseTransition('close', profile);
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


