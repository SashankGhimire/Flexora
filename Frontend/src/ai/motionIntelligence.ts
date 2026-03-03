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

export type HandMovement = {
  leftWrist: VerticalMovement;
  rightWrist: VerticalMovement;
};

export type MotionAnalysis = {
  angles: JointAngles;
  handMovement: HandMovement;
  bodyVerticalMovement: VerticalMovement;
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

const getKeypoint = (
  keypoints: PoseKeypoint[],
  index: number,
  minScore: number
): PoseKeypoint | null => {
  const point = keypoints[index];
  if (!point) return null;
  if (point.score !== undefined && point.score < minScore) return null;
  return point;
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
  minScore = 0.3
): JointAngles => {
  const leftShoulder = getKeypoint(keypoints, MOVENET.LEFT_SHOULDER, minScore);
  const leftElbow = getKeypoint(keypoints, MOVENET.LEFT_ELBOW, minScore);
  const leftWrist = getKeypoint(keypoints, MOVENET.LEFT_WRIST, minScore);

  const rightShoulder = getKeypoint(keypoints, MOVENET.RIGHT_SHOULDER, minScore);
  const rightElbow = getKeypoint(keypoints, MOVENET.RIGHT_ELBOW, minScore);
  const rightWrist = getKeypoint(keypoints, MOVENET.RIGHT_WRIST, minScore);

  const leftHip = getKeypoint(keypoints, MOVENET.LEFT_HIP, minScore);
  const leftKnee = getKeypoint(keypoints, MOVENET.LEFT_KNEE, minScore);
  const leftAnkle = getKeypoint(keypoints, MOVENET.LEFT_ANKLE, minScore);

  const rightHip = getKeypoint(keypoints, MOVENET.RIGHT_HIP, minScore);
  const rightKnee = getKeypoint(keypoints, MOVENET.RIGHT_KNEE, minScore);
  const rightAnkle = getKeypoint(keypoints, MOVENET.RIGHT_ANKLE, minScore);

  return {
    leftElbow:
      leftShoulder && leftElbow && leftWrist
        ? calculateAngle(leftShoulder, leftElbow, leftWrist)
        : null,
    rightElbow:
      rightShoulder && rightElbow && rightWrist
        ? calculateAngle(rightShoulder, rightElbow, rightWrist)
        : null,
    leftKnee:
      leftHip && leftKnee && leftAnkle
        ? calculateAngle(leftHip, leftKnee, leftAnkle)
        : null,
    rightKnee:
      rightHip && rightKnee && rightAnkle
        ? calculateAngle(rightHip, rightKnee, rightAnkle)
        : null,
  };
};

export const detectHandMovement = (
  previous: PoseKeypoint[],
  current: PoseKeypoint[],
  threshold = 0.015,
  minScore = 0.3
): HandMovement => {
  const prevLeftWrist = getKeypoint(previous, MOVENET.LEFT_WRIST, minScore);
  const currLeftWrist = getKeypoint(current, MOVENET.LEFT_WRIST, minScore);

  const prevRightWrist = getKeypoint(previous, MOVENET.RIGHT_WRIST, minScore);
  const currRightWrist = getKeypoint(current, MOVENET.RIGHT_WRIST, minScore);

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
  threshold = 0.012,
  minScore = 0.3
): VerticalMovement => {
  const prevHipY = getHipCenterY(previous, minScore);
  const currHipY = getHipCenterY(current, minScore);

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
  }
): MotionAnalysis => {
  const minScore = options?.minScore ?? 0.3;
  const handThreshold = options?.handThreshold ?? 0.015;
  const hipThreshold = options?.hipThreshold ?? 0.012;

  return {
    angles: calculateJointAngles(current, minScore),
    handMovement: detectHandMovement(previous, current, handThreshold, minScore),
    bodyVerticalMovement: detectBodyVerticalMovement(previous, current, hipThreshold, minScore),
  };
};
