/**
 * PostureScreen Component
 * 
 * Main workout interface for Flexora fitness app
 * Features:
 * - Full-screen camera preview (front/back)
 * - Real-time timer tracking
 * - Rep counter and accuracy display
 * - Pause/Resume functionality
 * - Exercise-specific UI
 * 
 * Camera: react-native-vision-camera v4.7.3
 * Navigation: React Navigation Native Stack
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useCameraDevice, Camera, useCameraFormat, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-worklets-core';
import Svg, { Circle } from 'react-native-svg';
import { analyzeMotion, calculateJointAngles, AngleScope } from '../ai/motionIntelligence';
import { resetRepCounter, updateRepCounter } from '../ai/repCounter';
import { resetBicepCurlDetector, updateBicepCurl } from '../ai/bicepCurlDetector';
import { COLORS } from '../utils/constants';
import { ExerciseType, HomeStackParamList } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

// Constants
const ACCENT = '#22C55E';
const OVERLAY_LIGHT = 'rgba(0,0,0,0.45)';
const OVERLAY_MEDIUM = 'rgba(0,0,0,0.5)';
const OVERLAY_SUBTLE = 'rgba(0,0,0,0.3)';
const GAP = 12;
const BORDER_RADIUS = 14;
const DEBUG_MIN_SCORE = 0.25;
const DEBUG_HAND_THRESHOLD = 0.012;
const DEBUG_HIP_THRESHOLD = 0.009;
const RAW_DELTA_THRESHOLD = 0.005;
const UI_UPDATE_EVERY_N_FRAMES = 3;
const WORKLET_INFERENCE_EVERY_N_FRAMES = 4;
const JS_POSE_POLL_INTERVAL_MS = 90;
const ANALYSIS_THROTTLE_MS = 180;
const OVERLAY_MIN_INTERVAL_MS = 100;
const KEYPOINT_POSITION_EPSILON = 0.002;
const KEYPOINT_SCORE_EPSILON = 0.02;
const PERSON_PRESENCE_MIN_SCORE = 0.3;
const PERSON_PRESENCE_MIN_KEYPOINTS = 4;
const PERSON_ABSENT_GRACE_FRAMES = 5;
const MIN_RELIABLE_KEYPOINTS = 10;
const MIN_RELIABLE_KEYPOINTS_FALLBACK = 7;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type PostureScreenProps = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

type PoseKeypoint = {
  x: number;
  y: number;
  score: number;
};

const createPoseBuffer = (size = 17): PoseKeypoint[] => {
  const buffer: PoseKeypoint[] = new Array(size);
  for (let index = 0; index < size; index += 1) {
    buffer[index] = { x: 0, y: 0, score: 0 };
  }
  return buffer;
};

const EXERCISE_ANGLE_SCOPE: Record<ExerciseType, AngleScope> = {
  squat: { knees: true, elbows: false },
  pushup: { elbows: true, knees: false },
  lunge: { knees: true, elbows: false },
  jumpingJack: { elbows: false, knees: false },
  plank: { elbows: false, knees: false },
  bicepCurl: { elbows: true, knees: false },
};

type MotionStatus = {
  detected: boolean;
  label: string;
};

type ActivityStatus = {
  detected: boolean;
  label: string;
};

type ActiveMotionThresholds = {
  minScore: number;
  handThreshold: number;
  hipThreshold: number;
  rawDeltaThreshold: number;
};

const PoseOverlay = React.memo(({ keypoints }: { keypoints: PoseKeypoint[] }) => {
  const circles = useMemo(() => {
    const nextCircles: Array<{ key: string; cx: number; cy: number }> = [];
    for (let index = 0; index < keypoints.length; index += 1) {
      const point = keypoints[index];
      if (point.score <= 0.2) {
        continue;
      }

      nextCircles.push({
        key: `kp-${index}`,
        cx: point.x * screenWidth,
        cy: point.y * screenHeight,
      });
    }
    return nextCircles;
  }, [keypoints]);

  return (
    <Svg style={styles.poseOverlay} width={screenWidth} height={screenHeight} pointerEvents="none">
      {circles.map((circle) => (
        <Circle key={circle.key} cx={circle.cx} cy={circle.cy} r={3} fill="rgba(34,197,94,0.75)" />
      ))}
    </Svg>
  );
});

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  squat: 'Squats',
  pushup: 'Pushups',
  lunge: 'Lunges',
  jumpingJack: 'Jumping Jacks',
  plank: 'Plank',
  bicepCurl: 'Bicep Curl',
};

const EXERCISE_MOTION_CONFIG: Record<
  ExerciseType,
  {
    minScore: number;
    handThreshold: number;
    hipThreshold: number;
    rawDeltaThreshold: number;
    kneeBentThreshold: number;
    elbowBentThreshold: number;
  }
> = {
  squat: {
    minScore: 0.25,
    handThreshold: 0.013,
    hipThreshold: 0.007,
    rawDeltaThreshold: 0.005,
    kneeBentThreshold: 145,
    elbowBentThreshold: 130,
  },
  pushup: {
    minScore: 0.25,
    handThreshold: 0.008,
    hipThreshold: 0.006,
    rawDeltaThreshold: 0.004,
    kneeBentThreshold: 150,
    elbowBentThreshold: 135,
  },
  lunge: {
    minScore: 0.25,
    handThreshold: 0.012,
    hipThreshold: 0.007,
    rawDeltaThreshold: 0.005,
    kneeBentThreshold: 150,
    elbowBentThreshold: 130,
  },
  jumpingJack: {
    minScore: 0.24,
    handThreshold: 0.01,
    hipThreshold: 0.008,
    rawDeltaThreshold: 0.0045,
    kneeBentThreshold: 150,
    elbowBentThreshold: 130,
  },
  plank: {
    minScore: 0.22,
    handThreshold: 0.007,
    hipThreshold: 0.005,
    rawDeltaThreshold: 0.0035,
    kneeBentThreshold: 155,
    elbowBentThreshold: 125,
  },
  bicepCurl: {
    minScore: 0.2,
    handThreshold: 0.005,
    hipThreshold: 0.005,
    rawDeltaThreshold: 0.003,
    kneeBentThreshold: 155,
    elbowBentThreshold: 145,
  },
};

// Permission UI Component
const PermissionScreen: React.FC<{
  title: string;
  subtitle: string;
  showLoader?: boolean;
  onGoBack: () => void;
}> = ({ title, subtitle, showLoader = false, onGoBack }) => (
  <SafeAreaView style={styles.permissionContainer}>
    {showLoader && <ActivityIndicator size="large" color={ACCENT} />}
    <Text style={styles.permissionTitle}>{title}</Text>
    <Text style={styles.permissionSubtitle}>{subtitle}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onGoBack}>
      <Text style={styles.retryButtonText}>Go Back</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

export const PostureScreen: React.FC<PostureScreenProps> = ({ route, navigation }) => {
  const { exerciseType: exercise } = route.params;
  const isFocused = useIsFocused();

  // Camera Devices
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');

  // State Management
  const [permission, setPermission] = useState('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [reps, setReps] = useState(0);
  const [repPhase, setRepPhase] = useState('hold');
  const [accuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Get Ready');
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetectingContinuous, setIsDetectingContinuous] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<'up' | 'down'>('up');
  const [elbowAngle, setElbowAngle] = useState(0);
  const [overlayKeypoints, setOverlayKeypoints] = useState<PoseKeypoint[]>([]);
  const [motionStatus, setMotionStatus] = useState<MotionStatus>({
    detected: false,
    label: 'No movement',
  });
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>({
    detected: false,
    label: 'Auto: no movement',
  });
  const [calibrationStatus, setCalibrationStatus] = useState('Calibrating motion... 0/30');
  const [cameraGuide, setCameraGuide] = useState('Camera guide: align full body in frame');
  const [detectSummary, setDetectSummary] = useState('Press Detect Pose to scan 17 points');
  const [elbowScanSummary, setElbowScanSummary] = useState('Elbow scan: waiting');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const prevKeypointsRef = useRef<PoseKeypoint[] | null>(null);
  const repCountRef = useRef(0);
  const phaseRef = useRef<'up' | 'down'>('up');
  const elbowAngleRef = useRef(0);
  const repsRef = useRef(0);
  const repPhaseRef = useRef('hold');
  const prevManualElbowAvgRef = useRef<number | null>(null);
  const prevRealtimeElbowAvgRef = useRef<number | null>(null);
  const lastFeedbackRef = useRef('Get Ready');
  const lastMotionStatusRef = useRef('No movement|0');
  const lastActivityStatusRef = useRef('Auto: no movement|0');
  const motionFrameCountRef = useRef(0);
  const droppedFrameCountRef = useRef(0);
  const lastAnalysisAtRef = useRef(0);
  const lastConsumedPoseVersionRef = useRef(0);
  const lastDetectSummaryRef = useRef('Press Detect Pose to scan 17 points');
  const lastElbowScanSummaryRef = useRef('Elbow scan: waiting');
  const lastCalibrationStatusRef = useRef('Calibrating motion... 0/30');
  const lastCameraGuideRef = useRef('Camera guide: align full body in frame');
  const calibrationFrameCountRef = useRef(0);
  const calibrationSumsRef = useRef({
    leftWristAbsDelta: 0,
    rightWristAbsDelta: 0,
    hipAbsDelta: 0,
  });
  const activeThresholdsRef = useRef<ActiveMotionThresholds>({
    minScore: DEBUG_MIN_SCORE,
    handThreshold: DEBUG_HAND_THRESHOLD,
    hipThreshold: DEBUG_HIP_THRESHOLD,
    rawDeltaThreshold: RAW_DELTA_THRESHOLD,
  });
  const consecutiveAbsentFramesRef = useRef(0);
  const lastOverlayUpdateRef = useRef(0);
  const overlaySnapshotBufferRef = useRef<PoseKeypoint[]>(createPoseBuffer());
  const analysisSmoothingBufferRef = useRef<PoseKeypoint[]>(createPoseBuffer());
  const poseBufferPoolRef = useRef<[PoseKeypoint[], PoseKeypoint[]]>([
    createPoseBuffer(),
    createPoseBuffer(),
  ]);
  const poseBufferIndexRef = useRef(0);
  const workletFrameCounter = useSharedValue(0);
  const sharedPoseKeypoints = useSharedValue<PoseKeypoint[] | null>(null);
  const sharedPoseVersion = useSharedValue(0);

  // Selected device based on camera mode
  const device = isFrontCamera ? frontCamera : backCamera;
  const lowResFormat = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const hdFallbackFormat = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
  ]);
  const cameraFormat = lowResFormat ?? hdFallbackFormat;
  const motionConfig = useMemo(() => EXERCISE_MOTION_CONFIG[exercise], [exercise]);
  const angleScope = useMemo(() => EXERCISE_ANGLE_SCOPE[exercise], [exercise]);
  const [detectPosePlugin, setDetectPosePlugin] = useState(() =>
    VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})
  );

  useEffect(() => {
    if (!isDetectingContinuous) {
      return;
    }

    if (detectPosePlugin != null) {
      return;
    }

    const retryId = setTimeout(() => {
      setDetectPosePlugin(VisionCameraProxy.initFrameProcessorPlugin('detectPose', {}));
    }, 250);

    return () => {
      clearTimeout(retryId);
    };
  }, [detectPosePlugin, isDetectingContinuous]);

  useEffect(() => {
    activeThresholdsRef.current = {
      minScore: motionConfig.minScore,
      handThreshold: motionConfig.handThreshold,
      hipThreshold: motionConfig.hipThreshold,
      rawDeltaThreshold: motionConfig.rawDeltaThreshold,
    };
    calibrationFrameCountRef.current = 0;
    calibrationSumsRef.current = {
      leftWristAbsDelta: 0,
      rightWristAbsDelta: 0,
      hipAbsDelta: 0,
    };
    const resetCalibrationLabel = 'Calibrating motion... 0/30';
    if (lastCalibrationStatusRef.current !== resetCalibrationLabel) {
      lastCalibrationStatusRef.current = resetCalibrationLabel;
      setCalibrationStatus(resetCalibrationLabel);
    }
  }, [motionConfig]);

  useEffect(() => {
    resetRepCounter(exercise);
    if (exercise === 'bicepCurl') {
      resetBicepCurlDetector();
    }
    setReps(0);
    setRepPhase('hold');
    setRepCount(0);
    setPhase('up');
    setElbowAngle(0);
    repCountRef.current = 0;
    phaseRef.current = 'up';
    elbowAngleRef.current = 0;
    repsRef.current = 0;
    repPhaseRef.current = 'hold';
  }, [exercise]);

  const normalizePoseKeypoints = useCallback((rawKeypoints: PoseKeypoint[]): PoseKeypoint[] => {
    poseBufferIndexRef.current = poseBufferIndexRef.current === 0 ? 1 : 0;
    const target = poseBufferPoolRef.current[poseBufferIndexRef.current];

    const limit = Math.min(rawKeypoints.length, target.length);
    for (let index = 0; index < limit; index += 1) {
      const point = rawKeypoints[index];
      const x = Number(point.x);
      const y = Number(point.y);
      const rawScore = typeof point.score === 'number' ? point.score : 0;
      target[index].x = Number.isFinite(x) ? x : 0;
      target[index].y = Number.isFinite(y) ? y : 0;
      target[index].score = Number.isFinite(rawScore) ? rawScore : 0;
    }

    if (target.length > limit) {
      for (let index = limit; index < target.length; index += 1) {
        target[index].x = 0;
        target[index].y = 0;
        target[index].score = 0;
      }
    }

    return target;
  }, []);

  const isPersonPresent = useCallback((
    keypoints: PoseKeypoint[],
    minScore = PERSON_PRESENCE_MIN_SCORE
  ): {
    detected: boolean;
    confidentCount: number;
    avgScore: number;
  } => {
    let confidentCount = 0;
    let totalScore = 0;
    for (let i = 0; i < keypoints.length; i += 1) {
      const s = keypoints[i].score;
      totalScore += s;
      if (s >= minScore) {
        confidentCount += 1;
      }
    }
    const avgScore = keypoints.length > 0 ? totalScore / keypoints.length : 0;
    return {
      detected: confidentCount >= PERSON_PRESENCE_MIN_KEYPOINTS,
      confidentCount,
      avgScore,
    };
  }, []);

  const getCameraGuideText = useCallback((points: PoseKeypoint[]): string => {
    const has = (index: number, min = 0.12) => {
      const point = points[index];
      return !!point && (typeof point.score !== 'number' || point.score >= min);
    };

    const leftShoulder = points[5];
    const rightShoulder = points[6];
    const leftHip = points[11];
    const rightHip = points[12];

    if (!has(5) || !has(6) || !has(11) || !has(12)) {
      return 'Camera guide: center torso (shoulders + hips)';
    }

    if (!has(15) || !has(16)) {
      return 'Camera guide: move farther back, show feet';
    }

    const torsoCenterX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) * 0.25;
    const torsoCenterY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) * 0.25;

    if (torsoCenterX < 0.35) return 'Camera guide: move body slightly right';
    if (torsoCenterX > 0.65) return 'Camera guide: move body slightly left';
    if (torsoCenterY < 0.3) return 'Camera guide: tilt camera down';
    if (torsoCenterY > 0.75) return 'Camera guide: tilt camera up';
    return 'Camera guide: angle looks good';
  }, []);

  const updatePose = useCallback((detectedKeypoints: PoseKeypoint[]) => {
    if (!isDetectingContinuous) {
      return;
    }

    const now = Date.now();
    if (now - lastAnalysisAtRef.current < ANALYSIS_THROTTLE_MS) {
      return;
    }
    lastAnalysisAtRef.current = now;

    if (!detectedKeypoints || detectedKeypoints.length < 17) {
      droppedFrameCountRef.current += 1;
      return;
    }

    const currentKeypoints = normalizePoseKeypoints(detectedKeypoints);

    const presenceMinScore = Math.max(0.2, motionConfig.minScore);
    const minimumReliableKeypoints = Math.max(
      MIN_RELIABLE_KEYPOINTS_FALLBACK,
      Math.min(MIN_RELIABLE_KEYPOINTS, PERSON_PRESENCE_MIN_KEYPOINTS + 3)
    );
    const presence = isPersonPresent(currentKeypoints, presenceMinScore);
    if (!presence.detected || presence.confidentCount < minimumReliableKeypoints) {
      consecutiveAbsentFramesRef.current += 1;

      if (consecutiveAbsentFramesRef.current >= PERSON_ABSENT_GRACE_FRAMES) {
        if (prevKeypointsRef.current !== null) {
          prevKeypointsRef.current = null;
          prevRealtimeElbowAvgRef.current = null;
          calibrationFrameCountRef.current = 0;
          calibrationSumsRef.current = {
            leftWristAbsDelta: 0,
            rightWristAbsDelta: 0,
            hipAbsDelta: 0,
          };
          if (lastOverlayUpdateRef.current !== 0) {
            lastOverlayUpdateRef.current = 0;
            setOverlayKeypoints([]);
          }
          if (lastFeedbackRef.current !== 'No person detected') {
            lastFeedbackRef.current = 'No person detected';
            setFeedback('No person detected');
          }
          if (lastMotionStatusRef.current !== 'No person|0') {
            lastMotionStatusRef.current = 'No person|0';
            setMotionStatus({ detected: false, label: 'No person' });
          }
          if (lastActivityStatusRef.current !== 'Auto: no person|0') {
            lastActivityStatusRef.current = 'Auto: no person|0';
            setActivityStatus({ detected: false, label: 'Auto: no person' });
          }
          if (repsRef.current !== 0) {
            repsRef.current = 0;
            setReps(0);
          }
          if (repPhaseRef.current !== 'hold') {
            repPhaseRef.current = 'hold';
            setRepPhase('hold');
          }
        }
      }
      droppedFrameCountRef.current += 1;
      return;
    }

    consecutiveAbsentFramesRef.current = 0;

    if (exercise === 'bicepCurl') {
      const result = updateBicepCurl(currentKeypoints);

      if (result.repCount !== repCountRef.current) {
        repCountRef.current = result.repCount;
        setRepCount(result.repCount);
      }

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== phaseRef.current) {
        phaseRef.current = result.phase;
        setPhase(result.phase);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      const roundedAngle = Math.round(result.elbowAngle);
      if (roundedAngle !== elbowAngleRef.current) {
        elbowAngleRef.current = roundedAngle;
        setElbowAngle(roundedAngle);
      }
    } else {
      const jointAngles = calculateJointAngles(currentKeypoints, motionConfig.minScore, angleScope);
      const repResult = updateRepCounter(exercise, jointAngles, currentKeypoints);
      if (repResult.repCount !== repsRef.current) {
        repsRef.current = repResult.repCount;
        setReps(repResult.repCount);
      }
      if (repResult.phase !== repPhaseRef.current) {
        repPhaseRef.current = repResult.phase;
        setRepPhase(repResult.phase);
      }
    }

    const previous = prevKeypointsRef.current;
    const overlayChanged =
      !previous ||
      previous.length !== currentKeypoints.length ||
      currentKeypoints.some((point, index) => {
        const prevPoint = previous[index];
        if (!prevPoint) {
          return true;
        }

        return (
          Math.abs(point.x - prevPoint.x) > KEYPOINT_POSITION_EPSILON ||
          Math.abs(point.y - prevPoint.y) > KEYPOINT_POSITION_EPSILON ||
          Math.abs(point.score - prevPoint.score) > KEYPOINT_SCORE_EPSILON
        );
      });

    if (overlayChanged && (now - lastOverlayUpdateRef.current >= OVERLAY_MIN_INTERVAL_MS)) {
      lastOverlayUpdateRef.current = now;

      const overlaySnapshot = overlaySnapshotBufferRef.current;
      const overlayLength = Math.min(currentKeypoints.length, overlaySnapshot.length);
      for (let index = 0; index < overlayLength; index += 1) {
        overlaySnapshot[index].x = currentKeypoints[index].x;
        overlaySnapshot[index].y = currentKeypoints[index].y;
        overlaySnapshot[index].score = currentKeypoints[index].score;
      }

      const nextOverlay: PoseKeypoint[] = new Array(overlayLength);
      for (let index = 0; index < overlayLength; index += 1) {
        const point = overlaySnapshot[index];
        nextOverlay[index] = {
          x: point.x,
          y: point.y,
          score: point.score,
        };
      }
      setOverlayKeypoints(nextOverlay);
    }

    if (previous) {
      const currentThresholds = activeThresholdsRef.current;
      const effectiveMinScore = Math.min(currentThresholds.minScore, motionConfig.minScore + 0.03);
      const effectiveHandThreshold = Math.min(currentThresholds.handThreshold, motionConfig.handThreshold * 1.4);
      const effectiveHipThreshold = Math.min(currentThresholds.hipThreshold, motionConfig.hipThreshold * 1.4);
      const effectiveRawDeltaThreshold = Math.min(
        currentThresholds.rawDeltaThreshold,
        motionConfig.rawDeltaThreshold * 1.4
      );

      const motion = analyzeMotion(previous, currentKeypoints, {
        minScore: effectiveMinScore,
        handThreshold: effectiveHandThreshold,
        hipThreshold: effectiveHipThreshold,
        angleScope,
        smoothedBuffer: analysisSmoothingBufferRef.current,
      });

      const leftWristDeltaY = currentKeypoints[9].y - previous[9].y;
      const rightWristDeltaY = currentKeypoints[10].y - previous[10].y;
      const prevHipY = (previous[11].y + previous[12].y) * 0.5;
      const currentHipY = (currentKeypoints[11].y + currentKeypoints[12].y) * 0.5;
      const hipDeltaY = currentHipY - prevHipY;
      const hasRawMovement =
        Math.abs(leftWristDeltaY) > effectiveRawDeltaThreshold ||
        Math.abs(rightWristDeltaY) > effectiveRawDeltaThreshold ||
        Math.abs(hipDeltaY) > effectiveRawDeltaThreshold;
      const hasBodyMovement =
        Math.abs(hipDeltaY) > Math.min(effectiveHipThreshold, motionConfig.hipThreshold * 1.2);

      const calibrationFrames = calibrationFrameCountRef.current;
      if (calibrationFrames < 30) {
        calibrationFrameCountRef.current += 1;
        calibrationSumsRef.current.leftWristAbsDelta += Math.abs(leftWristDeltaY);
        calibrationSumsRef.current.rightWristAbsDelta += Math.abs(rightWristDeltaY);
        calibrationSumsRef.current.hipAbsDelta += Math.abs(hipDeltaY);

        if (calibrationFrameCountRef.current % 5 === 0) {
          const calibrationLabel = `Calibrating motion... ${calibrationFrameCountRef.current}/30`;
          if (calibrationLabel !== lastCalibrationStatusRef.current) {
            lastCalibrationStatusRef.current = calibrationLabel;
            setCalibrationStatus(calibrationLabel);
          }
        }

        if (calibrationFrameCountRef.current === 30) {
          const avgLeft = calibrationSumsRef.current.leftWristAbsDelta / 30;
          const avgRight = calibrationSumsRef.current.rightWristAbsDelta / 30;
          const avgHip = calibrationSumsRef.current.hipAbsDelta / 30;
          const avgWrist = (avgLeft + avgRight) * 0.5;

          activeThresholdsRef.current = {
            minScore: motionConfig.minScore,
            handThreshold: Math.max(
              0.003,
              Math.min(motionConfig.handThreshold * 1.25, avgWrist * 2.2)
            ),
            hipThreshold: Math.max(
              0.0025,
              Math.min(motionConfig.hipThreshold * 1.25, avgHip * 2.2)
            ),
            rawDeltaThreshold: Math.max(
              0.0018,
              Math.min(
                motionConfig.rawDeltaThreshold * 1.25,
                Math.max(avgWrist, avgHip) * 1.9
              )
            ),
          };
          if (lastCalibrationStatusRef.current !== 'Calibration complete') {
            lastCalibrationStatusRef.current = 'Calibration complete';
            setCalibrationStatus('Calibration complete');
          }
        }
      }

      const nextCameraGuide = getCameraGuideText(currentKeypoints);
      if (nextCameraGuide !== lastCameraGuideRef.current) {
        lastCameraGuideRef.current = nextCameraGuide;
        setCameraGuide(nextCameraGuide);
      }

      motionFrameCountRef.current += 1;

      let nextFeedback = 'Hold steady';
      if (motion.bodyVerticalMovement === 'down') {
        nextFeedback = 'Body moving down';
      } else if (motion.bodyVerticalMovement === 'up') {
        nextFeedback = 'Body moving up';
      } else if (
        motion.handMovement.leftWrist !== 'stable' ||
        motion.handMovement.rightWrist !== 'stable'
      ) {
        nextFeedback = 'Hands moving';
      }

      if (nextFeedback === 'Hold steady' && (hasRawMovement || hasBodyMovement)) {
        nextFeedback = 'Movement detected';
      }

      if (nextFeedback !== lastFeedbackRef.current) {
        lastFeedbackRef.current = nextFeedback;
        setFeedback(nextFeedback);
      }

      let motionLabel = 'No movement';
      let isDetected = false;
      if (motion.bodyVerticalMovement === 'down') {
        motionLabel = 'Body moving down';
        isDetected = true;
      } else if (motion.bodyVerticalMovement === 'up') {
        motionLabel = 'Body moving up';
        isDetected = true;
      } else if (motion.handMovement.leftWrist === 'up' || motion.handMovement.rightWrist === 'up') {
        motionLabel = 'Hand moving up';
        isDetected = true;
      } else if (motion.handMovement.leftWrist === 'down' || motion.handMovement.rightWrist === 'down') {
        motionLabel = 'Hand moving down';
        isDetected = true;
      } else if (hasBodyMovement) {
        motionLabel = 'Body moving';
        isDetected = true;
      } else if (hasRawMovement) {
        motionLabel = 'Movement detected';
        isDetected = true;
      }

      const statusSignature = `${motionLabel}|${isDetected ? 1 : 0}`;
      if (statusSignature !== lastMotionStatusRef.current) {
        lastMotionStatusRef.current = statusSignature;
        setMotionStatus({
          detected: isDetected,
          label: motionLabel,
        });
      }

      const avgElbowAngle =
        motion.angles.leftElbow !== null && motion.angles.rightElbow !== null
          ? (motion.angles.leftElbow + motion.angles.rightElbow) * 0.5
          : motion.angles.leftElbow ?? motion.angles.rightElbow;

      if (motionFrameCountRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        const nextDetectSummary = `Detected ${currentKeypoints.length}/17 keypoints`;
        if (nextDetectSummary !== lastDetectSummaryRef.current) {
          lastDetectSummaryRef.current = nextDetectSummary;
          setDetectSummary(nextDetectSummary);
        }

        if (avgElbowAngle === null) {
          const nextElbowSummary = 'Elbow scan: low confidence / not visible';
          if (nextElbowSummary !== lastElbowScanSummaryRef.current) {
            lastElbowScanSummaryRef.current = nextElbowSummary;
            setElbowScanSummary(nextElbowSummary);
          }
        } else {
          let elbowMovement = 'stable';
          if (prevRealtimeElbowAvgRef.current !== null) {
            const elbowDelta = avgElbowAngle - prevRealtimeElbowAvgRef.current;
            if (elbowDelta > 1.2) elbowMovement = 'extending';
            else if (elbowDelta < -1.2) elbowMovement = 'bending';
          }
          prevRealtimeElbowAvgRef.current = avgElbowAngle;

          const leftLabel =
            motion.angles.leftElbow !== null ? motion.angles.leftElbow.toFixed(1) : '--';
          const rightLabel =
            motion.angles.rightElbow !== null ? motion.angles.rightElbow.toFixed(1) : '--';
          const nextElbowSummary = `Elbows L:${leftLabel}° R:${rightLabel}° (${elbowMovement})`;
          if (nextElbowSummary !== lastElbowScanSummaryRef.current) {
            lastElbowScanSummaryRef.current = nextElbowSummary;
            setElbowScanSummary(nextElbowSummary);
          }
        }
      }

      const avgKneeAngle =
        motion.angles.leftKnee !== null && motion.angles.rightKnee !== null
          ? (motion.angles.leftKnee + motion.angles.rightKnee) * 0.5
          : motion.angles.leftKnee ?? motion.angles.rightKnee;

      let activityLabel = 'Auto: no movement';
      let activityDetected = false;

      if (exercise === 'squat') {
        if (
          (motion.bodyVerticalMovement === 'down' || motion.bodyVerticalMovement === 'up') &&
          avgKneeAngle !== null &&
          avgKneeAngle < motionConfig.kneeBentThreshold
        ) {
          activityLabel = 'Auto: squat movement';
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: lower-body movement';
          activityDetected = true;
        }
      } else if (exercise === 'lunge') {
        if (
          (motion.bodyVerticalMovement === 'down' || motion.bodyVerticalMovement === 'up') &&
          avgKneeAngle !== null &&
          avgKneeAngle < motionConfig.kneeBentThreshold
        ) {
          activityLabel = 'Auto: lunge movement';
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: lower-body movement';
          activityDetected = true;
        }
      } else if (exercise === 'pushup') {
        if (
          avgElbowAngle !== null &&
          (motion.handMovement.leftWrist !== 'stable' ||
            motion.handMovement.rightWrist !== 'stable' ||
            motion.bodyVerticalMovement !== 'stable')
        ) {
          if (avgElbowAngle < motionConfig.elbowBentThreshold) {
            activityLabel = 'Auto: pushup movement';
          } else {
            activityLabel = 'Auto: upper-body movement';
          }
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: body movement detected';
          activityDetected = true;
        }
      } else if (exercise === 'bicepCurl') {
        const elbowFlexed = avgElbowAngle !== null && avgElbowAngle < motionConfig.elbowBentThreshold;
        const wristMoved =
          motion.handMovement.leftWrist !== 'stable' ||
          motion.handMovement.rightWrist !== 'stable';

        if (elbowFlexed && wristMoved) {
          activityLabel = 'Auto: bicep curl movement';
          activityDetected = true;
        } else if (wristMoved || hasRawMovement) {
          activityLabel = 'Auto: arm movement';
          activityDetected = true;
        }
      } else if (exercise === 'plank') {
        if (Math.abs(hipDeltaY) > motionConfig.hipThreshold) {
          activityLabel = 'Auto: plank body shift';
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: core movement';
          activityDetected = true;
        }
      } else if (hasRawMovement) {
        activityLabel = 'Auto: body movement detected';
        activityDetected = true;
      }

      const activitySignature = `${activityLabel}|${activityDetected ? 1 : 0}`;
      if (activitySignature !== lastActivityStatusRef.current) {
        lastActivityStatusRef.current = activitySignature;
        setActivityStatus({
          detected: activityDetected,
          label: activityLabel,
        });
      }
    }

    prevKeypointsRef.current = currentKeypoints;
  }, [angleScope, exercise, getCameraGuideText, isDetectingContinuous, isPersonPresent, motionConfig, normalizePoseKeypoints]);

  // Frame Processor: detect pose and write into shared value only (no runOnJS).
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    try {
      if (!isDetectingContinuous) {
        return;
      }

      if (detectPosePlugin == null) {
        return;
      }

      workletFrameCounter.value = workletFrameCounter.value + 1;
      if (workletFrameCounter.value % WORKLET_INFERENCE_EVERY_N_FRAMES !== 0) {
        return;
      }

      if (frame.width <= 0 || frame.height <= 0) {
        return;
      }

      const detectedResult = detectPosePlugin.call(frame) as unknown;
      if (!detectedResult) {
        return;
      }

      sharedPoseKeypoints.value = detectedResult as PoseKeypoint[];
      sharedPoseVersion.value = sharedPoseVersion.value + 1;
    } catch {
      return;
    }
  }, [
    detectPosePlugin,
    isDetectingContinuous,
    workletFrameCounter,
  ]);

  // JS polling loop: consume latest shared pose at ~6 FPS and call updatePose on JS only.
  useEffect(() => {
    if (!isDetectingContinuous) {
      return;
    }

    const interval = setInterval(() => {
      const nextVersion = sharedPoseVersion.value;
      if (nextVersion === lastConsumedPoseVersionRef.current) {
        return;
      }

      const latestPose = sharedPoseKeypoints.value;
      lastConsumedPoseVersionRef.current = nextVersion;
      if (!latestPose || latestPose.length < 17) {
        return;
      }

      updatePose(latestPose);
    }, JS_POSE_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [isDetectingContinuous, sharedPoseKeypoints, sharedPoseVersion, updatePose]);

  // Initialize camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await Camera.requestCameraPermission();
        setPermission(status);
      } catch {
        setCameraError('Failed to request camera permission');
        setPermission('denied');
      }
    };

    checkPermission();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isPaused && isFocused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isFocused]);

  // Memoized exercise title
  const exerciseTitle = useMemo(() => EXERCISE_LABELS[exercise], [exercise]);

  // Utility functions
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFlipCamera = () => setIsFrontCamera(!isFrontCamera);

  const handlePause = () => {
    setIsPaused(!isPaused);
    const nextFeedback = isPaused ? 'Keep Going!' : 'Paused';
    lastFeedbackRef.current = nextFeedback;
    setFeedback(nextFeedback);
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      `You completed ${reps} reps in ${formatTime(seconds)}. Are you sure you want to end?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDetectPose = () => {
    setIsDetectingContinuous((previous) => {
      const next = !previous;
      if (next) {
        resetRepCounter(exercise);
        if (exercise === 'bicepCurl') {
          resetBicepCurlDetector();
        }
        setReps(0);
        setRepPhase('hold');
        setRepCount(0);
        setPhase('up');
        setElbowAngle(0);
        repCountRef.current = 0;
        phaseRef.current = 'up';
        elbowAngleRef.current = 0;
        repsRef.current = 0;
        repPhaseRef.current = 'hold';
        prevKeypointsRef.current = null;
        prevRealtimeElbowAvgRef.current = null;
        prevManualElbowAvgRef.current = null;
        motionFrameCountRef.current = 0;
        droppedFrameCountRef.current = 0;
        consecutiveAbsentFramesRef.current = 0;
        lastAnalysisAtRef.current = 0;
        lastOverlayUpdateRef.current = 0;
        lastConsumedPoseVersionRef.current = 0;
        workletFrameCounter.value = 0;
        sharedPoseVersion.value = 0;
        sharedPoseKeypoints.value = null;
        setOverlayKeypoints([]);
        setDetectSummary('Starting continuous detection...');
        setElbowScanSummary('Elbow scan: waiting');
      } else {
        prevKeypointsRef.current = null;
        setDetectSummary('Detection stopped');
      }
      return next;
    });
  };

  // Permission/Loading States
  if (cameraError) {
    return (
      <PermissionScreen
        title="Camera Error"
        subtitle={cameraError}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  if (permission === 'loading') {
    return (
      <PermissionScreen
        title="Loading Camera..."
        subtitle="Please wait while we initialize the camera"
        showLoader
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  if (permission === 'denied') {
    return (
      <PermissionScreen
        title="Camera Access Denied"
        subtitle="Please enable camera permissions in your device settings to start your workout."
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  if (!device) {
    return (
      <PermissionScreen
        title="Loading Camera..."
        subtitle="Preparing camera device..."
        showLoader
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  // Main Workout Screen
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={cameraFormat}
        isActive={isFocused && !isPaused}
        pixelFormat="yuv"
        photo
        frameProcessor={frameProcessor}
      />

      <PoseOverlay keypoints={overlayKeypoints} />

      {exercise === 'bicepCurl' && (
        <View style={styles.bicepOverlay} pointerEvents="none">
          <Text style={styles.bicepTitle}>BICEP CURL</Text>
          <Text style={styles.bicepRep}>{repCount}</Text>
          <Text style={styles.bicepMeta}>Phase: {phase}</Text>
          <Text style={styles.bicepAngle}>Angle: {elbowAngle}°</Text>
        </View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.exerciseTitle}>{exerciseTitle}</Text>
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>
            <View style={styles.topRight}>
              <TouchableOpacity 
                style={styles.flipButton}
                onPress={handleFlipCamera}
                activeOpacity={0.7}
              >
                <Text style={styles.flipButtonText}>⇄</Text>
              </TouchableOpacity>
              <View style={[styles.topBadge, isPaused && styles.topBadgePaused]}>
                <Text style={[styles.topBadgeText, isPaused && styles.topBadgeTextPaused]}>
                  {isPaused ? 'Paused' : 'Live'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.cornerRow}>
            <View style={styles.cornerItem}>
              <Text style={styles.cornerLabel}>Reps</Text>
              <Text style={styles.cornerValue}>{reps}</Text>
            </View>
            <View style={styles.cornerItem}>
              <Text style={styles.cornerLabel}>Accuracy</Text>
              <Text style={styles.cornerValue}>
                {accuracy !== null ? `${accuracy}%` : '--'}
              </Text>
            </View>
          </View>

          {/* Center Feedback */}
          <View style={styles.feedbackContainer} pointerEvents="none">
            <Text style={styles.feedbackText}>{feedback}</Text>
            <View
              style={[
                styles.motionStatusBadge,
                motionStatus.detected
                  ? styles.motionStatusBadgeDetected
                  : styles.motionStatusBadgeIdle,
              ]}
            >
              <Text
                style={[
                  styles.motionStatusTitle,
                  motionStatus.detected
                    ? styles.motionStatusTitleDetected
                    : styles.motionStatusTitleIdle,
                ]}
              >
                Motion Detected: {motionStatus.detected ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.motionStatusText}>{motionStatus.label}</Text>
            </View>
            <View
              style={[
                styles.motionStatusBadge,
                activityStatus.detected
                  ? styles.motionStatusBadgeDetected
                  : styles.motionStatusBadgeIdle,
              ]}
            >
              <Text
                style={[
                  styles.motionStatusTitle,
                  activityStatus.detected
                    ? styles.motionStatusTitleDetected
                    : styles.motionStatusTitleIdle,
                ]}
              >
                Activity: {activityStatus.detected ? 'DETECTED' : 'IDLE'}
              </Text>
              <Text style={styles.motionStatusText}>{activityStatus.label}</Text>
            </View>
            <View style={styles.detectStatusBadge}>
              <Text style={styles.detectStatusTitle}>Detect Result</Text>
              <Text style={styles.detectStatusText}>{detectSummary}</Text>
              <Text style={styles.detectStatusText}>{elbowScanSummary}</Text>
              <Text style={styles.detectStatusText}>Rep phase: {repPhase}</Text>
              <Text style={styles.detectStatusText}>{calibrationStatus}</Text>
              <Text style={styles.detectStatusText}>{cameraGuide}</Text>
            </View>
          </View>

          {/* Bottom Controls */}
          <View>
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={handlePause}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handleEndWorkout}
              >
                <Text style={styles.primaryButtonText}>End Workout</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.detectButton}
              activeOpacity={0.85}
              onPress={handleDetectPose}
            >
              <Text style={styles.detectButtonText}>
                {isDetectingContinuous ? 'Stop Detection' : 'Detect Pose'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ===== MAIN LAYOUT =====
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  poseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bicepOverlay: {
    position: 'absolute',
    top: 84,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bicepTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bicepRep: {
    color: ACCENT,
    fontSize: 54,
    fontWeight: '900',
    marginTop: 6,
  },
  bicepMeta: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  bicepAngle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    justifyContent: 'space-between',
    marginTop: 45,
  },

  // ===== TOP BAR =====
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: OVERLAY_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OVERLAY_SUBTLE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${ACCENT}44`,
    paddingBottom: 4,
  },
  flipButtonText: {
    fontSize: 20,
    color: ACCENT,
    fontWeight: '700',
  },

  // ===== STATUS BADGE =====
  topBadge: {
    backgroundColor: `${ACCENT}22`,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${ACCENT}55`,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  topBadgePaused: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  topBadgeTextPaused: {
    color: '#FF9800',
  },

  // ===== STATS ROW =====
  cornerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cornerItem: {
    backgroundColor: OVERLAY_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS,
    minWidth: 120,
  },
  cornerLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cornerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },

  // ===== FEEDBACK AREA =====
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: OVERLAY_LIGHT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
  },
  motionStatusBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${ACCENT}66`,
    minWidth: 220,
    alignItems: 'center',
  },
  motionStatusBadgeDetected: {
    borderColor: 'rgba(34,197,94,0.85)',
    backgroundColor: 'rgba(34,197,94,0.18)',
  },
  motionStatusBadgeIdle: {
    borderColor: 'rgba(156,163,175,0.55)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  motionStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  motionStatusTitleDetected: {
    color: '#22C55E',
  },
  motionStatusTitleIdle: {
    color: '#9CA3AF',
  },
  motionStatusText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  detectStatusBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${ACCENT}66`,
    minWidth: 260,
    alignItems: 'center',
  },
  detectStatusTitle: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },
  detectStatusText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  debugHud: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 290,
    borderWidth: 1,
    borderColor: `${ACCENT}55`,
  },
  debugTitle: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  debugText: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 2,
  },

  // ===== BUTTONS =====
  bottomBar: {
    flexDirection: 'row',
    gap: GAP,
  },
  detectButton: {
    marginTop: 10,
    backgroundColor: ACCENT,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detectButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: OVERLAY_MEDIUM,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: ACCENT,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },

  // ===== PERMISSION STATES =====
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  permissionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
