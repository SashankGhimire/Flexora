import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type BicepCurlPhase = 'up' | 'down';
export type BicepViewMode = 'front' | 'side';

type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';
type ArmSide = 'left' | 'right';

type BicepCurlState = {
  repCount: number;
  phase: BicepCurlPhase;
  pendingPhase: BicepCurlPhase | null;
  pendingFrames: number;
  lastAngle: number;
  lastProcessedAt: number;
  maxAngle: number;
  minAngle: number;
  repStartTime: number | null;
  lastRepSpeedSec: number;
  lastRom: number;
  totalAccuracy: number;
  completedRepWindows: number;
  averageAccuracy: number;
  stabilitySampleCount: number;
  stabilityPenaltyCount: number;
  lastSpeedFeedback: RepSpeedFeedback;
  smoothedAngle: number;
  activeArm: ArmSide | null;
  activeArmLostFrames: number;
  lastRawAngle: number;
};

export type BicepCurlResult = {
  repCount: number;
  phase: BicepCurlPhase;
  elbowAngle: number;
  rom: number;
  repSpeed: number;
  accuracy: number;
  maxAngle: number;
  minAngle: number;
  speedFeedback: RepSpeedFeedback;
};

type BicepProfile = {
  downEnter: number;
  downExit: number;
  upEnter: number;
  upExit: number;
  elbowDriftThreshold: number;
  strict: {
    maxAngle: number;
    minAngle: number;
    rom: number;
  };
  assisted: {
    maxAngle: number;
    minAngle: number;
    rom: number;
  };
};

type BicepCurlOptions = {
  viewMode?: BicepViewMode;
};

const MIN_CONFIDENCE = 0.2;
const CONFIRMATION_FRAMES = 2;
const ANALYSIS_INTERVAL_MS = 180;
const ANGLE_SMOOTHING_ALPHA = 0.35;
const ARM_STICKY_CONFIDENCE_MARGIN = 0.06;
const ARM_LOST_GRACE_UPDATES = 4;

const BICEP_PROFILES: Record<BicepViewMode, BicepProfile> = {
  side: {
    downEnter: 84,
    downExit: 90,
    upEnter: 128,
    upExit: 120,
    elbowDriftThreshold: 0.16,
    strict: {
      maxAngle: 150,
      minAngle: 70,
      rom: 70,
    },
    assisted: {
      maxAngle: 132,
      minAngle: 90,
      rom: 45,
    },
  },
  front: {
    downEnter: 88,
    downExit: 94,
    upEnter: 122,
    upExit: 114,
    elbowDriftThreshold: 0.2,
    strict: {
      maxAngle: 145,
      minAngle: 75,
      rom: 62,
    },
    assisted: {
      maxAngle: 128,
      minAngle: 95,
      rom: 38,
    },
  },
};

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
  maxAngle: 180,
  minAngle: 180,
  repStartTime: null,
  lastRepSpeedSec: 0,
  lastRom: 0,
  totalAccuracy: 0,
  completedRepWindows: 0,
  averageAccuracy: 0,
  stabilitySampleCount: 0,
  stabilityPenaltyCount: 0,
  lastSpeedFeedback: 'Controlled',
  smoothedAngle: 180,
  activeArm: null,
  activeArmLostFrames: 0,
  lastRawAngle: 180,
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

type ArmObservation = {
  side: ArmSide;
  angle: number;
  confidence: number;
  shoulderX: number;
  elbowX: number;
};

const computeArmAngle = (
  side: ArmSide,
  shoulder: PoseKeypoint | undefined,
  elbow: PoseKeypoint | undefined,
  wrist: PoseKeypoint | undefined
): ArmObservation | null => {
  if (!hasConfidence(shoulder, MIN_CONFIDENCE)) {
    return null;
  }

  if (!hasConfidence(elbow, MIN_CONFIDENCE) || !hasConfidence(wrist, MIN_CONFIDENCE)) {
    return null;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);
  const confidence = (shoulder.score + elbow.score + wrist.score) / 3;

  return {
    side,
    angle,
    confidence,
    shoulderX: shoulder.x,
    elbowX: elbow.x,
  };
};

export const calculateROM = (maxAngle: number, minAngle: number): number => {
  const rom = maxAngle - minAngle;
  return rom > 0 ? rom : 0;
};

export const calculateRepSpeed = (repStartTime: number, repEndTime: number): number => {
  const durationMs = repEndTime - repStartTime;
  if (durationMs <= 0) {
    return 0;
  }
  return durationMs / 1000;
};

export const calculateAccuracy = (
  romScore: number,
  speedScore: number,
  stabilityScore: number
): number => {
  const total = romScore * 0.4 + speedScore * 0.3 + stabilityScore * 0.3;
  return Math.max(0, Math.min(100, total));
};

const smoothAngle = (rawAngle: number): number => {
  const angleDelta = Math.abs(rawAngle - state.smoothedAngle);
  const adaptiveAlpha = angleDelta > 10 ? 0.55 : ANGLE_SMOOTHING_ALPHA;
  state.smoothedAngle = state.smoothedAngle + (rawAngle - state.smoothedAngle) * adaptiveAlpha;
  return state.smoothedAngle;
};

const resolvePhaseFromAngle = (
  elbowAngle: number,
  rawAngle: number,
  profile: BicepProfile
): BicepCurlPhase | null => {
  const downDetected = elbowAngle <= profile.downEnter || rawAngle <= profile.downEnter - 6;
  const upDetected = elbowAngle >= profile.upEnter || rawAngle >= profile.upEnter - 4;

  if (state.phase === 'up') {
    if (downDetected) {
      return 'down';
    }
    return elbowAngle >= profile.upExit || rawAngle >= profile.upExit - 4 ? 'up' : null;
  }

  if (state.phase === 'down') {
    if (upDetected) {
      return 'up';
    }
    return elbowAngle <= profile.downExit || rawAngle <= profile.downExit - 4 ? 'down' : null;
  }

  if (downDetected) {
    return 'down';
  }

  if (upDetected) {
    return 'up';
  }

  return null;
};

const getSpeedScore = (repSpeedSec: number): { score: number; feedback: RepSpeedFeedback } => {
  if (repSpeedSec <= 0) {
    return { score: 0, feedback: 'Controlled' };
  }

  if (repSpeedSec < 0.9) {
    return { score: 30, feedback: 'Too fast' };
  }

  if (repSpeedSec > 4.2) {
    return { score: 40, feedback: 'Too slow' };
  }

  if (repSpeedSec >= 1.2 && repSpeedSec <= 3.5) {
    return { score: 100, feedback: 'Controlled' };
  }

  if (repSpeedSec < 1.2) {
    const score = 75 + ((repSpeedSec - 0.9) / 0.3) * 25;
    return { score, feedback: 'Controlled' };
  }

  const score = 75 + ((4.2 - repSpeedSec) / 0.7) * 25;
  return { score, feedback: 'Controlled' };
};

const getRomScore = (maxAngle: number, minAngle: number, rom: number): number => {
  const maxScore = maxAngle >= 150 ? 100 : Math.max(0, Math.min(100, (maxAngle / 150) * 100));
  const minScore = minAngle <= 70 ? 100 : Math.max(0, Math.min(100, (70 / minAngle) * 100));
  const romScore = rom >= 70 ? 100 : Math.max(0, Math.min(100, (rom / 70) * 100));
  return maxScore * 0.35 + minScore * 0.35 + romScore * 0.3;
};

const getStabilityScore = (): number => {
  if (state.stabilitySampleCount === 0) {
    return 100;
  }

  const penaltyRatio = state.stabilityPenaltyCount / state.stabilitySampleCount;
  const score = 100 - penaltyRatio * 80;
  return Math.max(0, Math.min(100, score));
};

const resetRepWindow = (nextStartTime: number | null): void => {
  state.maxAngle = state.lastAngle;
  state.minAngle = state.lastAngle;
  state.repStartTime = nextStartTime;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
};

const updateRepWindowStats = (
  angle: number,
  shoulderX: number,
  elbowX: number,
  profile: BicepProfile
): void => {
  if (angle > state.maxAngle) {
    state.maxAngle = angle;
  }

  if (angle < state.minAngle) {
    state.minAngle = angle;
  }

  if (state.phase === 'down' || state.pendingPhase === 'down') {
    state.stabilitySampleCount += 1;
    if (Math.abs(elbowX - shoulderX) > profile.elbowDriftThreshold) {
      state.stabilityPenaltyCount += 1;
    }
  }
};

const finalizeRepWindow = (repEndTime: number, profile: BicepProfile): void => {
  const startTime = state.repStartTime;
  if (startTime === null) {
    resetRepWindow(null);
    return;
  }

  const rom = calculateROM(state.maxAngle, state.minAngle);
  const repSpeed = calculateRepSpeed(startTime, repEndTime);
  const romScore = getRomScore(state.maxAngle, state.minAngle, rom);
  const speedResult = getSpeedScore(repSpeed);
  const stabilityScore = getStabilityScore();
  const repAccuracy = calculateAccuracy(romScore, speedResult.score, stabilityScore);

  const hasStrictRep =
    state.maxAngle >= profile.strict.maxAngle &&
    state.minAngle <= profile.strict.minAngle &&
    rom >= profile.strict.rom;
  const hasAssistedRep =
    state.maxAngle >= profile.assisted.maxAngle &&
    state.minAngle <= profile.assisted.minAngle &&
    rom >= profile.assisted.rom;
  const hasGoodRep = hasStrictRep || hasAssistedRep;
  if (hasGoodRep) {
    state.repCount += 1;
  }

  state.lastRom = Math.round(rom);
  state.lastRepSpeedSec = repSpeed;
  state.lastSpeedFeedback = speedResult.feedback;
  state.completedRepWindows += 1;
  state.totalAccuracy += repAccuracy;
  state.averageAccuracy = state.totalAccuracy / state.completedRepWindows;
  resetRepWindow(null);
};

const applyPhaseTransition = (
  nextPhase: BicepCurlPhase,
  now: number,
  profile: BicepProfile
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

  if (state.pendingFrames < CONFIRMATION_FRAMES) {
    return;
  }

  const previousPhase = state.phase;
  state.phase = nextPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  if (previousPhase === 'up' && nextPhase === 'down') {
    resetRepWindow(now);
    return;
  }

  if (previousPhase === 'down' && nextPhase === 'up') {
    finalizeRepWindow(now, profile);
  }
};

const getBestArmAngle = (keypoints: PoseKeypoint[]): ArmObservation | null => {
  const leftArm = computeArmAngle(
    'left',
    keypoints[MOVENET.LEFT_SHOULDER],
    keypoints[MOVENET.LEFT_ELBOW],
    keypoints[MOVENET.LEFT_WRIST]
  );

  const rightArm = computeArmAngle(
    'right',
    keypoints[MOVENET.RIGHT_SHOULDER],
    keypoints[MOVENET.RIGHT_ELBOW],
    keypoints[MOVENET.RIGHT_WRIST]
  );

  if (!leftArm && !rightArm) {
    state.activeArmLostFrames += 1;
    if (state.activeArmLostFrames <= ARM_LOST_GRACE_UPDATES) {
      return {
        side: state.activeArm ?? 'left',
        angle: state.lastRawAngle,
        confidence: MIN_CONFIDENCE,
        shoulderX: 0,
        elbowX: 0,
      };
    }
    state.activeArm = null;
    return null;
  }

  state.activeArmLostFrames = 0;

  if (!rightArm) {
    state.activeArm = leftArm.side;
    return leftArm;
  }

  if (!leftArm) {
    state.activeArm = rightArm.side;
    return rightArm;
  }

  if (state.activeArm === 'left' && leftArm.confidence + ARM_STICKY_CONFIDENCE_MARGIN >= rightArm.confidence) {
    return leftArm;
  }

  if (state.activeArm === 'right' && rightArm.confidence + ARM_STICKY_CONFIDENCE_MARGIN >= leftArm.confidence) {
    return rightArm;
  }

  const selected = leftArm.confidence >= rightArm.confidence ? leftArm : rightArm;
  state.activeArm = selected.side;
  return selected;
};

const toResult = (): BicepCurlResult => ({
  repCount: state.repCount,
  phase: state.phase,
  elbowAngle: state.lastAngle,
  rom: state.lastRom,
  repSpeed: state.lastRepSpeedSec,
  accuracy: state.averageAccuracy,
  maxAngle: state.maxAngle,
  minAngle: state.minAngle,
  speedFeedback: state.lastSpeedFeedback,
});

export const updateBicepCurl = (
  keypoints: PoseKeypoint[],
  options?: BicepCurlOptions
): BicepCurlResult => {
  const viewMode = options?.viewMode ?? 'side';
  const profile = BICEP_PROFILES[viewMode];

  const now = Date.now();
  if (now - state.lastProcessedAt < ANALYSIS_INTERVAL_MS) {
    return toResult();
  }
  state.lastProcessedAt = now;

  const armObservation = getBestArmAngle(keypoints);
  if (armObservation === null) {
    return toResult();
  }

  const angle = smoothAngle(armObservation.angle);
  state.lastRawAngle = armObservation.angle;
  state.lastAngle = angle;
  updateRepWindowStats(angle, armObservation.shoulderX, armObservation.elbowX, profile);

  const nextPhase = resolvePhaseFromAngle(angle, armObservation.angle, profile);
  if (nextPhase) {
    applyPhaseTransition(nextPhase, now, profile);
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
  state.maxAngle = 180;
  state.minAngle = 180;
  state.repStartTime = null;
  state.lastRepSpeedSec = 0;
  state.lastRom = 0;
  state.totalAccuracy = 0;
  state.completedRepWindows = 0;
  state.averageAccuracy = 0;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.smoothedAngle = 180;
  state.activeArm = null;
  state.activeArmLostFrames = 0;
  state.lastRawAngle = 180;
};
