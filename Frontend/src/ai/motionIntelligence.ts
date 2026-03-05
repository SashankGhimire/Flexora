export type PoseKeypoint = {
  x: number;
  y: number;
  score?: number;
};

export type VerticalMovement = 'up' | 'down' | 'stable';

export type JointAngles = {
  leftElbow: number | null;
  rightElbow: number | null;
  leftKnee: number | null;
  rightKnee: number | null;
};

export type AngleScope = {
  elbows?: boolean;
  knees?: boolean;
};

export type HandMovement = {
  leftWrist: VerticalMovement;
  rightWrist: VerticalMovement;
};

export type MotionAnalysis = {
  angles: JointAngles;
  handMovement: HandMovement;
  bodyVerticalMovement: VerticalMovement;
};

const MIN_STABLE_KEYPOINTS = 10;
const DEFAULT_WRIST_THRESHOLD = 0.01;
const DEFAULT_HIP_THRESHOLD = 0.008;
const NO_ANGLES: JointAngles = {
  leftElbow: null,
  rightElbow: null,
  leftKnee: null,
  rightKnee: null,
};
const NO_MOVEMENT_ANALYSIS: MotionAnalysis = {
  angles: NO_ANGLES,
  handMovement: {
    leftWrist: 'stable',
    rightWrist: 'stable',
  },
  bodyVerticalMovement: 'stable',
};

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

const RAD_TO_DEG = 180 / Math.PI;

export const getKeypoint = (
  keypoints: PoseKeypoint[],
  index: number,
  minScore: number
): PoseKeypoint | null => {
  const point = keypoints[index];
  if (!point) return null;
  if (point.score !== undefined && point.score < minScore) return null;
  return point;
};

const countConfidentKeypoints = (
  keypoints: PoseKeypoint[],
  minScore: number
): number => {
  let confident = 0;
  for (let index = 0; index < keypoints.length; index += 1) {
    const point = keypoints[index];
    if (!point) continue;
    if (typeof point.score !== 'number' || point.score >= minScore) {
      confident += 1;
    }
  }
  return confident;
};

const isStableFrame = (keypoints: PoseKeypoint[], minScore: number): boolean => {
  return countConfidentKeypoints(keypoints, minScore) >= MIN_STABLE_KEYPOINTS;
};

const smoothKeypoints = (
  previous: PoseKeypoint[],
  current: PoseKeypoint[],
  outputBuffer?: PoseKeypoint[]
): PoseKeypoint[] => {
  if (!previous.length && !outputBuffer) {
    return current;
  }

  const target = outputBuffer ?? new Array<PoseKeypoint>(current.length);

  for (let index = 0; index < current.length; index += 1) {
    const currentPoint = current[index];
    const previousPoint = previous[index];
    const existingPoint = target[index];

    const nextX = previousPoint ? (previousPoint.x + currentPoint.x) * 0.5 : currentPoint.x;
    const nextY = previousPoint ? (previousPoint.y + currentPoint.y) * 0.5 : currentPoint.y;
    const nextScore = previousPoint
      ? (typeof currentPoint.score === 'number' ? currentPoint.score : previousPoint.score)
      : currentPoint.score;

    if (existingPoint) {
      existingPoint.x = nextX;
      existingPoint.y = nextY;
      existingPoint.score = nextScore;
    } else {
      target[index] = {
        x: nextX,
        y: nextY,
        score: nextScore,
      };
    }
  }

  if (target.length > current.length) {
    target.length = current.length;
  }

  return target;
};

const getVerticalMovement = (
  previousY: number,
  currentY: number,
  threshold: number
): VerticalMovement => {
  const delta = currentY - previousY;
  if (delta > threshold) return 'down';
  if (delta < -threshold) return 'up';
  return 'stable';
};

const getHipCenterY = (
  keypoints: PoseKeypoint[],
  minScore: number
): number | null => {
  const leftHip = getKeypoint(keypoints, MOVENET.LEFT_HIP, minScore);
  const rightHip = getKeypoint(keypoints, MOVENET.RIGHT_HIP, minScore);

  if (leftHip && rightHip) {
    return (leftHip.y + rightHip.y) * 0.5;
  }

  if (leftHip) return leftHip.y;
  if (rightHip) return rightHip.y;
  return null;
};

export const calculateAngle = (
  a: PoseKeypoint,
  b: PoseKeypoint,
  c: PoseKeypoint
): number => {
  const abX = a.x - b.x;
  const abY = a.y - b.y;
  const cbX = c.x - b.x;
  const cbY = c.y - b.y;

  const dot = abX * cbX + abY * cbY;
  const magAB = Math.sqrt(abX * abX + abY * abY);
  const magCB = Math.sqrt(cbX * cbX + cbY * cbY);

  if (magAB === 0 || magCB === 0) return 0;

  const cosine = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosine) * RAD_TO_DEG;
};

export const calculateJointAngles = (
  keypoints: PoseKeypoint[],
  minScore = 0.3,
  scope?: AngleScope
): JointAngles => {
  const includeElbows = scope?.elbows ?? true;
  const includeKnees = scope?.knees ?? true;

  let leftShoulder: PoseKeypoint | null = null;
  let leftElbow: PoseKeypoint | null = null;
  let leftWrist: PoseKeypoint | null = null;
  let rightShoulder: PoseKeypoint | null = null;
  let rightElbow: PoseKeypoint | null = null;
  let rightWrist: PoseKeypoint | null = null;
  let leftHip: PoseKeypoint | null = null;
  let leftKnee: PoseKeypoint | null = null;
  let leftAnkle: PoseKeypoint | null = null;
  let rightHip: PoseKeypoint | null = null;
  let rightKnee: PoseKeypoint | null = null;
  let rightAnkle: PoseKeypoint | null = null;

  if (includeElbows) {
    leftShoulder = getKeypoint(keypoints, MOVENET.LEFT_SHOULDER, minScore);
    leftElbow = getKeypoint(keypoints, MOVENET.LEFT_ELBOW, minScore);
    leftWrist = getKeypoint(keypoints, MOVENET.LEFT_WRIST, minScore);
    rightShoulder = getKeypoint(keypoints, MOVENET.RIGHT_SHOULDER, minScore);
    rightElbow = getKeypoint(keypoints, MOVENET.RIGHT_ELBOW, minScore);
    rightWrist = getKeypoint(keypoints, MOVENET.RIGHT_WRIST, minScore);
  }

  if (includeKnees) {
    leftHip = getKeypoint(keypoints, MOVENET.LEFT_HIP, minScore);
    leftKnee = getKeypoint(keypoints, MOVENET.LEFT_KNEE, minScore);
    leftAnkle = getKeypoint(keypoints, MOVENET.LEFT_ANKLE, minScore);
    rightHip = getKeypoint(keypoints, MOVENET.RIGHT_HIP, minScore);
    rightKnee = getKeypoint(keypoints, MOVENET.RIGHT_KNEE, minScore);
    rightAnkle = getKeypoint(keypoints, MOVENET.RIGHT_ANKLE, minScore);
  }

  return {
    leftElbow:
      includeElbows && leftShoulder && leftElbow && leftWrist
        ? calculateAngle(leftShoulder, leftElbow, leftWrist)
        : null,
    rightElbow:
      includeElbows && rightShoulder && rightElbow && rightWrist
        ? calculateAngle(rightShoulder, rightElbow, rightWrist)
        : null,
    leftKnee:
      includeKnees && leftHip && leftKnee && leftAnkle
        ? calculateAngle(leftHip, leftKnee, leftAnkle)
        : null,
    rightKnee:
      includeKnees && rightHip && rightKnee && rightAnkle
        ? calculateAngle(rightHip, rightKnee, rightAnkle)
        : null,
  };
};

export const detectHandMovement = (
  previous: PoseKeypoint[],
  current: PoseKeypoint[],
  threshold = DEFAULT_WRIST_THRESHOLD,
  minScore = 0.3,
  smoothedCurrent?: PoseKeypoint[]
): HandMovement => {
  const effectiveCurrent = smoothedCurrent ?? smoothKeypoints(previous, current);

  const prevLeftWrist = getKeypoint(previous, MOVENET.LEFT_WRIST, minScore);
  const currLeftWrist = getKeypoint(effectiveCurrent, MOVENET.LEFT_WRIST, minScore);

  const prevRightWrist = getKeypoint(previous, MOVENET.RIGHT_WRIST, minScore);
  const currRightWrist = getKeypoint(effectiveCurrent, MOVENET.RIGHT_WRIST, minScore);

  return {
    leftWrist:
      prevLeftWrist && currLeftWrist
        ? getVerticalMovement(prevLeftWrist.y, currLeftWrist.y, threshold)
        : 'stable',
    rightWrist:
      prevRightWrist && currRightWrist
        ? getVerticalMovement(prevRightWrist.y, currRightWrist.y, threshold)
        : 'stable',
  };
};

export const detectBodyVerticalMovement = (
  previous: PoseKeypoint[],
  current: PoseKeypoint[],
  threshold = DEFAULT_HIP_THRESHOLD,
  minScore = 0.3,
  smoothedCurrent?: PoseKeypoint[]
): VerticalMovement => {
  const effectiveCurrent = smoothedCurrent ?? smoothKeypoints(previous, current);

  const prevHipY = getHipCenterY(previous, minScore);
  const currHipY = getHipCenterY(effectiveCurrent, minScore);

  if (prevHipY === null || currHipY === null) return 'stable';
  return getVerticalMovement(prevHipY, currHipY, threshold);
};

export const analyzeMotion = (
  previous: PoseKeypoint[],
  current: PoseKeypoint[],
  options?: {
    minScore?: number;
    handThreshold?: number;
    hipThreshold?: number;
    angleScope?: AngleScope;
    smoothedBuffer?: PoseKeypoint[];
  }
): MotionAnalysis => {
  const minScore = options?.minScore ?? 0.3;
  const handThreshold = options?.handThreshold ?? DEFAULT_WRIST_THRESHOLD;
  const hipThreshold = options?.hipThreshold ?? DEFAULT_HIP_THRESHOLD;
  const smoothedCurrent = smoothKeypoints(previous, current, options?.smoothedBuffer);

  if (!isStableFrame(smoothedCurrent, minScore)) {
    return NO_MOVEMENT_ANALYSIS;
  }

  return {
    angles: calculateJointAngles(smoothedCurrent, minScore, options?.angleScope),
    handMovement: detectHandMovement(previous, smoothedCurrent, handThreshold, minScore, smoothedCurrent),
    bodyVerticalMovement: detectBodyVerticalMovement(previous, smoothedCurrent, hipThreshold, minScore, smoothedCurrent),
  };
};
