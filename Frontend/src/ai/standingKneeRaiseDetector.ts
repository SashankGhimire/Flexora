import { PoseKeypoint } from './motionIntelligence';

type KneeRaisePhase = 'up' | 'down';
type RepSpeedFeedback = 'Too fast' | 'Too slow' | 'Controlled';

type KneeRaiseState = {
  repCount: number;
  phase: KneeRaisePhase;
  pendingPhase: KneeRaisePhase | null;
  pendingFrames: number;
  smoothedLift: number;
  lastLift: number;
  lastTimestamp: number | null;
  repStartAt: number | null;
  lastRepAt: number;
  peakLift: number;
  totalAccuracy: number;
  completedReps: number;
  averageAccuracy: number;
  stabilitySamples: number;
  stabilityPenalty: number;
  lastSpeedFeedback: RepSpeedFeedback;
  downBaselineLift: number;
};

export type StandingKneeRaiseResult = {
  repCount: number;
  phase: KneeRaisePhase;
  lift: number;
  accuracy: number;
  speedFeedback: RepSpeedFeedback;
};

const MIN_CONFIDENCE = 0.06;
const BASE_CONFIRMATION_FRAMES = 1;
const FAST_MOVEMENT_VELOCITY = 0.16;
const MIN_REP_DURATION_MS = 85;
const REP_COOLDOWN_MS = 70;

const state: KneeRaiseState = {
  repCount: 0,
  phase: 'down',
  pendingPhase: null,
  pendingFrames: 0,
  smoothedLift: 0,
  lastLift: 0,
  lastTimestamp: null,
  repStartAt: null,
  lastRepAt: 0,
  peakLift: 0,
  totalAccuracy: 0,
  completedReps: 0,
  averageAccuracy: 0,
  stabilitySamples: 0,
  stabilityPenalty: 0,
  lastSpeedFeedback: 'Controlled',
  downBaselineLift: 0,
};

const hasConfidence = (point: PoseKeypoint | undefined): point is PoseKeypoint => {
  return !!point && typeof point.score === 'number' && point.score >= MIN_CONFIDENCE;
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const toResult = (): StandingKneeRaiseResult => ({
  repCount: state.repCount,
  phase: state.phase,
  lift: state.smoothedLift,
  accuracy: state.averageAccuracy,
  speedFeedback: state.lastSpeedFeedback,
});

export const updateStandingKneeRaise = (keypoints: PoseKeypoint[]): StandingKneeRaiseResult => {
  const leftShoulder = keypoints[5];
  const rightShoulder = keypoints[6];
  const leftHip = keypoints[11];
  const rightHip = keypoints[12];
  const leftKnee = keypoints[13];
  const rightKnee = keypoints[14];
  const leftAnkle = keypoints[15];
  const rightAnkle = keypoints[16];

  const shoulderCenterY = hasConfidence(leftShoulder) && hasConfidence(rightShoulder)
    ? (leftShoulder.y + rightShoulder.y) * 0.5
    : hasConfidence(leftShoulder)
      ? leftShoulder.y
      : hasConfidence(rightShoulder)
        ? rightShoulder.y
        : null;

  const hipCenterY = hasConfidence(leftHip) && hasConfidence(rightHip)
    ? (leftHip.y + rightHip.y) * 0.5
    : hasConfidence(leftHip)
      ? leftHip.y
      : hasConfidence(rightHip)
        ? rightHip.y
        : null;

  if (shoulderCenterY === null || hipCenterY === null) {
    state.pendingPhase = null;
    state.pendingFrames = 0;
    return toResult();
  }

  const torsoSpan = Math.max(0.08, hipCenterY - shoulderCenterY);
  const leftLiftRaw = hasConfidence(leftKnee)
    ? (hipCenterY - leftKnee.y) / torsoSpan
    : hasConfidence(leftAnkle)
      ? (hipCenterY - leftAnkle.y) / torsoSpan
      : 0;
  const rightLiftRaw = hasConfidence(rightKnee)
    ? (hipCenterY - rightKnee.y) / torsoSpan
    : hasConfidence(rightAnkle)
      ? (hipCenterY - rightAnkle.y) / torsoSpan
      : 0;
  const rawLift = Math.max(leftLiftRaw, rightLiftRaw);

  const now = Date.now();
  const deltaMs = state.lastTimestamp ? Math.max(16, now - state.lastTimestamp) : 33;
  state.lastTimestamp = now;

  const liftDelta = rawLift - state.smoothedLift;
  // Keep detector responsive enough for fast knee drives while still filtering jitter.
  const absLiftDelta = Math.abs(liftDelta);
  const smoothAlpha = absLiftDelta > 0.12 ? 0.85 : absLiftDelta > 0.06 ? 0.7 : 0.5;
  state.smoothedLift = state.smoothedLift + liftDelta * smoothAlpha;

  const liftVelocity = (state.smoothedLift - state.lastLift) / (deltaMs / 1000);
  state.lastLift = state.smoothedLift;

  const leftRightDelta = Math.abs(leftLiftRaw - rightLiftRaw);
  state.stabilitySamples += 1;
  if (leftRightDelta > 0.25) {
    state.stabilityPenalty += 1;
  }

  // Hysteresis zones for smoother transitions
  let nextPhase: KneeRaisePhase = state.phase;
  if (state.phase === 'down') {
    // Keep a rolling baseline of the down position to adapt to camera angle and body proportions.
    if (state.downBaselineLift <= 0) {
      state.downBaselineLift = state.smoothedLift;
    } else {
      state.downBaselineLift = state.downBaselineLift * 0.85 + state.smoothedLift * 0.15;
    }

    // Need to go above threshold to switch to 'up'
    const dynamicUpThreshold = state.downBaselineLift + (liftVelocity > FAST_MOVEMENT_VELOCITY ? 0.03 : 0.04);
    const minimumAbsoluteUpThreshold = liftVelocity > FAST_MOVEMENT_VELOCITY ? 0.06 : 0.08;
    const upThreshold = Math.max(minimumAbsoluteUpThreshold, dynamicUpThreshold);

    if (state.smoothedLift >= upThreshold) {
      nextPhase = 'up';
    }
  } else {
    // Need to go below threshold to switch to 'down'
    const downThreshold = liftVelocity < -FAST_MOVEMENT_VELOCITY ? 0.055 : 0.045;
    if (state.smoothedLift <= downThreshold) {
      nextPhase = 'down';
    }
  }

  if (nextPhase !== state.phase) {
    if (state.pendingPhase === nextPhase) {
      state.pendingFrames += 1;
    } else {
      state.pendingPhase = nextPhase;
      state.pendingFrames = 1;
    }

    const requiredFrames = BASE_CONFIRMATION_FRAMES;
    if (state.pendingFrames >= requiredFrames) {
      const previousPhase = state.phase;
      state.phase = nextPhase;
      state.pendingPhase = null;
      state.pendingFrames = 0;

      if (previousPhase === 'down' && nextPhase === 'up') {
        state.repStartAt = now;
        state.peakLift = state.smoothedLift;
      }

      if (state.phase === 'up') {
        state.peakLift = Math.max(state.peakLift, state.smoothedLift);
      }

      if (previousPhase === 'up' && nextPhase === 'down' && state.repStartAt !== null) {
        const repDurationMs = now - state.repStartAt;
        const isCooldownDone = now - state.lastRepAt >= REP_COOLDOWN_MS;
        const hasRealLift = state.peakLift >= 0.05;

        if (repDurationMs >= MIN_REP_DURATION_MS && isCooldownDone && hasRealLift) {
          state.repCount += 1;
          state.lastRepAt = now;

          const repSpeedSec = repDurationMs / 1000;
          let speedScore = 85;
          if (repSpeedSec < 0.17) {
            speedScore = 70;
            state.lastSpeedFeedback = 'Too fast';
          } else if (repSpeedSec > 2.3) {
            speedScore = 55;
            state.lastSpeedFeedback = 'Too slow';
          } else if (repSpeedSec >= 0.22 && repSpeedSec <= 1.4) {
            speedScore = 100;
            state.lastSpeedFeedback = 'Controlled';
          } else {
            state.lastSpeedFeedback = 'Controlled';
          }

          const heightScore = clamp(((state.peakLift - 0.06) / 0.14) * 100, 0, 100);
          const stabilityPenaltyRatio = state.stabilitySamples > 0
            ? state.stabilityPenalty / state.stabilitySamples
            : 0;
          const stabilityScore = clamp(100 - stabilityPenaltyRatio * 35, 60, 100);
          const repAccuracy = clamp(heightScore * 0.5 + speedScore * 0.35 + stabilityScore * 0.15, 0, 100);

          state.completedReps += 1;
          state.totalAccuracy += repAccuracy;
          state.averageAccuracy = state.totalAccuracy / state.completedReps;
        }

        state.repStartAt = null;
        state.peakLift = 0;
        state.stabilitySamples = 0;
        state.stabilityPenalty = 0;
        // Refresh baseline after rep completion so next rep can be detected from current posture.
        state.downBaselineLift = Math.max(0, state.smoothedLift);
      }
    }
  } else {
    state.pendingPhase = null;
    state.pendingFrames = 0;

    if (state.phase === 'up') {
      state.peakLift = Math.max(state.peakLift, state.smoothedLift);
    }
  }

  return toResult();
};

export const resetStandingKneeRaiseDetector = (): void => {
  state.repCount = 0;
  state.phase = 'down';
  state.pendingPhase = null;
  state.pendingFrames = 0;
  state.smoothedLift = 0;
  state.lastLift = 0;
  state.lastTimestamp = null;
  state.repStartAt = null;
  state.lastRepAt = 0;
  state.peakLift = 0;
  state.totalAccuracy = 0;
  state.completedReps = 0;
  state.averageAccuracy = 0;
  state.stabilitySamples = 0;
  state.stabilityPenalty = 0;
  state.lastSpeedFeedback = 'Controlled';
  state.downBaselineLift = 0;
};
