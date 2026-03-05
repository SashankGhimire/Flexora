import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type LungePhase = 'up' | 'down';

type LungeState = {
  repCount: number;
  phase: LungePhase;
  pendingPhase: LungePhase | null;
  pendingFrames: number;
  baselineHipY: number | null;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipDrop: number;
};

export type LungeResult = {
  repCount: number;
  phase: LungePhase;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipDrop: number;
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const DOWN_KNEE_THRESHOLD = 120;
const DOWN_HIP_DROP_THRESHOLD = 0.04;
const UP_KNEE_THRESHOLD = 155;

const MOVENET = {
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

const state: LungeState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  baselineHipY: null,
  leftKneeAngle: 180,
  rightKneeAngle: 180,
  hipDrop: 0,
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const getHipCenterY = (keypoints: PoseKeypoint[]): number | null => {
  const leftHip = keypoints[MOVENET.LEFT_HIP];
  const rightHip = keypoints[MOVENET.RIGHT_HIP];

  if (hasConfidence(leftHip) && hasConfidence(rightHip)) {
    return (leftHip.y + rightHip.y) * 0.5;
  }

  if (hasConfidence(leftHip)) {
    return leftHip.y;
  }

  if (hasConfidence(rightHip)) {
    return rightHip.y;
  }

  return null;
};

const getKneeAngle = (
  keypoints: PoseKeypoint[],
  hipIndex: number,
  kneeIndex: number,
  ankleIndex: number
): number | null => {
  const hip = keypoints[hipIndex];
  const knee = keypoints[kneeIndex];
  const ankle = keypoints[ankleIndex];

  if (!hasConfidence(hip) || !hasConfidence(knee) || !hasConfidence(ankle)) {
    return null;
  }

  return calculateAngle(hip, knee, ankle);
};

const toResult = (): LungeResult => ({
  repCount: state.repCount,
  phase: state.phase,
  leftKneeAngle: state.leftKneeAngle,
  rightKneeAngle: state.rightKneeAngle,
  hipDrop: state.hipDrop,
});

const applyPhaseTransition = (nextPhase: LungePhase, hipCenterY: number): void => {
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

  if (previous === 'down' && nextPhase === 'up') {
    state.repCount += 1;
    state.baselineHipY = hipCenterY;
  }
};

export const updateLunge = (keypoints: PoseKeypoint[]): LungeResult => {
  const leftKneeAngle = getKneeAngle(
    keypoints,
    MOVENET.LEFT_HIP,
    MOVENET.LEFT_KNEE,
    MOVENET.LEFT_ANKLE
  );

  const rightKneeAngle = getKneeAngle(
    keypoints,
    MOVENET.RIGHT_HIP,
    MOVENET.RIGHT_KNEE,
    MOVENET.RIGHT_ANKLE
  );

  const hipCenterY = getHipCenterY(keypoints);

  if (hipCenterY === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  if (state.baselineHipY === null) {
    state.baselineHipY = hipCenterY;
  }

  state.leftKneeAngle = leftKneeAngle ?? 180;
  state.rightKneeAngle = rightKneeAngle ?? 180;

  const frontKneeAngle = Math.min(state.leftKneeAngle, state.rightKneeAngle);
  state.hipDrop = hipCenterY - state.baselineHipY;

  const isDown = frontKneeAngle < DOWN_KNEE_THRESHOLD && state.hipDrop > DOWN_HIP_DROP_THRESHOLD;
  const isUp = frontKneeAngle > UP_KNEE_THRESHOLD;

  if (state.phase === 'up' && isDown) {
    applyPhaseTransition('down', hipCenterY);
  } else if (state.phase === 'down' && isUp) {
    applyPhaseTransition('up', hipCenterY);
  } else {
    state.pendingPhase = null;
    state.pendingFrames = 0;
  }

  return toResult();
};

export const resetLungeDetector = (): void => {
  state.repCount = 0;
  state.phase = 'up';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.baselineHipY = null;
  state.leftKneeAngle = 180;
  state.rightKneeAngle = 180;
  state.hipDrop = 0;
};
