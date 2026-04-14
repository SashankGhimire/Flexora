import { ExerciseType } from '../types';
import { getKeypoint, JointAngles, PoseKeypoint } from './motionIntelligence';

const MIN_SCORE = 0.3;
const PHASE_CONFIRMATION_FRAMES = 2;

type RepPhase = 'up' | 'down' | 'open' | 'close' | 'hold' | 'bad posture';

type CounterState = {
  phase: RepPhase;
  repCount: number;
  pendingPhase: RepPhase | null;
  pendingFrames: number;
};

type CounterResult = {
  repCount: number;
  phase: RepPhase;
};

const states: Record<ExerciseType, CounterState> = {
  squat: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
  pushup: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
  shoulderPress: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
  jumpingJack: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
  standingKneeRaise: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
  bicepCurl: { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 },
};

const averagePair = (first: number | null, second: number | null): number | null => {
  const hasFirst = typeof first === 'number' && Number.isFinite(first);
  const hasSecond = typeof second === 'number' && Number.isFinite(second);

  if (hasFirst && hasSecond) {
    return ((first as number) + (second as number)) * 0.5;
  }

  if (hasFirst) {
    return first as number;
  }

  if (hasSecond) {
    return second as number;
  }

  return null;
};

const getStandingKneeRaisePhase = (keypoints: PoseKeypoint[]): RepPhase => {
  const leftShoulder = getKeypoint(keypoints, 5, MIN_SCORE);
  const rightShoulder = getKeypoint(keypoints, 6, MIN_SCORE);
  const leftHip = getKeypoint(keypoints, 11, MIN_SCORE);
  const rightHip = getKeypoint(keypoints, 12, MIN_SCORE);
  const leftKnee = getKeypoint(keypoints, 13, MIN_SCORE);
  const rightKnee = getKeypoint(keypoints, 14, MIN_SCORE);

  const shoulderCenterY =
    leftShoulder && rightShoulder
      ? (leftShoulder.y + rightShoulder.y) * 0.5
      : leftShoulder?.y ?? rightShoulder?.y;

  const hipCenterY =
    leftHip && rightHip
      ? (leftHip.y + rightHip.y) * 0.5
      : leftHip?.y ?? rightHip?.y;

  if (hipCenterY === undefined || shoulderCenterY === undefined) {
    return 'hold';
  }

  const leftLift = leftKnee ? hipCenterY - leftKnee.y : 0;
  const rightLift = rightKnee ? hipCenterY - rightKnee.y : 0;
  const maxLift = Math.max(leftLift, rightLift);
  const torsoSpan = Math.max(0.08, hipCenterY - shoulderCenterY);
  const liftRatio = maxLift / torsoSpan;

  if (liftRatio > 0.24) {
    return 'up';
  }

  if (liftRatio < 0.12) {
    return 'down';
  }

  return 'hold';
};

const getJumpingJackPhase = (keypoints: PoseKeypoint[]): RepPhase => {
  const leftWrist = getKeypoint(keypoints, 9, MIN_SCORE);
  const rightWrist = getKeypoint(keypoints, 10, MIN_SCORE);
  const leftShoulder = getKeypoint(keypoints, 5, MIN_SCORE);
  const rightShoulder = getKeypoint(keypoints, 6, MIN_SCORE);
  const leftAnkle = getKeypoint(keypoints, 15, MIN_SCORE);
  const rightAnkle = getKeypoint(keypoints, 16, MIN_SCORE);

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !leftAnkle || !rightAnkle) {
    return 'hold';
  }

  const wristsY = (leftWrist.y + rightWrist.y) * 0.5;
  const shouldersY = (leftShoulder.y + rightShoulder.y) * 0.5;
  const anklesDistance = Math.abs(leftAnkle.x - rightAnkle.x);

  if (wristsY < shouldersY && anklesDistance > 0.22) {
    return 'open';
  }

  if (wristsY > shouldersY && anklesDistance < 0.16) {
    return 'close';
  }

  return 'hold';
};

const getDesiredPhase = (
  exerciseType: ExerciseType,
  angles: JointAngles,
  keypoints: PoseKeypoint[]
): RepPhase => {
  const elbowAvg = averagePair(angles.leftElbow, angles.rightElbow);
  const kneeAvg = averagePair(angles.leftKnee, angles.rightKnee);

  if (exerciseType === 'bicepCurl') {
    if (elbowAvg === null) return 'hold';
    if (elbowAvg < 70) return 'down';
    if (elbowAvg > 150) return 'up';
    return 'hold';
  }

  if (exerciseType === 'squat') {
    if (kneeAvg === null) return 'hold';
    if (kneeAvg < 100) return 'down';
    if (kneeAvg > 160) return 'up';
    return 'hold';
  }

  if (exerciseType === 'pushup') {
    if (elbowAvg === null) return 'hold';
    if (elbowAvg < 95) return 'down';
    if (elbowAvg > 155) return 'up';
    return 'hold';
  }

  if (exerciseType === 'shoulderPress') {
    if (elbowAvg === null) return 'hold';
    if (elbowAvg < 102) return 'down';
    if (elbowAvg > 156) return 'up';
    return 'hold';
  }

  if (exerciseType === 'jumpingJack') {
    return getJumpingJackPhase(keypoints);
  }

  return getStandingKneeRaisePhase(keypoints);
};

const countsRep = (exerciseType: ExerciseType, fromPhase: RepPhase, toPhase: RepPhase): boolean => {
  if (exerciseType === 'jumpingJack') {
    return fromPhase === 'open' && toPhase === 'close';
  }

  return fromPhase === 'down' && toPhase === 'up';
};

const applyPhaseStateMachine = (
  exerciseType: ExerciseType,
  desiredPhase: RepPhase
): CounterResult => {
  const state = states[exerciseType];

  if (desiredPhase === state.phase) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return { repCount: state.repCount, phase: state.phase };
  }

  if (state.pendingPhase === desiredPhase) {
    state.pendingFrames += 1;
  } else {
    state.pendingPhase = desiredPhase;
    state.pendingFrames = 1;
  }

  const requiredFrames = exerciseType === 'standingKneeRaise' ? 1 : PHASE_CONFIRMATION_FRAMES;

  if (state.pendingFrames < requiredFrames) {
    return { repCount: state.repCount, phase: state.phase };
  }

  const previousPhase = state.phase;
  state.phase = desiredPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  if (countsRep(exerciseType, previousPhase, state.phase)) {
    state.repCount += 1;
  }

  return { repCount: state.repCount, phase: state.phase };
};

export const updateRepCounter = (
  exerciseType: ExerciseType,
  angles: JointAngles,
  keypoints: PoseKeypoint[]
): CounterResult => {
  const desiredPhase = getDesiredPhase(exerciseType, angles, keypoints);
  return applyPhaseStateMachine(exerciseType, desiredPhase);
};

export const resetRepCounter = (exerciseType?: ExerciseType): void => {
  if (exerciseType) {
    states[exerciseType] = { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 };
    return;
  }

  const keys = Object.keys(states) as ExerciseType[];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    states[key] = { phase: 'hold', repCount: 0, pendingPhase: null, pendingFrames: 0 };
  }
};


