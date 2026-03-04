import { ExerciseType } from '../types';
import { calculateAngle, getKeypoint, PoseKeypoint } from './motionIntelligence';

const MIN_SCORE = 0.3;
const VERTICAL_TOLERANCE = 0.01;
const ANGLE_TOLERANCE_DEG = 10;
const MIN_STABLE_KEYPOINTS = 10;

const MOVENET = {
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

export type ExerciseDetectionPhase = 'up' | 'down' | 'hold' | 'open' | 'close';

export type ExerciseDetectionResult = {
  repDetected: boolean;
  phase: ExerciseDetectionPhase;
  feedback?: string;
};

export type ExerciseDetectorType = ExerciseType | 'jumpingJack';

type SmoothedFrame = {
  current: PoseKeypoint[];
  previous: PoseKeypoint[];
};

type Side = 'left' | 'right';

type ResultThresholds = {
  squat: { down: number; up: number; repFrom: number; repTo: number };
  pushup: { down: number; up: number; repFrom: number; repTo: number };
  lunge: { down: number; up: number; repFrom: number; repTo: number };
  bicepCurl: { down: number; up: number; repFrom: number; repTo: number };
  jumpingJack: { openAnkle: number; closeAnkle: number; prevOpenAnkle: number };
  plank: { maxDeviation: number };
};

const THRESHOLDS: ResultThresholds = {
  squat: { down: 100, up: 158, repFrom: 102, repTo: 156 },
  pushup: { down: 95, up: 153, repFrom: 98, repTo: 150 },
  lunge: { down: 95, up: 156, repFrom: 98, repTo: 154 },
  bicepCurl: { down: 65, up: 148, repFrom: 70, repTo: 145 },
  jumpingJack: { openAnkle: 0.22, closeAnkle: 0.16, prevOpenAnkle: 0.2 },
  plank: { maxDeviation: 15 },
};

const JOINTS = {
  elbow: {
    left: [MOVENET.LEFT_SHOULDER, MOVENET.LEFT_ELBOW, MOVENET.LEFT_WRIST],
    right: [MOVENET.RIGHT_SHOULDER, MOVENET.RIGHT_ELBOW, MOVENET.RIGHT_WRIST],
  },
  knee: {
    left: [MOVENET.LEFT_HIP, MOVENET.LEFT_KNEE, MOVENET.LEFT_ANKLE],
    right: [MOVENET.RIGHT_HIP, MOVENET.RIGHT_KNEE, MOVENET.RIGHT_ANKLE],
  },
} as const;

type Detector = (previousKeypoints: PoseKeypoint[], currentKeypoints: PoseKeypoint[]) => ExerciseDetectionResult;

type PhasePersistenceState = {
  lastPhase: ExerciseDetectionPhase;
  phaseStreak: number;
  recentDownStreak: number;
};

const phaseStateByExercise: Record<ExerciseDetectorType, PhasePersistenceState> = {
  squat: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
  pushup: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
  lunge: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
  jumpingJack: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
  plank: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
  bicepCurl: { lastPhase: 'hold', phaseStreak: 0, recentDownStreak: 0 },
};

const smoothCoordinate = (prev: number, current: number): number => {
  return (prev + current) * 0.5;
};

const smoothPoint = (prev: PoseKeypoint, current: PoseKeypoint): PoseKeypoint => {
  return {
    x: smoothCoordinate(prev.x, current.x),
    y: smoothCoordinate(prev.y, current.y),
    score: typeof current.score === 'number' ? current.score : prev.score,
  };
};

const smoothKeypoints = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): SmoothedFrame => {
  if (!previousKeypoints.length) {
    return { current: currentKeypoints, previous: previousKeypoints };
  }

  const smoothedCurrent = currentKeypoints.map((point, index) => {
    const previousPoint = previousKeypoints[index];
    if (!previousPoint) {
      return point;
    }

    return smoothPoint(previousPoint, point);
  });

  return {
    current: smoothedCurrent,
    previous: previousKeypoints,
  };
};

const averageDefined = (values: Array<number | null>): number | null => {
  let total = 0;
  let count = 0;

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (typeof value === 'number' && Number.isFinite(value)) {
      total += value;
      count += 1;
    }
  }

  if (count === 0) {
    return null;
  }

  return total / count;
};

const countConfidentKeypoints = (keypoints: PoseKeypoint[], minScore: number): number => {
  let confidentCount = 0;
  for (let index = 0; index < keypoints.length; index += 1) {
    const point = keypoints[index];
    if (!point) continue;
    if (typeof point.score !== 'number' || point.score >= minScore) {
      confidentCount += 1;
    }
  }
  return confidentCount;
};

const isStableFrame = (keypoints: PoseKeypoint[]): boolean => {
  return countConfidentKeypoints(keypoints, MIN_SCORE) >= MIN_STABLE_KEYPOINTS;
};

const createResult = (
  repDetected: boolean,
  phase: ExerciseDetectionPhase,
  feedback?: string
): ExerciseDetectionResult => ({ repDetected, phase, feedback });

const didTransitionRep = (
  previousValue: number | null,
  currentValue: number,
  fromBelow: number,
  toAbove: number
): boolean => {
  return previousValue !== null && previousValue < fromBelow && currentValue > toAbove;
};

const isAtOrBelow = (value: number, threshold: number): boolean => {
  return value <= threshold + ANGLE_TOLERANCE_DEG;
};

const isAtOrAbove = (value: number, threshold: number): boolean => {
  return value >= threshold - ANGLE_TOLERANCE_DEG;
};

const updatePhaseState = (
  exerciseType: ExerciseDetectorType,
  phase: ExerciseDetectionPhase
): PhasePersistenceState => {
  const state = phaseStateByExercise[exerciseType];

  if (state.lastPhase === phase) {
    state.phaseStreak += 1;
  } else {
    if (state.lastPhase === 'down') {
      state.recentDownStreak = state.phaseStreak;
    }
    state.lastPhase = phase;
    state.phaseStreak = 1;
  }

  return state;
};

const applyRepPersistenceGate = (
  exerciseType: ExerciseDetectorType,
  candidate: ExerciseDetectionResult
): ExerciseDetectionResult => {
  const state = updatePhaseState(exerciseType, candidate.phase);

  if (!candidate.repDetected) {
    return candidate;
  }

  const hasStableDown = state.recentDownStreak >= 2;
  const hasStableUp = candidate.phase === 'up' && state.phaseStreak >= 2;
  const confirmedRep = hasStableDown && hasStableUp;

  return {
    ...candidate,
    repDetected: confirmedRep,
  };
};

const verticalDelta = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[],
  indexA: number,
  indexB: number
): number | null => {
  const prevA = getKeypoint(previousKeypoints, indexA, MIN_SCORE);
  const prevB = getKeypoint(previousKeypoints, indexB, MIN_SCORE);
  const currA = getKeypoint(currentKeypoints, indexA, MIN_SCORE);
  const currB = getKeypoint(currentKeypoints, indexB, MIN_SCORE);

  if (!currA || !currB || !prevA || !prevB) {
    return null;
  }

  const prevCenter = (prevA.y + prevB.y) * 0.5;
  const currCenter = (currA.y + currB.y) * 0.5;
  return currCenter - prevCenter;
};

const getJointAngle = (
  keypoints: PoseKeypoint[],
  joint: keyof typeof JOINTS,
  side: Side
): number | null => {
  const [aIndex, bIndex, cIndex] = JOINTS[joint][side];
  const a = getKeypoint(keypoints, aIndex, MIN_SCORE);
  const b = getKeypoint(keypoints, bIndex, MIN_SCORE);
  const c = getKeypoint(keypoints, cIndex, MIN_SCORE);
  if (!a || !b || !c) {
    return null;
  }
  return calculateAngle(a, b, c);
};

const getElbowAverage = (keypoints: PoseKeypoint[]): number | null => {
  return averageDefined([
    getJointAngle(keypoints, 'elbow', 'left'),
    getJointAngle(keypoints, 'elbow', 'right'),
  ]);
};

const getKneeAverage = (keypoints: PoseKeypoint[]): number | null => {
  return averageDefined([
    getJointAngle(keypoints, 'knee', 'left'),
    getJointAngle(keypoints, 'knee', 'right'),
  ]);
};

const getCenterPoint = (
  keypoints: PoseKeypoint[],
  leftIndex: number,
  rightIndex: number
): { x: number; y: number } | null => {
  const left = getKeypoint(keypoints, leftIndex, MIN_SCORE);
  const right = getKeypoint(keypoints, rightIndex, MIN_SCORE);
  if (left && right) {
    return { x: (left.x + right.x) * 0.5, y: (left.y + right.y) * 0.5 };
  }
  const one = left ?? right;
  if (!one) {
    return null;
  }
  return { x: one.x, y: one.y };
};

const getPlankAlignmentAngle = (keypoints: PoseKeypoint[]): number | null => {
  const shoulderLeft = getKeypoint(keypoints, MOVENET.LEFT_SHOULDER, MIN_SCORE);
  const shoulderRight = getKeypoint(keypoints, MOVENET.RIGHT_SHOULDER, MIN_SCORE);
  const hipLeft = getKeypoint(keypoints, MOVENET.LEFT_HIP, MIN_SCORE);
  const hipRight = getKeypoint(keypoints, MOVENET.RIGHT_HIP, MIN_SCORE);
  const ankleLeft = getKeypoint(keypoints, MOVENET.LEFT_ANKLE, MIN_SCORE);
  const ankleRight = getKeypoint(keypoints, MOVENET.RIGHT_ANKLE, MIN_SCORE);

  const shoulder = shoulderLeft && shoulderRight
    ? { x: (shoulderLeft.x + shoulderRight.x) * 0.5, y: (shoulderLeft.y + shoulderRight.y) * 0.5 }
    : shoulderLeft ?? shoulderRight;
  const hip = hipLeft && hipRight
    ? { x: (hipLeft.x + hipRight.x) * 0.5, y: (hipLeft.y + hipRight.y) * 0.5 }
    : hipLeft ?? hipRight;
  const ankle = ankleLeft && ankleRight
    ? { x: (ankleLeft.x + ankleRight.x) * 0.5, y: (ankleLeft.y + ankleRight.y) * 0.5 }
    : ankleLeft ?? ankleRight;

  if (!shoulder || !hip || !ankle) {
    return null;
  }

  return calculateAngle(shoulder, hip, ankle);
};

export const detectSquat = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { previous, current } = smoothKeypoints(previousKeypoints, currentKeypoints);

  const prevKnee = getKneeAverage(previous);
  const currKnee = getKneeAverage(current);
  const hipDy = verticalDelta(previous, current, MOVENET.LEFT_HIP, MOVENET.RIGHT_HIP);

  if (currKnee === null) {
    return createResult(false, 'hold', 'Keep hips and knees visible');
  }

  const downByAngle = isAtOrBelow(currKnee, THRESHOLDS.squat.down);
  const upByAngle = isAtOrAbove(currKnee, THRESHOLDS.squat.up);
  const movingDown = hipDy !== null && hipDy > -VERTICAL_TOLERANCE;
  const movingUp = hipDy !== null && hipDy < VERTICAL_TOLERANCE;

  const phase: ExerciseDetectionPhase = downByAngle && movingDown
    ? 'down'
    : upByAngle && movingUp
      ? 'up'
      : 'hold';

  const repDetected = didTransitionRep(
    prevKnee,
    currKnee,
    THRESHOLDS.squat.repFrom,
    THRESHOLDS.squat.repTo
  );

  return createResult(repDetected, phase, phase === 'down' ? 'Drive through heels and rise up' : undefined);
};

export const detectPushup = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { previous, current } = smoothKeypoints(previousKeypoints, currentKeypoints);

  const prevElbow = getElbowAverage(previous);
  const currElbow = getElbowAverage(current);

  if (currElbow === null) {
    return createResult(false, 'hold', 'Keep elbows and shoulders visible');
  }

  const phase: ExerciseDetectionPhase =
    isAtOrBelow(currElbow, THRESHOLDS.pushup.down)
      ? 'down'
      : isAtOrAbove(currElbow, THRESHOLDS.pushup.up)
        ? 'up'
        : 'hold';
  const repDetected = didTransitionRep(
    prevElbow,
    currElbow,
    THRESHOLDS.pushup.repFrom,
    THRESHOLDS.pushup.repTo
  );

  return createResult(repDetected, phase, phase === 'down' ? 'Press back up with control' : undefined);
};

export const detectLunge = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { previous, current } = smoothKeypoints(previousKeypoints, currentKeypoints);

  const prevKnee = getKneeAverage(previous);
  const currKnee = getKneeAverage(current);
  const hipDy = verticalDelta(previous, current, MOVENET.LEFT_HIP, MOVENET.RIGHT_HIP);

  if (currKnee === null) {
    return createResult(false, 'hold', 'Keep legs and hips in frame');
  }

  const phase: ExerciseDetectionPhase =
    isAtOrBelow(currKnee, THRESHOLDS.lunge.down) && hipDy !== null && hipDy > -VERTICAL_TOLERANCE
      ? 'down'
      : isAtOrAbove(currKnee, THRESHOLDS.lunge.up) && hipDy !== null && hipDy < VERTICAL_TOLERANCE
        ? 'up'
        : 'hold';

  const repDetected = didTransitionRep(
    prevKnee,
    currKnee,
    THRESHOLDS.lunge.repFrom,
    THRESHOLDS.lunge.repTo
  );

  return createResult(repDetected, phase, phase === 'down' ? 'Keep front knee over ankle' : undefined);
};

export const detectJumpingJack = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { previous, current } = smoothKeypoints(previousKeypoints, currentKeypoints);

  const shoulders = getCenterPoint(current, MOVENET.LEFT_SHOULDER, MOVENET.RIGHT_SHOULDER);
  const wrists = getCenterPoint(current, MOVENET.LEFT_WRIST, MOVENET.RIGHT_WRIST);
  const leftAnkle = getKeypoint(current, MOVENET.LEFT_ANKLE, MIN_SCORE);
  const rightAnkle = getKeypoint(current, MOVENET.RIGHT_ANKLE, MIN_SCORE);

  const prevShoulders = getCenterPoint(previous, MOVENET.LEFT_SHOULDER, MOVENET.RIGHT_SHOULDER);
  const prevWrists = getCenterPoint(previous, MOVENET.LEFT_WRIST, MOVENET.RIGHT_WRIST);
  const prevLeftAnkle = getKeypoint(previous, MOVENET.LEFT_ANKLE, MIN_SCORE);
  const prevRightAnkle = getKeypoint(previous, MOVENET.RIGHT_ANKLE, MIN_SCORE);

  if (
    !shoulders || !wrists || !leftAnkle || !rightAnkle ||
    !prevShoulders || !prevWrists || !prevLeftAnkle || !prevRightAnkle
  ) {
    return createResult(false, 'hold', 'Keep full body visible for jumping jacks');
  }

  const shouldersY = shoulders.y;
  const wristsY = wrists.y;
  const anklesDistance = Math.abs(leftAnkle.x - rightAnkle.x);

  const prevShouldersY = prevShoulders.y;
  const prevWristsY = prevWrists.y;
  const prevAnklesDistance = Math.abs(prevLeftAnkle.x - prevRightAnkle.x);

  const isOpen =
    wristsY < shouldersY + VERTICAL_TOLERANCE &&
    anklesDistance > THRESHOLDS.jumpingJack.openAnkle;
  const isClose =
    wristsY > shouldersY - VERTICAL_TOLERANCE &&
    anklesDistance < THRESHOLDS.jumpingJack.closeAnkle;

  const prevOpen =
    prevWristsY < prevShouldersY + VERTICAL_TOLERANCE &&
    prevAnklesDistance > THRESHOLDS.jumpingJack.prevOpenAnkle;

  const phase: ExerciseDetectionPhase = isOpen ? 'open' : isClose ? 'close' : 'hold';
  const repDetected = prevOpen && isClose;

  return createResult(repDetected, phase, phase === 'open' ? 'Return to center to finish rep' : undefined);
};

export const detectPlank = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { current: smoothedCurrent } = smoothKeypoints(previousKeypoints, currentKeypoints);
  const angle = getPlankAlignmentAngle(smoothedCurrent);

  if (angle === null) {
    return createResult(false, 'hold', 'Align shoulder, hip, and ankle in frame');
  }

  const deviation = Math.abs(180 - angle);
  const isCorrect = deviation < THRESHOLDS.plank.maxDeviation;

  return createResult(false, 'hold', isCorrect ? 'Plank posture good' : 'Keep body in a straighter line');
};

export const detectBicepCurl = (
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  const { previous, current } = smoothKeypoints(previousKeypoints, currentKeypoints);

  const prevElbow = getElbowAverage(previous);
  const currElbow = getElbowAverage(current);

  if (currElbow === null) {
    return createResult(false, 'hold', 'Keep elbows and wrists visible');
  }

  const phase: ExerciseDetectionPhase =
    isAtOrBelow(currElbow, THRESHOLDS.bicepCurl.down)
      ? 'down'
      : isAtOrAbove(currElbow, THRESHOLDS.bicepCurl.up)
        ? 'up'
        : 'hold';
  const repDetected = didTransitionRep(
    prevElbow,
    currElbow,
    THRESHOLDS.bicepCurl.repFrom,
    THRESHOLDS.bicepCurl.repTo
  );

  return createResult(repDetected, phase, phase === 'down' ? 'Lower with control' : undefined);
};

const DETECTORS: Record<ExerciseDetectorType, Detector> = {
  squat: detectSquat,
  pushup: detectPushup,
  lunge: detectLunge,
  jumpingJack: detectJumpingJack,
  plank: detectPlank,
  bicepCurl: detectBicepCurl,
};

export const detectExercise = (
  exerciseType: ExerciseDetectorType,
  previousKeypoints: PoseKeypoint[],
  currentKeypoints: PoseKeypoint[]
): ExerciseDetectionResult => {
  if (!isStableFrame(currentKeypoints)) {
    return createResult(false, 'hold', 'Low confidence frame, stabilizing...');
  }

  const detector = DETECTORS[exerciseType];
  if (!detector) {
    return createResult(false, 'hold', 'Exercise detector unavailable');
  }
  const candidate = detector(previousKeypoints, currentKeypoints);
  return applyRepPersistenceGate(exerciseType, candidate);
};
