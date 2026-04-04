import { calculateAngle, PoseKeypoint } from './motionIntelligence';

type PushupPhase = 'up' | 'down';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type PushupState = {
  repCount: number;
  phase: PushupPhase;
  pendingPhase: PushupPhase | null;
  pendingFrames: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
  maxElbowAngle: number;
  minElbowAngle: number;
  lastRom: number;
  repStartTime: number | null;
  lastRepSpeedSec: number;
  lastSpeedFeedback: RepSpeedFeedback;
  totalAccuracy: number;
  completedReps: number;
  averageAccuracy: number;
  stabilitySampleCount: number;
  stabilityPenaltyCount: number;
  recentAngles: number[];
};

export type PushupResult = {
  repCount: number;
  phase: PushupPhase;
  leftElbowAngle: number;
  rightElbowAngle: number;
  avgElbowAngle: number;
  rom: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

type PushupProfile = {
  downThreshold: number;
  upThreshold: number;
  strict: { maxAngle: number; minAngle: number; rom: number };
  assisted: { maxAngle: number; minAngle: number; rom: number };
};

const MIN_CONFIDENCE = 0.25;
const PHASE_CONFIRMATION_FRAMES = 2;
const ANGLE_SMOOTHING_ALPHA = 0.4;
const SMOOTHING_WINDOW_SIZE = 3;

// Enhanced thresholds for proper pushup form
const PUSHUP_PROFILES: Record<string, PushupProfile> = {
  default: {
    downThreshold: 95,
    upThreshold: 150,
    strict: { maxAngle: 165, minAngle: 70, rom: 85 },
    assisted: { maxAngle: 155, minAngle: 85, rom: 60 },
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

const state: PushupState = {
  repCount: 0,
  phase: 'up',
  pendingPhase: null,
  pendingFrames: 0,
  leftElbowAngle: 180,
  rightElbowAngle: 180,
  avgElbowAngle: 180,
  maxElbowAngle: 180,
  minElbowAngle: 180,
  lastRom: 0,
  repStartTime: null,
  lastRepSpeedSec: 0,
  lastSpeedFeedback: 'Controlled',
  totalAccuracy: 0,
  completedReps: 0,
  averageAccuracy: 0,
  stabilitySampleCount: 0,
  stabilityPenaltyCount: 0,
  recentAngles: [],
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const calculateROM = (maxAngle: number, minAngle: number): number => {
  const rom = maxAngle - minAngle;
  return rom > 0 ? rom : 0;
};

const calculateRepSpeed = (startTime: number, endTime: number): number => {
  const durationMs = endTime - startTime;
  return durationMs > 0 ? durationMs / 1000 : 0;
};

const getSpeedScore = (repSpeedSec: number): { score: number; feedback: RepSpeedFeedback } => {
  if (repSpeedSec <= 0) {
    return { score: 0, feedback: 'Controlled' };
  }
  if (repSpeedSec < 1.0) {
    return { score: 35, feedback: 'Too fast' };
  }
  if (repSpeedSec > 4.0) {
    return { score: 45, feedback: 'Too slow' };
  }
  if (repSpeedSec >= 1.5 && repSpeedSec <= 3.5) {
    return { score: 100, feedback: 'Controlled' };
  }
  const score = repSpeedSec < 1.5 ? 75 + ((repSpeedSec - 1.0) / 0.5) * 25 : 75 + ((4.0 - repSpeedSec) / 0.5) * 25;
  return { score: Math.min(100, score), feedback: 'Controlled' };
};

const getRomScore = (maxAngle: number, minAngle: number, rom: number): number => {
  const maxScore = maxAngle >= 165 ? 100 : Math.max(0, Math.min(100, (maxAngle / 165) * 100));
  const minScore = minAngle <= 70 ? 100 : Math.max(0, Math.min(100, (70 / minAngle) * 100));
  const romScore = rom >= 85 ? 100 : Math.max(0, Math.min(100, (rom / 85) * 100));
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

const calculateAccuracy = (romScore: number, speedScore: number, stabilityScore: number): number => {
  const total = romScore * 0.4 + speedScore * 0.3 + stabilityScore * 0.3;
  return Math.max(0, Math.min(100, total));
};

const smoothAngle = (rawAngle: number): number => {
  state.recentAngles.push(rawAngle);
  if (state.recentAngles.length > SMOOTHING_WINDOW_SIZE) {
    state.recentAngles.shift();
  }
  let sum = 0;
  for (let i = 0; i < state.recentAngles.length; i += 1) {
    sum += state.recentAngles[i];
  }
  const average = sum / state.recentAngles.length;
  return average;
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
  rom: state.lastRom,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
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
    if (state.repStartTime === null) {
      state.repStartTime = Date.now();
    }
    return;
  }

  if (previous === 'up' && nextPhase === 'down' && state.repStartTime !== null) {
    const endTime = Date.now();
    const profile = PUSHUP_PROFILES.default;
    
    const rom = calculateROM(state.maxElbowAngle, state.minElbowAngle);
    const repSpeed = calculateRepSpeed(state.repStartTime, endTime);
    const romScore = getRomScore(state.maxElbowAngle, state.minElbowAngle, rom);
    const speedResult = getSpeedScore(repSpeed);
    const stabilityScore = getStabilityScore();
    const repAccuracy = calculateAccuracy(romScore, speedResult.score, stabilityScore);

    const hasStrictRep = 
      state.maxElbowAngle >= profile.strict.maxAngle &&
      state.minElbowAngle <= profile.strict.minAngle &&
      rom >= profile.strict.rom;
    const hasAssistedRep =
      state.maxElbowAngle >= profile.assisted.maxAngle &&
      state.minElbowAngle <= profile.assisted.minAngle &&
      rom >= profile.assisted.rom;
    
    if (hasStrictRep || hasAssistedRep) {
      state.repCount += 1;
    }

    state.lastRom = Math.round(rom);
    state.lastRepSpeedSec = repSpeed;
    state.lastSpeedFeedback = speedResult.feedback;
    state.completedReps += 1;
    state.totalAccuracy += repAccuracy;
    state.averageAccuracy = state.totalAccuracy / state.completedReps;

    // Reset for next rep
    state.maxElbowAngle = state.avgElbowAngle;
    state.minElbowAngle = state.avgElbowAngle;
    state.repStartTime = null;
    state.stabilitySampleCount = 0;
    state.stabilityPenaltyCount = 0;
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
  state.avgElbowAngle = smoothAngle((leftElbowAngle + rightElbowAngle) * 0.5);

  // Track ROM
  if (state.avgElbowAngle > state.maxElbowAngle) {
    state.maxElbowAngle = state.avgElbowAngle;
  }
  if (state.avgElbowAngle < state.minElbowAngle) {
    state.minElbowAngle = state.avgElbowAngle;
  }

  if (state.phase === 'up') {
    state.stabilitySampleCount += 1;
  }

  const isDown = state.avgElbowAngle < PUSHUP_PROFILES.default.downThreshold;
  const isUp = state.avgElbowAngle > PUSHUP_PROFILES.default.upThreshold;

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
  state.maxElbowAngle = 180;
  state.minElbowAngle = 180;
  state.lastRom = 0;
  state.repStartTime = null;
  state.lastRepSpeedSec = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.totalAccuracy = 0;
  state.completedReps = 0;
  state.averageAccuracy = 0;
  state.stabilitySampleCount = 0;
  state.stabilityPenaltyCount = 0;
  state.recentAngles = [];
};


