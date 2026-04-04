import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type LungePhase = 'up' | 'down';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type LungeState = {
  repCount: number;
  phase: LungePhase;
  pendingPhase: LungePhase | null;
  pendingFrames: number;
  baselineHipY: number | null;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipDrop: number;
  maxKneeFlexion: number;
  minKneeFlexion: number;
  lastRom: number;
  lastRomScore: number;
  repStartTime: number | null;
  lastRepSpeedSec: number;
  lastSpeedFeedback: RepSpeedFeedback;
  totalAccuracy: number;
  completedReps: number;
  averageAccuracy: number;
};

export type LungeResult = {
  repCount: number;
  phase: LungePhase;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipDrop: number;
  rom: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

type LungeProfile = {
  downKneeThreshold: number;
  downHipDropThreshold: number;
  upKneeThreshold: number;
  strict: { minKnee: number; hipDrop: number; rom: number };
  assisted: { minKnee: number; hipDrop: number; rom: number };
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const DOWN_KNEE_THRESHOLD = 120;
const DOWN_HIP_DROP_THRESHOLD = 0.04;
const UP_KNEE_THRESHOLD = 155;

const LUNGE_PROFILES: Record<string, LungeProfile> = {
  default: {
    downKneeThreshold: 120,
    downHipDropThreshold: 0.04,
    upKneeThreshold: 155,
    strict: { minKnee: 85, hipDrop: 0.05, rom: 70 },
    assisted: { minKnee: 105, hipDrop: 0.03, rom: 50 },
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

const state: LungeState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  baselineHipY: null,
  leftKneeAngle: 180,
  rightKneeAngle: 180,
  hipDrop: 0,
  maxKneeFlexion: 180,
  minKneeFlexion: 180,
  lastRom: 0,
  lastRomScore: 0,
  repStartTime: null,
  lastRepSpeedSec: 0,
  lastSpeedFeedback: 'Controlled',
  totalAccuracy: 0,
  completedReps: 0,
  averageAccuracy: 0,
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const calculateROM = (maxAngle: number, minAngle: number): number => {
  const rom = maxAngle - minAngle;
  return rom > 0 ? rom : 0;
};

const getSpeedFeedback = (repSpeedSec: number): { score: number; feedback: RepSpeedFeedback } => {
  if (repSpeedSec <= 0) {
    return { score: 0, feedback: 'Controlled' };
  }
  if (repSpeedSec < 1.2) {
    return { score: 40, feedback: 'Too fast' };
  }
  if (repSpeedSec > 5.0) {
    return { score: 45, feedback: 'Too slow' };
  }
  if (repSpeedSec >= 2.0 && repSpeedSec <= 4.0) {
    return { score: 100, feedback: 'Controlled' };
  }
  const score = repSpeedSec < 2.0 ? 75 + ((repSpeedSec - 1.2) / 0.8) * 25 : 75 + ((5.0 - repSpeedSec) / 1.0) * 25;
  return { score: Math.min(100, score), feedback: 'Controlled' };
};

const getRomScore = (rom: number): number => {
  const profile = LUNGE_PROFILES.default;
  return rom >= profile.strict.rom ? 100 : Math.max(0, Math.min(100, (rom / profile.strict.rom) * 100));
};

const calculateAccuracy = (romScore: number, speedScore: number): number => {
  return romScore * 0.6 + speedScore * 0.4;
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
  rom: state.lastRom,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
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

  if (previous === 'up' && nextPhase === 'down') {
    state.repStartTime = Date.now();
    state.maxKneeFlexion = state.leftKneeAngle;
    state.minKneeFlexion = state.leftKneeAngle;
    return;
  }

  if (previous === 'down' && nextPhase === 'up') {
    const profile = LUNGE_PROFILES.default;
    const endTime = Date.now();
    const rom = calculateROM(state.maxKneeFlexion, state.minKneeFlexion);
    const repSpeed = state.repStartTime ? (endTime - state.repStartTime) / 1000 : 0;
    const romScore = getRomScore(rom);
    const speedResult = getSpeedFeedback(repSpeed);
    const repAccuracy = calculateAccuracy(romScore, speedResult.score);

    const hasStrictRep = 
      Math.min(state.leftKneeAngle, state.rightKneeAngle) <= profile.strict.minKnee &&
      state.hipDrop >= profile.strict.hipDrop &&
      rom >= profile.strict.rom;
    const hasAssistedRep =
      Math.min(state.leftKneeAngle, state.rightKneeAngle) <= profile.assisted.minKnee &&
      state.hipDrop >= profile.assisted.hipDrop &&
      rom >= profile.assisted.rom;

    if (hasStrictRep || hasAssistedRep) {
      state.repCount += 1;
    }

    state.lastRom = Math.round(rom);
    state.lastRomScore = romScore;
    state.lastRepSpeedSec = repSpeed;
    state.lastSpeedFeedback = speedResult.feedback;
    state.completedReps += 1;
    state.totalAccuracy += repAccuracy;
    state.averageAccuracy = state.totalAccuracy / state.completedReps;

    state.baselineHipY = hipCenterY;
    state.repStartTime = null;
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

  // Track ROM
  if (state.phase === 'down' || state.pendingPhase === 'down') {
    if (frontKneeAngle > state.maxKneeFlexion) {
      state.maxKneeFlexion = frontKneeAngle;
    }
    if (frontKneeAngle < state.minKneeFlexion) {
      state.minKneeFlexion = frontKneeAngle;
    }
  }

  const profile = LUNGE_PROFILES.default;
  const isDown = frontKneeAngle < profile.downKneeThreshold && state.hipDrop > profile.downHipDropThreshold;
  const isUp = frontKneeAngle > profile.upKneeThreshold;

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
  state.maxKneeFlexion = 180;
  state.minKneeFlexion = 180;
  state.lastRom = 0;
  state.lastRomScore = 0;
  state.repStartTime = null;
  state.lastRepSpeedSec = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.totalAccuracy = 0;
  state.completedReps = 0;
  state.averageAccuracy = 0;
};


