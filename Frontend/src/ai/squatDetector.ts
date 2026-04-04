import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type SquatPhase = 'up' | 'down';
export type SquatViewMode = 'front' | 'side';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type SquatState = {
  repCount: number;
  phase: SquatPhase;
  pendingPhase: SquatPhase | null;
  pendingFrames: number;
  lastProcessedAt: number;
  lastKneeAngle: number;
  baselineHipY: number | null;
  kneeAngleBuffer: number[];
  minKneeAngle: number;
  maxKneeAngle: number;
  lastCompletedRom: number;
  repStartTime: number | null;
  windowMinHipY: number;
  windowMaxHipY: number;
  stabilitySamples: number;
  stabilityPenalty: number;
  totalAccuracy: number;
  scoredReps: number;
  averageAccuracy: number;
  lastRepSpeedSec: number;
  lastSpeedFeedback: RepSpeedFeedback;
};

export type SquatResult = {
  repCount: number;
  phase: SquatPhase;
  kneeAngle: number;
  rom: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

type SquatProfile = {
  goodRomThreshold: number;
  goodHipDrop: number;
  maxKneeSymmetryDelta: number;
  strict: { minAngle: number; rom: number };
  assisted: { minAngle: number; rom: number };
};

type SquatOptions = {
  viewMode?: SquatViewMode;
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const ANALYSIS_INTERVAL_MS = 180;
const KNEE_SMOOTHING_WINDOW = 5;
const HIP_DEPTH_DOWN_THRESHOLD = 0.06;
const HIP_DEPTH_UP_THRESHOLD = 0.02;
const SQUAT_PROFILES: Record<SquatViewMode, SquatProfile> = {
  side: {
    goodRomThreshold: 70,
    goodHipDrop: 0.06,
    maxKneeSymmetryDelta: 20,
    strict: { minAngle: 75, rom: 70 },
    assisted: { minAngle: 95, rom: 50 },
  },
  front: {
    goodRomThreshold: 60,
    goodHipDrop: 0.045,
    maxKneeSymmetryDelta: 28,
    strict: { minAngle: 80, rom: 65 },
    assisted: { minAngle: 100, rom: 48 },
  },
};

const MOVENET = {
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

const state: SquatState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  lastProcessedAt: 0,
  lastKneeAngle: 180,
  baselineHipY: null,
  kneeAngleBuffer: [],
  minKneeAngle: 180,
  maxKneeAngle: 180,
  lastCompletedRom: 0,
  repStartTime: null,
  windowMinHipY: 1,
  windowMaxHipY: 0,
  stabilitySamples: 0,
  stabilityPenalty: 0,
  totalAccuracy: 0,
  scoredReps: 0,
  averageAccuracy: 0,
  lastRepSpeedSec: 0,
  lastSpeedFeedback: 'Controlled',
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const getJointAngle = (
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

const calculateROM = (maxKneeAngle: number, minKneeAngle: number): number => {
  const rom = maxKneeAngle - minKneeAngle;
  return rom > 0 ? rom : 0;
};

const smoothKneeAngle = (angle: number): number => {
  state.kneeAngleBuffer.push(angle);
  if (state.kneeAngleBuffer.length > KNEE_SMOOTHING_WINDOW) {
    state.kneeAngleBuffer.shift();
  }

  let sum = 0;
  for (let index = 0; index < state.kneeAngleBuffer.length; index += 1) {
    sum += state.kneeAngleBuffer[index];
  }

  return state.kneeAngleBuffer.length > 0 ? sum / state.kneeAngleBuffer.length : angle;
};

const resetRepWindow = (startTime: number | null): void => {
  state.repStartTime = startTime;
  state.windowMinHipY = 1;
  state.windowMaxHipY = 0;
  state.stabilitySamples = 0;
  state.stabilityPenalty = 0;
};

const updateAngleRangeByPhase = (kneeAngle: number): void => {
  if (state.phase === 'down' || state.pendingPhase === 'down') {
    state.minKneeAngle = Math.min(state.minKneeAngle, kneeAngle);
    return;
  }

  state.maxKneeAngle = Math.max(state.maxKneeAngle, kneeAngle);
};

const updateRepWindow = (
  kneeAngle: number,
  leftKneeAngle: number,
  rightKneeAngle: number,
  hipCenterY: number | null,
  profile: SquatProfile
): void => {
  if (kneeAngle < state.minKneeAngle) {
    state.minKneeAngle = kneeAngle;
  }

  if (kneeAngle > state.maxKneeAngle) {
    state.maxKneeAngle = kneeAngle;
  }

  if (hipCenterY !== null) {
    if (hipCenterY < state.windowMinHipY) {
      state.windowMinHipY = hipCenterY;
    }
    if (hipCenterY > state.windowMaxHipY) {
      state.windowMaxHipY = hipCenterY;
    }
  }

  state.stabilitySamples += 1;
  const kneeDelta = Math.abs(leftKneeAngle - rightKneeAngle);
  if (kneeDelta > profile.maxKneeSymmetryDelta) {
    state.stabilityPenalty += 1;
  }
};

const scoreRep = (profile: SquatProfile, repSpeed: number): number => {
  const rom = calculateROM(state.maxKneeAngle, state.minKneeAngle);
  const romScore = Math.max(0, Math.min(100, (rom / profile.goodRomThreshold) * 100));

  const hipDrop = state.windowMaxHipY > state.windowMinHipY
    ? state.windowMaxHipY - state.windowMinHipY
    : 0;
  const hipMovementScore = Math.max(0, Math.min(100, (hipDrop / profile.goodHipDrop) * 100));

  const stabilityPenaltyRatio = state.stabilitySamples > 0
    ? state.stabilityPenalty / state.stabilitySamples
    : 0;
  const stabilityScore = Math.max(0, 100 - stabilityPenaltyRatio * 100);

  // Speed feedback
  let speedScore = 70;
  let speedFeedback: RepSpeedFeedback = 'Controlled';
  if (repSpeed < 1.5) {
    speedScore = 40;
    speedFeedback = 'Too fast';
  } else if (repSpeed > 6.0) {
    speedScore = 45;
    speedFeedback = 'Too slow';
  } else if (repSpeed >= 2.5 && repSpeed <= 5.0) {
    speedScore = 100;
    speedFeedback = 'Controlled';
  }

  state.lastRepSpeedSec = repSpeed;
  state.lastSpeedFeedback = speedFeedback;

  const accuracy = romScore * 0.4 + hipMovementScore * 0.3 + stabilityScore * 0.2 + speedScore * 0.1;
  return Math.max(0, Math.min(100, accuracy));
};

const finalizeRep = (profile: SquatProfile, repSpeed: number): void => {
  const rom = calculateROM(state.maxKneeAngle, state.minKneeAngle);
  state.lastCompletedRom = rom;
  
  // Check if rep meets strict or assisted criteria
  const hasStrictRep = 
    state.minKneeAngle <= profile.strict.minAngle &&
    rom >= profile.strict.rom;
  const hasAssistedRep =
    state.minKneeAngle <= profile.assisted.minAngle &&
    rom >= profile.assisted.rom;
  
  if (hasStrictRep || hasAssistedRep) {
    state.repCount += 1;
  }

  const accuracy = scoreRep(profile, repSpeed);
  state.scoredReps += 1;
  state.totalAccuracy += accuracy;
  state.averageAccuracy = state.totalAccuracy / state.scoredReps;
};

const applyPhaseTransition = (
  nextPhase: SquatPhase,
  now: number,
  profile: SquatProfile,
  hipCenterY: number,
  kneeAngle: number
): void => {
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

  if (previous === 'up' && nextPhase === 'down') {
    state.minKneeAngle = kneeAngle;
    state.maxKneeAngle = kneeAngle;
    resetRepWindow(now);
    return;
  }

  if (previous === 'down' && nextPhase === 'up') {
    const repSpeed = state.repStartTime ? (now - state.repStartTime) / 1000 : 0;
    finalizeRep(profile, repSpeed);
    state.maxKneeAngle = kneeAngle;
    state.minKneeAngle = kneeAngle;
    state.baselineHipY = hipCenterY;
    resetRepWindow(null);
  }
};

const resolveNextPhase = (
  currentPhase: SquatPhase,
  hipDepth: number
): SquatPhase | null => {
  if (currentPhase === 'up' && hipDepth > HIP_DEPTH_DOWN_THRESHOLD) {
    return 'down';
  }

  if (currentPhase === 'down' && hipDepth < HIP_DEPTH_UP_THRESHOLD) {
    return 'up';
  }

  return null;
};

const toResult = (): SquatResult => ({
  repCount: state.repCount,
  phase: state.phase,
  kneeAngle: state.lastKneeAngle,
  rom: state.lastCompletedRom,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
});

export const updateSquat = (
  keypoints: PoseKeypoint[],
  options?: SquatOptions
): SquatResult => {
  const viewMode = options?.viewMode ?? 'side';
  const profile = SQUAT_PROFILES[viewMode];

  const now = Date.now();
  if (now - state.lastProcessedAt < ANALYSIS_INTERVAL_MS) {
    return toResult();
  }
  state.lastProcessedAt = now;

  const leftKneeAngle = getJointAngle(
    keypoints,
    MOVENET.LEFT_HIP,
    MOVENET.LEFT_KNEE,
    MOVENET.LEFT_ANKLE
  );

  const rightKneeAngle = getJointAngle(
    keypoints,
    MOVENET.RIGHT_HIP,
    MOVENET.RIGHT_KNEE,
    MOVENET.RIGHT_ANKLE
  );

  if (leftKneeAngle === null && rightKneeAngle === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  const rawBestKneeAngle = Math.min(leftKneeAngle ?? 180, rightKneeAngle ?? 180);
  const bestKneeAngle = smoothKneeAngle(rawBestKneeAngle);
  state.lastKneeAngle = bestKneeAngle;

  const hipCenterY = getHipCenterY(keypoints);
  if (hipCenterY === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  if (state.baselineHipY === null) {
    state.baselineHipY = hipCenterY;
  }

  const hipDepth = hipCenterY - state.baselineHipY;
  const leftForStability = leftKneeAngle ?? bestKneeAngle;
  const rightForStability = rightKneeAngle ?? bestKneeAngle;

  updateAngleRangeByPhase(bestKneeAngle);

  if (state.phase === 'down' || state.pendingPhase === 'down') {
    updateRepWindow(bestKneeAngle, leftForStability, rightForStability, hipCenterY, profile);
  }

  const nextPhase = resolveNextPhase(state.phase, hipDepth);
  if (nextPhase !== null) {
    applyPhaseTransition(nextPhase, now, profile, hipCenterY, bestKneeAngle);
  } else {
    state.pendingPhase = null;
    state.pendingFrames = 0;
  }

  return toResult();
};

export const resetSquatDetector = (): void => {
  state.repCount = 0;
  state.phase = 'up';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.lastProcessedAt = 0;
  state.lastKneeAngle = 180;
  state.baselineHipY = null;
  state.kneeAngleBuffer = [];
  state.minKneeAngle = 180;
  state.maxKneeAngle = 180;
  state.lastCompletedRom = 0;
  state.repStartTime = null;
  state.windowMinHipY = 1;
  state.windowMaxHipY = 0;
  state.stabilitySamples = 0;
  state.stabilityPenalty = 0;
  state.totalAccuracy = 0;
  state.scoredReps = 0;
  state.averageAccuracy = 0;
};


