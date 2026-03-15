import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type PushupPhase = 'up' | 'down';

type PushupState = {
  repCount: number;
  phase: PushupPhase;
  pendingPhase: PushupPhase | null;
  pendingFrames: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
};

export type PushupResult = {
  repCount: number;
  phase: PushupPhase;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const DOWN_THRESHOLD = 95;
const UP_THRESHOLD = 150;

const MOVENET = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
} as const;

const state: PushupState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  leftElbowAngle: 180,
  rightElbowAngle: 180,
  avgElbowAngle: 180,
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const getElbowAngle = (
  keypoints: PoseKeypoint[],
  shoulderIndex: number,
  elbowIndex: number,
  wristIndex: number
): number | null => {
  const shoulder = keypoints[shoulderIndex];
  const elbow = keypoints[elbowIndex];
  const wrist = keypoints[wristIndex];

  if (!hasConfidence(shoulder) || !hasConfidence(elbow) || !hasConfidence(wrist)) {
    return null;
  }

  return calculateAngle(shoulder, elbow, wrist);
};

const toResult = (): PushupResult => ({
  repCount: state.repCount,
  phase: state.phase,
  leftElbowAngle: state.leftElbowAngle,
  rightElbowAngle: state.rightElbowAngle,
  avgElbowAngle: state.avgElbowAngle,
});

const applyPhaseTransition = (nextPhase: PushupPhase): void => {
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
  }
};

export const updatePushup = (keypoints: PoseKeypoint[]): PushupResult => {
  const leftElbowAngle = getElbowAngle(
    keypoints,
    MOVENET.LEFT_SHOULDER,
    MOVENET.LEFT_ELBOW,
    MOVENET.LEFT_WRIST
  );

  const rightElbowAngle = getElbowAngle(
    keypoints,
    MOVENET.RIGHT_SHOULDER,
    MOVENET.RIGHT_ELBOW,
    MOVENET.RIGHT_WRIST
  );

  if (leftElbowAngle === null || rightElbowAngle === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  state.leftElbowAngle = leftElbowAngle;
  state.rightElbowAngle = rightElbowAngle;
  state.avgElbowAngle = (leftElbowAngle + rightElbowAngle) * 0.5;

  const isDown = state.avgElbowAngle < DOWN_THRESHOLD;
  const isUp = state.avgElbowAngle > UP_THRESHOLD;

  if (state.phase === 'up' && isDown) {
    applyPhaseTransition('down');
  } else if (state.phase === 'down' && isUp) {
    applyPhaseTransition('up');
  } else {
    state.pendingPhase = null;
    state.pendingFrames = 0;
  }

  return toResult();
};

export const resetPushupDetector = (): void => {
  state.repCount = 0;
  state.phase = 'up';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.leftElbowAngle = 180;
  state.rightElbowAngle = 180;
  state.avgElbowAngle = 180;
};


