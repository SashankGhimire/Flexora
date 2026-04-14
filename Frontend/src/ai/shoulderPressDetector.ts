import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type ShoulderPressPhase = 'up' | 'down';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type ShoulderPressState = {
  repCount: number;
  phase: ShoulderPressPhase;
  pendingPhase: ShoulderPressPhase | null;
  pendingFrames: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
  maxElbowAngle: number;
  minElbowAngle: number;
  lastRom: number;
  repStartTime: number | null;
  reachedUpInCurrentCycle: boolean;
  lastRepSpeedSec: number;
  lastSpeedFeedback: RepSpeedFeedback;
  totalAccuracy: number;
  completedRepWindows: number;
  averageAccuracy: number;
  stabilitySampleCount: number;
  stabilityPenaltyCount: number;
};

export type ShoulderPressResult = {
  repCount: number;
  phase: ShoulderPressPhase;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
  rom: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

type ShoulderPressProfile = {
  upEnter: number;
  upExit: number;
  downEnter: number;
  downExit: number;
  strict: { maxAngle: number; minAngle: number; rom: number };
  assisted: { maxAngle: number; minAngle: number; rom: number };
};

const MIN_CONFIDENCE = 0.2;
const BASE_CONFIRMATION_FRAMES = 2;
const FAST_CONFIRMATION_DEG = 130;
const STABILITY_DELTA_THRESHOLD = 18;

const PROFILE: ShoulderPressProfile = {
  upEnter: 156,
  upExit: 150,
  downEnter: 102,
  downExit: 108,
  strict: { maxAngle: 162, minAngle: 92, rom: 58 },
  assisted: { maxAngle: 152, minAngle: 105, rom: 42 },
};

const MOVENET = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
} as const;

const state: ShoulderPressState = {
  repCount: 0,
  phase: 'down',
  pendingPhase: null,
  pendingFrames: 0,
  leftElbowAngle: 180,
  rightElbowAngle: 180,
  avgElbowAngle: 180,
  maxElbowAngle: 180,
  minElbowAngle: 180,
  lastRom: 0,
  repStartTime: null,
  reachedUpInCurrentCycle: false,
  lastRepSpeedSec: 0,
  lastSpeedFeedback: 'Controlled',
  totalAccuracy: 0,
  completedRepWindows: 0,
  averageAccuracy: 0,
  stabilitySampleCount: 0,
  stabilityPenaltyCount: 0,
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

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const calculateROM = (maxAngle: number, minAngle: number): number => {
  const rom = maxAngle - minAngle;
  return rom > 0 ? rom : 0;
};

const getSpeedScore = (repSpeedSec: number): { score: number; feedback: RepSpeedFeedback } => {
  if (repSpeedSec <= 0) {
    return { score: 0, feedback: 'Controlled' };
  }

  if (repSpeedSec < 0.8) {
    return { score: 35, feedback: 'Too fast' };
  }

  if (repSpeedSec > 4.8) {
    return { score: 45, feedback: 'Too slow' };
  }

  if (repSpeedSec >= 1.4 && repSpeedSec <= 3.4) {
    return { score: 100, feedback: 'Controlled' };
  }

  return { score: 75, feedback: 'Controlled' };
};

const getRomScore = (maxAngle: number, minAngle: number, rom: number): number => {
  const strict =
    maxAngle >= PROFILE.strict.maxAngle &&
    minAngle <= PROFILE.strict.minAngle &&
    rom >= PROFILE.strict.rom;

  if (strict) {
    return 100;
  }

  const assisted =
    maxAngle >= PROFILE.assisted.maxAngle &&
    minAngle <= PROFILE.assisted.minAngle &&
    rom >= PROFILE.assisted.rom;

  if (assisted) {
    return 82;
  }

  return clamp((rom / PROFILE.strict.rom) * 72, 0, 72);
};

const getStabilityScore = (): number => {
  if (state.stabilitySampleCount <= 0) {
    return 100;
  }

  const penaltyRatio = state.stabilityPenaltyCount / state.stabilitySampleCount;
  return clamp(100 - penaltyRatio * 85, 0, 100);
};

const getRequiredConfirmationFrames = (): number => {
  const elbowVelocity = Math.abs(state.avgElbowAngle - state.leftElbowAngle);
  return elbowVelocity > FAST_CONFIRMATION_DEG ? 1 : BASE_CONFIRMATION_FRAMES;
};

const resolvePhase = (avgElbowAngle: number): ShoulderPressPhase | null => {
  if (state.phase === 'down') {
    if (avgElbowAngle >= PROFILE.upEnter) return 'up';
    if (avgElbowAngle <= PROFILE.downExit) return 'down';
    return null;
  }

  if (avgElbowAngle <= PROFILE.downEnter) return 'down';
  if (avgElbowAngle >= PROFILE.upExit) return 'up';
  return null;
};

const toResult = (): ShoulderPressResult => ({
  repCount: state.repCount,
  phase: state.phase,
  leftElbowAngle: state.leftElbowAngle,
  rightElbowAngle: state.rightElbowAngle,
  avgElbowAngle: state.avgElbowAngle,
  rom: state.lastRom,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
});

const finalizeRepIfComplete = (now: number): void => {
  const rom = calculateROM(state.maxElbowAngle, state.minElbowAngle);
  state.lastRom = Math.round(rom);

  const repSpeed = state.repStartTime ? (now - state.repStartTime) / 1000 : 0;
  const speedResult = getSpeedScore(repSpeed);
  const romScore = getRomScore(state.maxElbowAngle, state.minElbowAngle, rom);
  const stabilityScore = getStabilityScore();
  const accuracy = clamp(romScore * 0.4 + speedResult.score * 0.3 + stabilityScore * 0.3, 0, 100);

  const hasCountableRep =
    state.maxElbowAngle >= PROFILE.assisted.maxAngle &&
    state.minElbowAngle <= PROFILE.assisted.minAngle &&
    rom >= PROFILE.assisted.rom;

  if (hasCountableRep && state.reachedUpInCurrentCycle) {
    state.repCount += 1;
  }

  state.lastRepSpeedSec = repSpeed;
  state.lastSpeedFeedback = speedResult.feedback;
  state.completedRepWindows += 1;
  state.totalAccuracy += accuracy;
  state.averageAccuracy = state.totalAccuracy / state.completedRepWindows;

  state.maxElbowAngle = state.avgElbowAngle;
  state.minElbowAngle = state.avgElbowAngle;
  state.repStartTime = null;
  state.reachedUpInCurrentCycle = false;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
};

export const updateShoulderPress = (keypoints: PoseKeypoint[]): ShoulderPressResult => {
  const leftElbow = getElbowAngle(keypoints, MOVENET.LEFT_SHOULDER, MOVENET.LEFT_ELBOW, MOVENET.LEFT_WRIST);
  const rightElbow = getElbowAngle(keypoints, MOVENET.RIGHT_SHOULDER, MOVENET.RIGHT_ELBOW, MOVENET.RIGHT_WRIST);

  if (leftElbow === null && rightElbow === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  state.leftElbowAngle = leftElbow ?? state.leftElbowAngle;
  state.rightElbowAngle = rightElbow ?? state.rightElbowAngle;

  const avgElbow =
    leftElbow !== null && rightElbow !== null
      ? (leftElbow + rightElbow) * 0.5
      : leftElbow ?? rightElbow ?? state.avgElbowAngle;

  state.avgElbowAngle = avgElbow;
  state.maxElbowAngle = Math.max(state.maxElbowAngle, avgElbow);
  state.minElbowAngle = Math.min(state.minElbowAngle, avgElbow);

  if (leftElbow !== null && rightElbow !== null) {
    state.stabilitySampleCount += 1;
    if (Math.abs(leftElbow - rightElbow) > STABILITY_DELTA_THRESHOLD) {
      state.stabilityPenaltyCount += 1;
    }
  }

  const nextPhase = resolvePhase(avgElbow);
  if (nextPhase === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  if (nextPhase === state.phase) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  if (state.pendingPhase === nextPhase) {
    state.pendingFrames += 1;
  } else {
    state.pendingPhase = nextPhase;
    state.pendingFrames = 1;
  }

  const requiredFrames = getRequiredConfirmationFrames();
  if (state.pendingFrames < requiredFrames) {
    return toResult();
  }

  const previous = state.phase;
  state.phase = nextPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  const now = Date.now();

  if (previous === 'down' && nextPhase === 'up') {
    state.reachedUpInCurrentCycle = true;
    if (state.repStartTime === null) {
      state.repStartTime = now;
    }
  }

  if (previous === 'up' && nextPhase === 'down') {
    finalizeRepIfComplete(now);
  }

  return toResult();
};

export const resetShoulderPressDetector = (): void => {
  state.repCount = 0;
  state.phase = 'down';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.leftElbowAngle = 180;
  state.rightElbowAngle = 180;
  state.avgElbowAngle = 180;
  state.maxElbowAngle = 180;
  state.minElbowAngle = 180;
  state.lastRom = 0;
  state.repStartTime = null;
  state.reachedUpInCurrentCycle = false;
  state.lastRepSpeedSec = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.totalAccuracy = 0;
  state.completedRepWindows = 0;
  state.averageAccuracy = 0;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
};
