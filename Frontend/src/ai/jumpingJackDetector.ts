import { PoseKeypoint } from './motionIntelligence';

type JumpingJackPhase = 'open' | 'close';

type JumpingJackState = {
  repCount: number;
  phase: JumpingJackPhase;
  pendingPhase: JumpingJackPhase | null;
  pendingFrames: number;
  ankleDistanceBuffer: number[];
  lastAnkleDistance: number;
};

export type JumpingJackResult = {
  repCount: number;
  phase: JumpingJackPhase;
  ankleDistance: number;
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const ANKLE_SMOOTHING_WINDOW = 3;
const ARM_Y_OFFSET = 0.05;
const LEGS_OPEN_THRESHOLD = 0.25;
const LEGS_CLOSED_THRESHOLD = 0.15;

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

const toResult = (): JumpingJackResult => ({
  repCount: state.repCount,
  phase: state.phase,
  ankleDistance: state.lastAnkleDistance,
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

  if (previous === 'open' && nextPhase === 'close') {
    state.repCount += 1;
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

  const rawAnkleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
  const ankleDistance = smoothAnkleDistance(rawAnkleDistance);
  state.lastAnkleDistance = ankleDistance;

  const legsOpen = ankleDistance > LEGS_OPEN_THRESHOLD;
  const legsClosed = ankleDistance < LEGS_CLOSED_THRESHOLD;

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
};
