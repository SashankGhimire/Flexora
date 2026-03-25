import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type BicepCurlPhase = 'up' | 'down';
export type BicepViewMode = 'front' | 'side';

type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';
type ArmSide = 'left' | 'right';

type BicepCurlState = {
  repCount: number;
  initialized: boolean;
  phase: BicepCurlPhase;
  pendingPhase: BicepCurlPhase | null;
  pendingFrames: number;
  pendingRequiredFrames: number;
  lastAngle: number;
  lastProcessedAt: number;
  smoothedFrameDeltaMs: number;
  lastAngleVelocity: number;
  maxAngle: number;
  minAngle: number;
  repStartTime: number | null;
  reachedUpInCurrentCycle: boolean;
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
  recentAngles: number[];
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
  extendedEnter: number;
  extendedExit: number;
  curledEnter: number;
  curledExit: number;
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
const BASE_CONFIRMATION_FRAMES = 2;
const ANALYSIS_INTERVAL_MS = 35;
const ANGLE_SMOOTHING_ALPHA = 0.4;
const FAST_SMOOTHING_ALPHA = 0.72;
const SMOOTHING_WINDOW_SIZE = 3;
const FRAME_TIME_ALPHA = 0.35;
const DEFAULT_FRAME_DELTA_MS = ANALYSIS_INTERVAL_MS;
const MIN_FRAME_DELTA_MS = 28;
const MAX_FRAME_DELTA_MS = 120;
const FAST_MOVEMENT_DEG_PER_SEC = 140;
const SLOW_MOVEMENT_DEG_PER_SEC = 55;
const ANGLE_NOISE_BUFFER_DEG = 3;
const FAST_MOVEMENT_BUFFER_DEG = 6;
const ARM_STICKY_CONFIDENCE_MARGIN = 0.06;
const ARM_LOST_GRACE_UPDATES = 4;

const BICEP_PROFILES: Record<BicepViewMode, BicepProfile> = {
  side: {
    // DOWN = arm extended, UP = arm curled.
    extendedEnter: 148,
    extendedExit: 142,
    curledEnter: 74,
    curledExit: 82,
    elbowDriftThreshold: 0.16,
    strict: {
      maxAngle: 146,
      minAngle: 78,
      rom: 54,
    },
    assisted: {
      maxAngle: 136,
      minAngle: 98,
      rom: 38,
    },
  },
  front: {
    extendedEnter: 146,
    extendedExit: 141,
    curledEnter: 76,
    curledExit: 84,
    elbowDriftThreshold: 0.2,
    strict: {
      maxAngle: 144,
      minAngle: 80,
      rom: 52,
    },
    assisted: {
      maxAngle: 134,
      minAngle: 100,
      rom: 36,
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
  initialized: false,
  phase: 'down',
  pendingPhase: null,
  pendingFrames: 0,
  pendingRequiredFrames: BASE_CONFIRMATION_FRAMES,
  lastAngle: 170,
  lastProcessedAt: 0,
  smoothedFrameDeltaMs: DEFAULT_FRAME_DELTA_MS,
  lastAngleVelocity: 0,
  maxAngle: 170,
  minAngle: 170,
  repStartTime: null,
  reachedUpInCurrentCycle: false,
  lastRepSpeedSec: 0,
  lastRom: 0,
  totalAccuracy: 0,
  completedRepWindows: 0,
  averageAccuracy: 0,
  stabilitySampleCount: 0,
  stabilityPenaltyCount: 0,
  lastSpeedFeedback: 'Controlled',
  smoothedAngle: 170,
  activeArm: null,
  activeArmLostFrames: 0,
  lastRawAngle: 170,
  recentAngles: [],
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
  state.recentAngles.push(rawAngle);
  if (state.recentAngles.length > SMOOTHING_WINDOW_SIZE) {
    state.recentAngles.shift();
  }

  let windowSum = 0;
  for (let i = 0; i < state.recentAngles.length; i += 1) {
    windowSum += state.recentAngles[i];
  }
  const movingAverage = windowSum / state.recentAngles.length;

  const angleDelta = Math.abs(movingAverage - state.smoothedAngle);
  const adaptiveAlpha = angleDelta > 12 ? FAST_SMOOTHING_ALPHA : ANGLE_SMOOTHING_ALPHA;
  state.smoothedAngle = state.smoothedAngle + (movingAverage - state.smoothedAngle) * adaptiveAlpha;
  return state.smoothedAngle;
};

const getRequiredConfirmationFrames = (angleVelocity: number): number => {
  // Confirm very fast movements in 1 frame so rapid reps are not dropped.
  const speed = Math.abs(angleVelocity);
  if (speed >= FAST_MOVEMENT_DEG_PER_SEC) {
    return 1;
  }

  return speed <= SLOW_MOVEMENT_DEG_PER_SEC ? 3 : BASE_CONFIRMATION_FRAMES;
};

const getSmoothedFrameDeltaMs = (rawDeltaMs: number): number => {
  const boundedDeltaMs = Math.max(MIN_FRAME_DELTA_MS, Math.min(MAX_FRAME_DELTA_MS, rawDeltaMs));
  state.smoothedFrameDeltaMs =
    state.smoothedFrameDeltaMs + (boundedDeltaMs - state.smoothedFrameDeltaMs) * FRAME_TIME_ALPHA;
  return state.smoothedFrameDeltaMs;
};

const resolvePhaseFromAngle = (
  elbowAngle: number,
  rawAngle: number,
  angleVelocity: number,
  profile: BicepProfile
): BicepCurlPhase | null => {
  const isFastMovement = Math.abs(angleVelocity) >= FAST_MOVEMENT_DEG_PER_SEC;
  const dynamicBuffer = isFastMovement ? FAST_MOVEMENT_BUFFER_DEG : ANGLE_NOISE_BUFFER_DEG;

  const isCurled =
    elbowAngle <= profile.curledEnter + dynamicBuffer ||
    rawAngle <= profile.curledEnter + dynamicBuffer + 1 ||
    (angleVelocity <= -FAST_MOVEMENT_DEG_PER_SEC && elbowAngle <= profile.curledExit + dynamicBuffer);
  const isExtended =
    elbowAngle >= profile.extendedEnter - dynamicBuffer ||
    rawAngle >= profile.extendedEnter - dynamicBuffer - 1 ||
    (angleVelocity >= FAST_MOVEMENT_DEG_PER_SEC && elbowAngle >= profile.extendedExit - dynamicBuffer);

  if (state.phase === 'down') {
    if (isCurled) {
      return 'up';
    }
    return elbowAngle >= profile.extendedExit - ANGLE_NOISE_BUFFER_DEG ? 'down' : null;
  }

  if (state.phase === 'up') {
    if (isExtended) {
      return 'down';
    }
    return elbowAngle <= profile.curledExit + ANGLE_NOISE_BUFFER_DEG ? 'up' : null;
  }

  if (isExtended) {
    return 'down';
  }

  if (isCurled) {
    return 'up';
  }

  return null;
};

const bootstrapInitialPhase = (angle: number, rawAngle: number, profile: BicepProfile): void => {
  if (state.initialized) {
    return;
  }

  if (angle <= profile.curledExit || rawAngle <= profile.curledExit + 2) {
    state.phase = 'up';
    state.reachedUpInCurrentCycle = true;
    state.repStartTime = Date.now();
  } else {
    state.phase = 'down';
    state.reachedUpInCurrentCycle = false;
    state.repStartTime = Date.now();
  }

  state.initialized = true;
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
  const maxScore = maxAngle >= 146 ? 100 : Math.max(0, Math.min(100, (maxAngle / 146) * 100));
  const minScore = minAngle <= 74 ? 100 : Math.max(0, Math.min(100, (74 / minAngle) * 100));
  const romScore = rom >= 58 ? 100 : Math.max(0, Math.min(100, (rom / 58) * 100));
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
  requiredFrames: number,
  profile: BicepProfile
): void => {
  if (nextPhase === state.phase) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    state.pendingRequiredFrames = BASE_CONFIRMATION_FRAMES;
    return;
  }

  if (state.pendingPhase === nextPhase) {
    state.pendingFrames += 1;
  } else {
    state.pendingPhase = nextPhase;
    state.pendingFrames = 1;
    state.pendingRequiredFrames = requiredFrames;
  }

  if (state.pendingFrames < state.pendingRequiredFrames) {
    return;
  }

  const previousPhase = state.phase;
  state.phase = nextPhase;
  state.pendingPhase = null;
  state.pendingFrames = 0;

  if (previousPhase === 'down' && nextPhase === 'up') {
    if (state.repStartTime === null) {
      resetRepWindow(now);
    }
    state.reachedUpInCurrentCycle = true;
    return;
  }

  if (previousPhase === 'up' && nextPhase === 'down' && state.reachedUpInCurrentCycle) {
    finalizeRepWindow(now, profile);
    state.reachedUpInCurrentCycle = false;
    resetRepWindow(now);
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
  const previousProcessedAt = state.lastProcessedAt;
  if (now - previousProcessedAt < ANALYSIS_INTERVAL_MS) {
    return toResult();
  }
  state.lastProcessedAt = now;

  const armObservation = getBestArmAngle(keypoints);
  if (armObservation === null) {
    return toResult();
  }

  const angle = smoothAngle(armObservation.angle);
  const rawFrameDeltaMs = previousProcessedAt > 0 ? now - previousProcessedAt : DEFAULT_FRAME_DELTA_MS;
  const smoothedFrameDeltaMs = getSmoothedFrameDeltaMs(rawFrameDeltaMs);
  const angleVelocity = ((angle - state.lastAngle) / smoothedFrameDeltaMs) * 1000;

  state.lastRawAngle = armObservation.angle;
  state.lastAngleVelocity = angleVelocity;
  state.lastAngle = angle;

  bootstrapInitialPhase(angle, armObservation.angle, profile);

  if (state.phase === 'down' && state.repStartTime === null) {
    // Arm is at the extended start position; start tracking a potential rep window.
    resetRepWindow(now);
  }

  updateRepWindowStats(angle, armObservation.shoulderX, armObservation.elbowX, profile);

  const nextPhase = resolvePhaseFromAngle(angle, armObservation.angle, angleVelocity, profile);
  if (nextPhase) {
    const requiredFrames = getRequiredConfirmationFrames(angleVelocity);
    applyPhaseTransition(nextPhase, now, requiredFrames, profile);
  }

  return toResult();
};

export const resetBicepCurlDetector = (): void => {
  state.repCount = 0;
  state.initialized = false;
  state.phase = 'down';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.pendingRequiredFrames = BASE_CONFIRMATION_FRAMES;
  state.lastAngle = 170;
  state.lastProcessedAt = 0;
  state.smoothedFrameDeltaMs = DEFAULT_FRAME_DELTA_MS;
  state.lastAngleVelocity = 0;
  state.maxAngle = 170;
  state.minAngle = 170;
  state.repStartTime = null;
  state.reachedUpInCurrentCycle = false;
  state.lastRepSpeedSec = 0;
  state.lastRom = 0;
  state.totalAccuracy = 0;
  state.completedRepWindows = 0;
  state.averageAccuracy = 0;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.smoothedAngle = 170;
  state.activeArm = null;
  state.activeArmLostFrames = 0;
  state.lastRawAngle = 170;
  state.recentAngles = [];
};


