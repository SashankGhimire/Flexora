import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type BicepCurlPhase = 'up' | 'down';

type BicepCurlState = {
  repCount: number;
  phase: BicepCurlPhase;
  pendingPhase: BicepCurlPhase | null;
  pendingFrames: number;
  lastAngle: number;
  lastProcessedAt: number;
};

export type BicepCurlResult = {
  repCount: number;
  phase: BicepCurlPhase;
  elbowAngle: number;
};

const MIN_CONFIDENCE = 0.3;
const DOWN_THRESHOLD = 70;
const UP_THRESHOLD = 150;
const CONFIRMATION_FRAMES = 2;
const ANALYSIS_INTERVAL_MS = 180;

const MOVENET = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
} as const;

const state: BicepCurlState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  lastAngle: 180,
  lastProcessedAt: 0,
};

const hasConfidence = (point: PoseKeypoint | undefined, threshold: number): point is PoseKeypoint => {
  if (!point) {
    return false;
  }

  if (typeof point.score !== 'number') {
    return false;
  }

  return point.score >= threshold;
};

const computeArmAngle = (
  shoulder: PoseKeypoint | undefined,
  elbow: PoseKeypoint | undefined,
  wrist: PoseKeypoint | undefined
): { angle: number; confidence: number } | null => {
  if (!hasConfidence(shoulder, MIN_CONFIDENCE)) {
    return null;
  }

  if (!hasConfidence(elbow, MIN_CONFIDENCE) || !hasConfidence(wrist, MIN_CONFIDENCE)) {
    return null;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);
  const confidence = (shoulder.score + elbow.score + wrist.score) / 3;

  return {
    angle,
    confidence,
  };
};

const resolvePhaseFromAngle = (elbowAngle: number): BicepCurlPhase | null => {
  if (elbowAngle < DOWN_THRESHOLD) {
    return 'down';
  }

  if (elbowAngle > UP_THRESHOLD) {
    return 'up';
  }

  return null;
};

const applyPhaseTransition = (nextPhase: BicepCurlPhase): void => {
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

  if (state.pendingFrames < CONFIRMATION_FRAMES) {
    return;
  }

  const previousPhase = state.phase;
  state.phase = nextPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  if (previousPhase === 'down' && nextPhase === 'up') {
    state.repCount += 1;
  }
};

const getBestArmAngle = (keypoints: PoseKeypoint[]): number | null => {
  const leftArm = computeArmAngle(
    keypoints[MOVENET.LEFT_SHOULDER],
    keypoints[MOVENET.LEFT_ELBOW],
    keypoints[MOVENET.LEFT_WRIST]
  );

  const rightArm = computeArmAngle(
    keypoints[MOVENET.RIGHT_SHOULDER],
    keypoints[MOVENET.RIGHT_ELBOW],
    keypoints[MOVENET.RIGHT_WRIST]
  );

  if (!leftArm && !rightArm) {
    return null;
  }

  if (!rightArm) {
    return leftArm!.angle;
  }

  if (!leftArm) {
    return rightArm.angle;
  }

  return leftArm.confidence >= rightArm.confidence ? leftArm.angle : rightArm.angle;
};

const toResult = (): BicepCurlResult => ({
  repCount: state.repCount,
  phase: state.phase,
  elbowAngle: state.lastAngle,
});

export const updateBicepCurl = (keypoints: PoseKeypoint[]): BicepCurlResult => {
  const now = Date.now();
  if (now - state.lastProcessedAt < ANALYSIS_INTERVAL_MS) {
    return toResult();
  }
  state.lastProcessedAt = now;

  const angle = getBestArmAngle(keypoints);
  if (angle === null) {
    return toResult();
  }

  state.lastAngle = angle;

  const nextPhase = resolvePhaseFromAngle(angle);
  if (nextPhase) {
    applyPhaseTransition(nextPhase);
  }

  return toResult();
};

export const resetBicepCurlDetector = (): void => {
  state.repCount = 0;
  state.phase = 'up';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.lastAngle = 180;
  state.lastProcessedAt = 0;
};
