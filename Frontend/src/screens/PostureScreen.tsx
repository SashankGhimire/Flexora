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
import { BicepViewMode, resetBicepCurlDetector, updateBicepCurl } from '../ai/bicepCurlDetector';
import { resetJumpingJackDetector, updateJumpingJack } from '../ai/jumpingJackDetector';
import { resetPushupDetector, updatePushup } from '../ai/pushupDetector';
import { resetShoulderPressDetector, updateShoulderPress } from '../ai/shoulderPressDetector';
import { resetStandingKneeRaiseDetector, updateStandingKneeRaise } from '../ai/standingKneeRaiseDetector';
import { resetSquatDetector, SquatViewMode, updateSquat } from '../ai/squatDetector';
import { saveWorkoutSession } from '../services/sessionService';
import { Colors } from '../theme/colors';
import { ExerciseType, HomeStackParamList } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

// Constants
const ACCENT = Colors.primaryDark;
const SOFT_ACCENT = Colors.primaryLight;
const OVERLAY_LIGHT = Colors.blackA56;
const OVERLAY_MEDIUM = Colors.blackA58;
const OVERLAY_SUBTLE = Colors.blackA46;
const GAP = 12;
const BORDER_RADIUS = 14;
const DEBUG_MIN_SCORE = 0.25;
const DEBUG_HAND_THRESHOLD = 0.012;
const DEBUG_HIP_THRESHOLD = 0.009;
const RAW_DELTA_THRESHOLD = 0.005;
const UI_UPDATE_EVERY_N_FRAMES = 3;
const WORKLET_INFERENCE_EVERY_N_FRAMES = 4;
const JS_POSE_POLL_INTERVAL_MS = 90;
const KNEE_RAISE_POSE_POLL_INTERVAL_MS = 55;
const ANALYSIS_THROTTLE_MS = 180;
const KNEE_RAISE_ANALYSIS_THROTTLE_MS = 90;
const OVERLAY_MIN_INTERVAL_MS = 100;
const SMOOTHING_WINDOW_SIZE = 5;
const KEYPOINT_POSITION_EPSILON = 0.002;
const KEYPOINT_SCORE_EPSILON = 0.02;
const PERSON_PRESENCE_MIN_SCORE = 0.3;
const PERSON_PRESENCE_MIN_KEYPOINTS = 4;
const PERSON_ABSENT_GRACE_FRAMES = 5;
const MIN_RELIABLE_KEYPOINTS = 10;
const MIN_RELIABLE_KEYPOINTS_FALLBACK = 7;
const MIN_UPPER_BODY_SCORE = 0.2;

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
  shoulderPress: { elbows: true, knees: false },
  jumpingJack: { elbows: false, knees: false },
  standingKneeRaise: { elbows: false, knees: true },
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
        <Circle key={circle.key} cx={circle.cx} cy={circle.cy} r={3} fill={Colors.successA75} />
      ))}
    </Svg>
  );
});

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  squat: 'Squats',
  pushup: 'Pushups',
  shoulderPress: 'Shoulder Press',
  jumpingJack: 'Jumping Jacks',
  standingKneeRaise: 'Standing Knee Raise',
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
  shoulderPress: {
    minScore: 0.25,
    handThreshold: 0.01,
    hipThreshold: 0.006,
    rawDeltaThreshold: 0.004,
    kneeBentThreshold: 155,
    elbowBentThreshold: 138,
  },
  jumpingJack: {
    minScore: 0.24,
    handThreshold: 0.01,
    hipThreshold: 0.008,
    rawDeltaThreshold: 0.0045,
    kneeBentThreshold: 150,
    elbowBentThreshold: 130,
  },
  standingKneeRaise: {
    minScore: 0.22,
    handThreshold: 0.008,
    hipThreshold: 0.006,
    rawDeltaThreshold: 0.004,
    kneeBentThreshold: 145,
    elbowBentThreshold: 130,
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
  const logTag = '[PostureScreen]';

  // Camera Devices
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');

  // State Management (All useState hooks first)
  const [permission, setPermission] = useState('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [reps, setReps] = useState(0);
  const [repPhase, setRepPhase] = useState('hold');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Get Ready');
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetectingContinuous, setIsDetectingContinuous] = useState(false);
  const [bicepViewMode, setBicepViewMode] = useState<BicepViewMode>('side');
  const [squatViewMode, setSquatViewMode] = useState<SquatViewMode>('side');
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<'up' | 'down'>('up');
  const [elbowAngle, setElbowAngle] = useState(0);
  const [rom, setRom] = useState(0);
  const [repSpeed, setRepSpeed] = useState(0);
  const [maxAngle, setMaxAngle] = useState(0);
  const [minAngle, setMinAngle] = useState(0);
  const [squatRepCount, setSquatRepCount] = useState(0);
  const [squatPhase, setSquatPhase] = useState<'up' | 'down'>('up');
  const [squatKneeAngle, setSquatKneeAngle] = useState(0);
  const [squatRom, setSquatRom] = useState(0);
  const [squatAccuracy, setSquatAccuracy] = useState(0);
  const [kneeRaiseRepCount, setKneeRaiseRepCount] = useState(0);
  const [kneeRaisePhase, setKneeRaisePhase] = useState<'up' | 'down'>('down');
  const [kneeRaiseLift, setKneeRaiseLift] = useState(0);
  const [kneeRaiseAccuracy, setKneeRaiseAccuracy] = useState(0);
  const [lungeRepCount, setLungeRepCount] = useState(0);
  const [lungePhase, setLungePhase] = useState<'up' | 'down'>('up');
  const [lungeLeftKneeAngle, setLungeLeftKneeAngle] = useState(180);
  const [lungeRightKneeAngle, setLungeRightKneeAngle] = useState(180);
  const [lungeHipDrop, setLungeHipDrop] = useState(0);
  const [jumpingJackRepCount, setJumpingJackRepCount] = useState(0);
  const [jumpingJackPhase, setJumpingJackPhase] = useState<'open' | 'close'>('close');
  const [jumpingJackAnkleDistance, setJumpingJackAnkleDistance] = useState(0);
  const [pushupRepCount, setPushupRepCount] = useState(0);
  const [pushupPhase, setPushupPhase] = useState<'up' | 'down'>('up');
  const [pushupLeftElbowAngle, setPushupLeftElbowAngle] = useState(180);
  const [pushupRightElbowAngle, setPushupRightElbowAngle] = useState(180);
  const [pushupAvgElbowAngle, setPushupAvgElbowAngle] = useState(180);
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
  const [detectPosePlugin, setDetectPosePlugin] = useState(() =>
    VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})
  );

  // Refs (All useRef after useState)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const prevKeypointsRef = useRef<PoseKeypoint[] | null>(null);
  const repCountRef = useRef(0);
  const phaseRef = useRef<'up' | 'down'>('up');
  const elbowAngleRef = useRef(0);
  const romRef = useRef(0);
  const repSpeedRef = useRef(0);
  const bicepSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const squatSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const pushupSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const lungeSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const jumpingJackSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const kneeRaiseSpeedFeedbackRef = useRef<'Too fast' | 'Too slow' | 'Controlled'>('Controlled');
  const accuracyRef = useRef(0);
  const maxAngleRef = useRef(0);
  const minAngleRef = useRef(0);
  const bicepUiSnapshotRef = useRef({
    elbowAngle: 0,
    rom: 0,
    repSpeed: 0,
    accuracy: 0,
    maxAngle: 0,
    minAngle: 0,
  });
  const bicepUiTickRef = useRef(0);
  const squatRepCountRef = useRef(0);
  const squatPhaseRef = useRef<'up' | 'down'>('up');
  const squatKneeAngleRef = useRef(0);
  const squatRomRef = useRef(0);
  const squatAccuracyRef = useRef(0);
  const squatUiTickRef = useRef(0);
  const squatUiSnapshotRef = useRef({
    repCount: 0,
    phase: 'up' as 'up' | 'down',
    kneeAngle: 0,
    rom: 0,
    accuracy: 0,
  });
  const lungeRepCountRef = useRef(0);
  const lungePhaseRef = useRef<'up' | 'down'>('up');
  const lungeLeftKneeAngleRef = useRef(180);
  const lungeRightKneeAngleRef = useRef(180);
  const lungeHipDropRef = useRef(0);
  const lungeUiTickRef = useRef(0);
  const lungeUiSnapshotRef = useRef({
    repCount: 0,
    phase: 'up' as 'up' | 'down',
    leftKneeAngle: 180,
    rightKneeAngle: 180,
    hipDrop: 0,
  });
  const jumpingJackRepCountRef = useRef(0);
  const jumpingJackPhaseRef = useRef<'open' | 'close'>('close');
  const jumpingJackAnkleDistanceRef = useRef(0);
  const jumpingJackUiTickRef = useRef(0);
  const jumpingJackUiSnapshotRef = useRef({
    repCount: 0,
    phase: 'close' as 'open' | 'close',
    ankleDistance: 0,
  });
  const pushupRepCountRef = useRef(0);
  const pushupPhaseRef = useRef<'up' | 'down'>('up');
  const pushupLeftElbowAngleRef = useRef(180);
  const pushupRightElbowAngleRef = useRef(180);
  const pushupAvgElbowAngleRef = useRef(180);
  const pushupUiTickRef = useRef(0);
  const pushupUiSnapshotRef = useRef({
    repCount: 0,
    phase: 'up' as 'up' | 'down',
    leftElbowAngle: 180,
    rightElbowAngle: 180,
    avgElbowAngle: 180,
  });
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
  const smoothedPoseBufferPoolRef = useRef<[PoseKeypoint[], PoseKeypoint[]]>([
    createPoseBuffer(),
    createPoseBuffer(),
  ]);
  const smoothedPoseBufferIndexRef = useRef(0);
  const keypointHistoryBufferRef = useRef<PoseKeypoint[][]>([]);
  const kneeAngleBufferRef = useRef<number[]>([]);
  const elbowAngleBufferRef = useRef<number[]>([]);
  const poseBufferPoolRef = useRef<[PoseKeypoint[], PoseKeypoint[]]>([
    createPoseBuffer(),
    createPoseBuffer(),
  ]);
  const poseBufferIndexRef = useRef(0);
  
  // Shared values (hooks)
  const workletFrameCounter = useSharedValue(0);
  const sharedPoseKeypoints = useSharedValue<PoseKeypoint[] | null>(null);
  const sharedPoseVersion = useSharedValue(0);

  // Camera hooks
  const device = isFrontCamera ? frontCamera : backCamera;
  const lowResFormat = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const hdFallbackFormat = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
  ]);
  const cameraFormat = lowResFormat ?? hdFallbackFormat;

  // Computed values
  const motionConfig = useMemo(() => EXERCISE_MOTION_CONFIG[exercise], [exercise]);
  const angleScope = useMemo(() => EXERCISE_ANGLE_SCOPE[exercise], [exercise]);
  
  const visionPluginAvailable = detectPosePlugin != null;

  useEffect(() => {
    if (!isDetectingContinuous) {
      return;
    }

    if (detectPosePlugin != null) {
      return;
    }

    const pluginMissingSummary = 'Vision plugin unavailable. Check Frame Processor setup.';
    if (lastDetectSummaryRef.current !== pluginMissingSummary) {
      lastDetectSummaryRef.current = pluginMissingSummary;
      setDetectSummary(pluginMissingSummary);
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
    if (exercise === 'jumpingJack') {
      resetJumpingJackDetector();
    }
    if (exercise === 'shoulderPress') {
      resetShoulderPressDetector();
    }
    if (exercise === 'standingKneeRaise') {
      resetStandingKneeRaiseDetector();
    }
    if (exercise === 'pushup') {
      resetPushupDetector();
    }
    if (exercise === 'squat') {
      resetSquatDetector();
    }
    setReps(0);
    setRepPhase('hold');
    setRepCount(0);
    setPhase('up');
    setElbowAngle(0);
    setRom(0);
    setRepSpeed(0);
    setAccuracy(null);
    setMaxAngle(0);
    setMinAngle(0);
    setSquatRepCount(0);
    setSquatPhase('up');
    setSquatKneeAngle(0);
    setSquatRom(0);
    setSquatAccuracy(0);
    setKneeRaiseRepCount(0);
    setKneeRaisePhase('down');
    setKneeRaiseLift(0);
    setKneeRaiseAccuracy(0);
    setLungeRepCount(0);
    setLungePhase('up');
    setLungeLeftKneeAngle(180);
    setLungeRightKneeAngle(180);
    setLungeHipDrop(0);
    setJumpingJackRepCount(0);
    setJumpingJackPhase('close');
    setJumpingJackAnkleDistance(0);
    setPushupRepCount(0);
    setPushupPhase('up');
    setPushupLeftElbowAngle(180);
    setPushupRightElbowAngle(180);
    setPushupAvgElbowAngle(180);
    repCountRef.current = 0;
    phaseRef.current = 'up';
    elbowAngleRef.current = 0;
    romRef.current = 0;
    repSpeedRef.current = 0;
    accuracyRef.current = 0;
    maxAngleRef.current = 0;
    minAngleRef.current = 0;
    bicepUiSnapshotRef.current = {
      elbowAngle: 0,
      rom: 0,
      repSpeed: 0,
      accuracy: 0,
      maxAngle: 0,
      minAngle: 0,
    };
    bicepUiTickRef.current = 0;
    squatRepCountRef.current = 0;
    squatPhaseRef.current = 'up';
    squatKneeAngleRef.current = 0;
    squatRomRef.current = 0;
    squatAccuracyRef.current = 0;
    squatUiTickRef.current = 0;
    squatUiSnapshotRef.current = {
      repCount: 0,
      phase: 'up',
      kneeAngle: 0,
      rom: 0,
      accuracy: 0,
    };
    lungeRepCountRef.current = 0;
    lungePhaseRef.current = 'up';
    lungeLeftKneeAngleRef.current = 180;
    lungeRightKneeAngleRef.current = 180;
    lungeHipDropRef.current = 0;
    lungeUiTickRef.current = 0;
    lungeUiSnapshotRef.current = {
      repCount: 0,
      phase: 'up',
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      hipDrop: 0,
    };
    jumpingJackRepCountRef.current = 0;
    jumpingJackPhaseRef.current = 'close';
    jumpingJackAnkleDistanceRef.current = 0;
    jumpingJackUiTickRef.current = 0;
    jumpingJackUiSnapshotRef.current = {
      repCount: 0,
      phase: 'close',
      ankleDistance: 0,
    };
    pushupRepCountRef.current = 0;
    pushupPhaseRef.current = 'up';
    pushupLeftElbowAngleRef.current = 180;
    pushupRightElbowAngleRef.current = 180;
    pushupAvgElbowAngleRef.current = 180;
    pushupUiTickRef.current = 0;
    pushupUiSnapshotRef.current = {
      repCount: 0,
      phase: 'up',
      leftElbowAngle: 180,
      rightElbowAngle: 180,
      avgElbowAngle: 180,
    };
    repsRef.current = 0;
    repPhaseRef.current = 'hold';
    keypointHistoryBufferRef.current = [];
    kneeAngleBufferRef.current = [];
    elbowAngleBufferRef.current = [];
  }, [exercise]);

  const smoothAngle = useCallback((angle: number, buffer: number[]): number => {
    buffer.push(angle);

    if (buffer.length > SMOOTHING_WINDOW_SIZE) {
      buffer.shift();
    }

    let sum = 0;
    for (let index = 0; index < buffer.length; index += 1) {
      sum += buffer[index];
    }

    return buffer.length > 0 ? sum / buffer.length : angle;
  }, []);

  const smoothKeypoints = useCallback((keypoints: PoseKeypoint[]): PoseKeypoint[] => {
    const history = keypointHistoryBufferRef.current;
    const snapshot: PoseKeypoint[] = new Array(keypoints.length);

    for (let index = 0; index < keypoints.length; index += 1) {
      const point = keypoints[index];
      snapshot[index] = {
        x: point.x,
        y: point.y,
        score: point.score,
      };
    }

    history.push(snapshot);
    if (history.length > SMOOTHING_WINDOW_SIZE) {
      history.shift();
    }

    smoothedPoseBufferIndexRef.current = smoothedPoseBufferIndexRef.current === 0 ? 1 : 0;
    const smoothed = smoothedPoseBufferPoolRef.current[smoothedPoseBufferIndexRef.current];
    const sampleCount = history.length;

    for (let pointIndex = 0; pointIndex < smoothed.length; pointIndex += 1) {
      let sumX = 0;
      let sumY = 0;

      for (let frameIndex = 0; frameIndex < sampleCount; frameIndex += 1) {
        const framePoint = history[frameIndex][pointIndex];
        if (!framePoint) {
          continue;
        }
        sumX += framePoint.x;
        sumY += framePoint.y;
      }

      const divisor = sampleCount > 0 ? sampleCount : 1;
      smoothed[pointIndex].x = sumX / divisor;
      smoothed[pointIndex].y = sumY / divisor;
      smoothed[pointIndex].score = keypoints[pointIndex]?.score ?? 0;
    }

    return smoothed;
  }, []);

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

  const hasReliableBicepPose = useCallback((points: PoseKeypoint[]): boolean => {
    const hasPoint = (index: number, minScore = MIN_UPPER_BODY_SCORE) => {
      const point = points[index];
      return !!point && point.score >= minScore;
    };

    const leftArmReady = hasPoint(5) && hasPoint(7) && hasPoint(9);
    const rightArmReady = hasPoint(6) && hasPoint(8) && hasPoint(10);
    return leftArmReady || rightArmReady;
  }, []);

  const hasReliableStandingKneeRaisePose = useCallback((points: PoseKeypoint[]): boolean => {
    const hasPoint = (index: number, minScore = 0.1) => {
      const point = points[index];
      return !!point && point.score >= minScore;
    };

    const hasCore = hasPoint(11) || hasPoint(12);
    const hasLegJoint = hasPoint(13) || hasPoint(14) || hasPoint(15) || hasPoint(16);
    return hasCore && hasLegJoint;
  }, []);

  const updatePose = useCallback((detectedKeypoints: PoseKeypoint[]) => {
    if (!isDetectingContinuous) {
      return;
    }

    const now = Date.now();
    const analysisThrottleMs = exercise === 'standingKneeRaise'
      ? KNEE_RAISE_ANALYSIS_THROTTLE_MS
      : ANALYSIS_THROTTLE_MS;
    if (now - lastAnalysisAtRef.current < analysisThrottleMs) {
      return;
    }
    lastAnalysisAtRef.current = now;

    if (!detectedKeypoints || detectedKeypoints.length < 17) {
      droppedFrameCountRef.current += 1;
      return;
    }

    const currentKeypoints = normalizePoseKeypoints(detectedKeypoints);
    const smoothedKeypoints = smoothKeypoints(currentKeypoints);

    const isStandingKneeRaise = exercise === 'standingKneeRaise';
    const presenceMinScore = isStandingKneeRaise
      ? Math.max(0.1, motionConfig.minScore - 0.12)
      : Math.max(0.2, motionConfig.minScore);
    const minimumReliableKeypoints = isStandingKneeRaise
      ? 4
      : Math.max(
          MIN_RELIABLE_KEYPOINTS_FALLBACK,
          Math.min(MIN_RELIABLE_KEYPOINTS, PERSON_PRESENCE_MIN_KEYPOINTS + 3)
        );
    const presence = isPersonPresent(currentKeypoints, presenceMinScore);
    const hasReliablePose = exercise === 'bicepCurl'
      ? hasReliableBicepPose(currentKeypoints)
      : exercise === 'standingKneeRaise'
        ? hasReliableStandingKneeRaisePose(currentKeypoints) ||
          (presence.detected && presence.confidentCount >= minimumReliableKeypoints)
        : presence.detected && presence.confidentCount >= minimumReliableKeypoints;

    if (!hasReliablePose) {
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
      const bicepAngles = calculateJointAngles(
        smoothedKeypoints,
        motionConfig.minScore,
        EXERCISE_ANGLE_SCOPE.bicepCurl
      );
      const rawElbowAngle =
        bicepAngles.leftElbow !== null && bicepAngles.rightElbow !== null
          ? (bicepAngles.leftElbow + bicepAngles.rightElbow) * 0.5
          : bicepAngles.leftElbow ?? bicepAngles.rightElbow;
      const smoothedElbowAngle =
        rawElbowAngle !== null
          ? smoothAngle(rawElbowAngle, elbowAngleBufferRef.current)
          : null;

      const result = updateBicepCurl(smoothedKeypoints, { viewMode: bicepViewMode });
      bicepUiTickRef.current += 1;

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

      const roundedAngle = Math.round(smoothedElbowAngle ?? result.elbowAngle);
      if (roundedAngle !== elbowAngleRef.current) {
        elbowAngleRef.current = roundedAngle;
      }

      const roundedRom = Math.round(result.rom);
      if (roundedRom !== romRef.current) {
        romRef.current = roundedRom;
      }

      const roundedSpeed = Math.round(result.repSpeed * 10) / 10;
      if (roundedSpeed !== repSpeedRef.current) {
        repSpeedRef.current = roundedSpeed;
      }

      const roundedAccuracy = Math.round(result.accuracy);
      if (roundedAccuracy !== accuracyRef.current) {
        accuracyRef.current = roundedAccuracy;
      }

      const roundedMaxAngle = Math.round(result.maxAngle);
      if (roundedMaxAngle !== maxAngleRef.current) {
        maxAngleRef.current = roundedMaxAngle;
      }

      const roundedMinAngle = Math.round(result.minAngle);
      if (roundedMinAngle !== minAngleRef.current) {
        minAngleRef.current = roundedMinAngle;
      }

      bicepSpeedFeedbackRef.current = result.speedFeedback;

      if (bicepUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (elbowAngleRef.current !== bicepUiSnapshotRef.current.elbowAngle) {
          bicepUiSnapshotRef.current.elbowAngle = elbowAngleRef.current;
          setElbowAngle(elbowAngleRef.current);
        }
        if (romRef.current !== bicepUiSnapshotRef.current.rom) {
          bicepUiSnapshotRef.current.rom = romRef.current;
          setRom(romRef.current);
        }
        if (repSpeedRef.current !== bicepUiSnapshotRef.current.repSpeed) {
          bicepUiSnapshotRef.current.repSpeed = repSpeedRef.current;
          setRepSpeed(repSpeedRef.current);
        }
        const nextAccuracy = accuracyRef.current;
        if (nextAccuracy !== bicepUiSnapshotRef.current.accuracy) {
          bicepUiSnapshotRef.current.accuracy = nextAccuracy;
          setAccuracy(nextAccuracy);
        }
        if (maxAngleRef.current !== bicepUiSnapshotRef.current.maxAngle) {
          bicepUiSnapshotRef.current.maxAngle = maxAngleRef.current;
          setMaxAngle(maxAngleRef.current);
        }
        if (minAngleRef.current !== bicepUiSnapshotRef.current.minAngle) {
          bicepUiSnapshotRef.current.minAngle = minAngleRef.current;
          setMinAngle(minAngleRef.current);
        }
      }
    } else if (exercise === 'squat') {
      const squatAngles = calculateJointAngles(
        smoothedKeypoints,
        motionConfig.minScore,
        EXERCISE_ANGLE_SCOPE.squat
      );
      const rawKneeAngle =
        squatAngles.leftKnee !== null && squatAngles.rightKnee !== null
          ? Math.min(squatAngles.leftKnee, squatAngles.rightKnee)
          : squatAngles.leftKnee ?? squatAngles.rightKnee;
      const smoothedKneeAngle =
        rawKneeAngle !== null
          ? smoothAngle(rawKneeAngle, kneeAngleBufferRef.current)
          : null;

      const result = updateSquat(smoothedKeypoints, { viewMode: squatViewMode });
      squatUiTickRef.current += 1;

      if (result.repCount !== squatRepCountRef.current) {
        squatRepCountRef.current = result.repCount;
      }

      if (result.phase !== squatPhaseRef.current) {
        squatPhaseRef.current = result.phase;
      }

      const roundedKneeAngle = Math.round(smoothedKneeAngle ?? result.kneeAngle);
      if (roundedKneeAngle !== squatKneeAngleRef.current) {
        squatKneeAngleRef.current = roundedKneeAngle;
      }

      const roundedRom = Math.round(result.rom);
      if (roundedRom !== squatRomRef.current) {
        squatRomRef.current = roundedRom;
      }

      const roundedAccuracy = Math.round(result.accuracy);
      if (roundedAccuracy !== squatAccuracyRef.current) {
        squatAccuracyRef.current = roundedAccuracy;
      }

      squatSpeedFeedbackRef.current = result.speedFeedback;

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      if (squatUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (squatRepCountRef.current !== squatUiSnapshotRef.current.repCount) {
          squatUiSnapshotRef.current.repCount = squatRepCountRef.current;
          setSquatRepCount(squatRepCountRef.current);
        }
        if (squatPhaseRef.current !== squatUiSnapshotRef.current.phase) {
          squatUiSnapshotRef.current.phase = squatPhaseRef.current;
          setSquatPhase(squatPhaseRef.current);
        }
        if (squatKneeAngleRef.current !== squatUiSnapshotRef.current.kneeAngle) {
          squatUiSnapshotRef.current.kneeAngle = squatKneeAngleRef.current;
          setSquatKneeAngle(squatKneeAngleRef.current);
        }
        if (squatRomRef.current !== squatUiSnapshotRef.current.rom) {
          squatUiSnapshotRef.current.rom = squatRomRef.current;
          setSquatRom(squatRomRef.current);
        }
        if (squatAccuracyRef.current !== squatUiSnapshotRef.current.accuracy) {
          squatUiSnapshotRef.current.accuracy = squatAccuracyRef.current;
          setSquatAccuracy(squatAccuracyRef.current);
          setAccuracy(squatAccuracyRef.current);
        }
      }
    } else if (exercise === 'jumpingJack') {
      const result = updateJumpingJack(smoothedKeypoints);
      jumpingJackUiTickRef.current += 1;

      if (result.repCount !== jumpingJackRepCountRef.current) {
        jumpingJackRepCountRef.current = result.repCount;
      }

      if (result.phase !== jumpingJackPhaseRef.current) {
        jumpingJackPhaseRef.current = result.phase;
      }

      const roundedAnkleDistance = Math.round(result.ankleDistance * 1000) / 1000;
      if (roundedAnkleDistance !== jumpingJackAnkleDistanceRef.current) {
        jumpingJackAnkleDistanceRef.current = roundedAnkleDistance;
      }

      jumpingJackSpeedFeedbackRef.current = result.speedFeedback;

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      if (jumpingJackUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (jumpingJackRepCountRef.current !== jumpingJackUiSnapshotRef.current.repCount) {
          jumpingJackUiSnapshotRef.current.repCount = jumpingJackRepCountRef.current;
          setJumpingJackRepCount(jumpingJackRepCountRef.current);
        }

        if (jumpingJackPhaseRef.current !== jumpingJackUiSnapshotRef.current.phase) {
          jumpingJackUiSnapshotRef.current.phase = jumpingJackPhaseRef.current;
          setJumpingJackPhase(jumpingJackPhaseRef.current);
        }

        if (jumpingJackAnkleDistanceRef.current !== jumpingJackUiSnapshotRef.current.ankleDistance) {
          jumpingJackUiSnapshotRef.current.ankleDistance = jumpingJackAnkleDistanceRef.current;
          setJumpingJackAnkleDistance(jumpingJackAnkleDistanceRef.current);
        }

        setAccuracy(Math.round(result.accuracy));
      }
    } else if (exercise === 'pushup') {
      const result = updatePushup(smoothedKeypoints);
      pushupUiTickRef.current += 1;

      if (result.repCount !== pushupRepCountRef.current) {
        pushupRepCountRef.current = result.repCount;
      }

      if (result.phase !== pushupPhaseRef.current) {
        pushupPhaseRef.current = result.phase;
      }

      const roundedLeft = Math.round(result.leftElbowAngle);
      if (roundedLeft !== pushupLeftElbowAngleRef.current) {
        pushupLeftElbowAngleRef.current = roundedLeft;
      }

      const roundedRight = Math.round(result.rightElbowAngle);
      if (roundedRight !== pushupRightElbowAngleRef.current) {
        pushupRightElbowAngleRef.current = roundedRight;
      }

      const roundedAvg = Math.round(result.avgElbowAngle);
      if (roundedAvg !== pushupAvgElbowAngleRef.current) {
        pushupAvgElbowAngleRef.current = roundedAvg;
      }

      pushupSpeedFeedbackRef.current = result.speedFeedback;

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      if (pushupUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (pushupRepCountRef.current !== pushupUiSnapshotRef.current.repCount) {
          pushupUiSnapshotRef.current.repCount = pushupRepCountRef.current;
          setPushupRepCount(pushupRepCountRef.current);
        }
        if (pushupPhaseRef.current !== pushupUiSnapshotRef.current.phase) {
          pushupUiSnapshotRef.current.phase = pushupPhaseRef.current;
          setPushupPhase(pushupPhaseRef.current);
        }
        if (pushupLeftElbowAngleRef.current !== pushupUiSnapshotRef.current.leftElbowAngle) {
          pushupUiSnapshotRef.current.leftElbowAngle = pushupLeftElbowAngleRef.current;
          setPushupLeftElbowAngle(pushupLeftElbowAngleRef.current);
        }
        if (pushupRightElbowAngleRef.current !== pushupUiSnapshotRef.current.rightElbowAngle) {
          pushupUiSnapshotRef.current.rightElbowAngle = pushupRightElbowAngleRef.current;
          setPushupRightElbowAngle(pushupRightElbowAngleRef.current);
        }
        if (pushupAvgElbowAngleRef.current !== pushupUiSnapshotRef.current.avgElbowAngle) {
          pushupUiSnapshotRef.current.avgElbowAngle = pushupAvgElbowAngleRef.current;
          setPushupAvgElbowAngle(pushupAvgElbowAngleRef.current);
        }

        setAccuracy(Math.round(result.accuracy));
      }
    } else if (exercise === 'shoulderPress') {
      const result = updateShoulderPress(smoothedKeypoints);
      lungeUiTickRef.current += 1;

      if (result.repCount !== lungeRepCountRef.current) {
        lungeRepCountRef.current = result.repCount;
      }

      if (result.phase !== lungePhaseRef.current) {
        lungePhaseRef.current = result.phase;
      }

      const roundedLeftKnee = Math.round(result.leftElbowAngle);
      if (roundedLeftKnee !== lungeLeftKneeAngleRef.current) {
        lungeLeftKneeAngleRef.current = roundedLeftKnee;
      }

      const roundedRightKnee = Math.round(result.rightElbowAngle);
      if (roundedRightKnee !== lungeRightKneeAngleRef.current) {
        lungeRightKneeAngleRef.current = roundedRightKnee;
      }

      const roundedHipDrop = Math.round(result.avgElbowAngle);
      if (roundedHipDrop !== lungeHipDropRef.current) {
        lungeHipDropRef.current = roundedHipDrop;
      }

      lungeSpeedFeedbackRef.current = result.speedFeedback;

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      if (lungeUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (lungeRepCountRef.current !== lungeUiSnapshotRef.current.repCount) {
          lungeUiSnapshotRef.current.repCount = lungeRepCountRef.current;
          setLungeRepCount(lungeRepCountRef.current);
        }
        if (lungePhaseRef.current !== lungeUiSnapshotRef.current.phase) {
          lungeUiSnapshotRef.current.phase = lungePhaseRef.current;
          setLungePhase(lungePhaseRef.current);
        }
        if (lungeLeftKneeAngleRef.current !== lungeUiSnapshotRef.current.leftKneeAngle) {
          lungeUiSnapshotRef.current.leftKneeAngle = lungeLeftKneeAngleRef.current;
          setLungeLeftKneeAngle(lungeLeftKneeAngleRef.current);
        }
        if (lungeRightKneeAngleRef.current !== lungeUiSnapshotRef.current.rightKneeAngle) {
          lungeUiSnapshotRef.current.rightKneeAngle = lungeRightKneeAngleRef.current;
          setLungeRightKneeAngle(lungeRightKneeAngleRef.current);
        }
        if (lungeHipDropRef.current !== lungeUiSnapshotRef.current.hipDrop) {
          lungeUiSnapshotRef.current.hipDrop = lungeHipDropRef.current;
          setLungeHipDrop(lungeHipDropRef.current);
        }

        setAccuracy(Math.round(result.accuracy));
      }
    } else if (exercise === 'standingKneeRaise') {
      const result = updateStandingKneeRaise(smoothedKeypoints);
      lungeUiTickRef.current += 1;

      if (result.repCount !== lungeRepCountRef.current) {
        lungeRepCountRef.current = result.repCount;
      }

      if (result.phase !== lungePhaseRef.current) {
        lungePhaseRef.current = result.phase;
      }

      const roundedLift = Math.round(result.lift * 1000) / 1000;
      if (roundedLift !== lungeHipDropRef.current) {
        lungeHipDropRef.current = roundedLift;
      }

      kneeRaiseSpeedFeedbackRef.current = result.speedFeedback;

      if (result.repCount !== repsRef.current) {
        repsRef.current = result.repCount;
        setReps(result.repCount);
      }

      if (result.phase !== repPhaseRef.current) {
        repPhaseRef.current = result.phase;
        setRepPhase(result.phase);
      }

      if (lungeUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        if (lungeRepCountRef.current !== kneeRaiseRepCount) {
          setKneeRaiseRepCount(lungeRepCountRef.current);
        }
        if (lungePhaseRef.current !== kneeRaisePhase) {
          setKneeRaisePhase(lungePhaseRef.current);
        }
        if (roundedLift !== kneeRaiseLift) {
          setKneeRaiseLift(roundedLift);
        }
        if (Math.round(result.accuracy) !== kneeRaiseAccuracy) {
          setKneeRaiseAccuracy(Math.round(result.accuracy));
        }
      }

      if (lungeUiTickRef.current % UI_UPDATE_EVERY_N_FRAMES === 0) {
        setAccuracy(Math.round(result.accuracy));
      }
    } else {
      const jointAngles = calculateJointAngles(smoothedKeypoints, motionConfig.minScore, angleScope);
      const smoothedJointAngles = {
        ...jointAngles,
        leftKnee:
          jointAngles.leftKnee !== null
            ? smoothAngle(jointAngles.leftKnee, kneeAngleBufferRef.current)
            : null,
        rightKnee:
          jointAngles.rightKnee !== null
            ? smoothAngle(jointAngles.rightKnee, kneeAngleBufferRef.current)
            : null,
        leftElbow:
          jointAngles.leftElbow !== null
            ? smoothAngle(jointAngles.leftElbow, elbowAngleBufferRef.current)
            : null,
        rightElbow:
          jointAngles.rightElbow !== null
            ? smoothAngle(jointAngles.rightElbow, elbowAngleBufferRef.current)
            : null,
      };
      const repResult = updateRepCounter(exercise, smoothedJointAngles, smoothedKeypoints);
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
      smoothedKeypoints.some((point, index) => {
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
      const overlayLength = Math.min(smoothedKeypoints.length, overlaySnapshot.length);
      for (let index = 0; index < overlayLength; index += 1) {
        overlaySnapshot[index].x = smoothedKeypoints[index].x;
        overlaySnapshot[index].y = smoothedKeypoints[index].y;
        overlaySnapshot[index].score = smoothedKeypoints[index].score;
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
      const leftShoulder = currentKeypoints[5];
      const rightShoulder = currentKeypoints[6];
      const shoulderWidth =
        leftShoulder && rightShoulder ? Math.abs(leftShoulder.x - rightShoulder.x) : 0.16;
      const motionScale = Math.max(0.5, Math.min(1, shoulderWidth / 0.16));
      const effectiveMinScore = Math.min(currentThresholds.minScore, motionConfig.minScore + 0.03);
      const effectiveHandThreshold =
        Math.min(currentThresholds.handThreshold, motionConfig.handThreshold * 1.4) * motionScale;
      const effectiveHipThreshold =
        Math.min(currentThresholds.hipThreshold, motionConfig.hipThreshold * 1.4) * motionScale;
      const effectiveRawDeltaThreshold =
        Math.min(currentThresholds.rawDeltaThreshold, motionConfig.rawDeltaThreshold * 1.4) * motionScale;

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

      let formCorrection: string | null = null;

      if (exercise === 'bicepCurl') {
        if (bicepSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Slow down your curl';
        } else if (bicepSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'Keep a steady curl pace';
        } else if (phaseRef.current === 'up' && elbowAngleRef.current > 105) {
          formCorrection = 'Curl higher, squeeze at top';
        } else if (phaseRef.current === 'down' && elbowAngleRef.current < 135) {
          formCorrection = 'Lower fully with control';
        }
      } else if (exercise === 'squat') {
        if (squatSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Control the squat tempo';
        } else if (squatSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'Drive up with intent';
        } else if (squatPhaseRef.current === 'down' && squatKneeAngleRef.current > 120) {
          formCorrection = 'Go a bit deeper';
        } else if (squatPhaseRef.current === 'up' && squatKneeAngleRef.current < 155) {
          formCorrection = 'Stand tall at the top';
        }
      } else if (exercise === 'pushup') {
        if (pushupSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Slow down each rep';
        } else if (pushupSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'Keep a steady push rhythm';
        } else if (pushupPhaseRef.current === 'down' && pushupAvgElbowAngleRef.current > 100) {
          formCorrection = 'Lower chest a little more';
        } else if (pushupPhaseRef.current === 'up' && pushupAvgElbowAngleRef.current < 150) {
          formCorrection = 'Press to full extension';
        }
      } else if (exercise === 'shoulderPress') {
        const elbowDelta = Math.abs(lungeLeftKneeAngleRef.current - lungeRightKneeAngleRef.current);
        const avgElbow = lungeHipDropRef.current;

        if (lungeSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Slow down your shoulder press reps';
        } else if (lungeSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'Press up with more intent';
        } else if (elbowDelta > 16) {
          formCorrection = 'Keep both arms moving together';
        } else if (lungePhaseRef.current === 'up' && avgElbow < 155) {
          formCorrection = 'Lock out overhead slightly more';
        } else if (lungePhaseRef.current === 'down' && avgElbow > 115) {
          formCorrection = 'Lower the elbows with control';
        }
      } else if (exercise === 'jumpingJack') {
        if (jumpingJackSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Control your jack tempo';
        } else if (jumpingJackSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'Move with steady rhythm';
        } else if (jumpingJackPhaseRef.current === 'open' && jumpingJackAnkleDistanceRef.current < 0.14) {
          formCorrection = 'Open feet wider';
        } else if (jumpingJackPhaseRef.current === 'close' && jumpingJackAnkleDistanceRef.current > 0.1) {
          formCorrection = 'Bring feet closer together';
        }
      } else if (exercise === 'standingKneeRaise') {
        if (kneeRaiseSpeedFeedbackRef.current === 'Too fast') {
          formCorrection = 'Control the speed';
        } else if (kneeRaiseSpeedFeedbackRef.current === 'Too slow') {
          formCorrection = 'More explosive lift';
        } else if (repPhaseRef.current === 'up' && lungeHipDropRef.current < 0.12) {
          formCorrection = 'Lift higher';
        } else if (repPhaseRef.current === 'up') {
          formCorrection = 'Hold steady';
        } else if (repPhaseRef.current === 'down') {
          formCorrection = 'Lower smoothly';
        }
      }

      let nextFeedback = formCorrection ?? 'Hold steady';
      if (!formCorrection) {
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
      } else if (exercise === 'shoulderPress') {
        if (
          avgElbowAngle !== null &&
          (motion.handMovement.leftWrist !== 'stable' ||
            motion.handMovement.rightWrist !== 'stable' ||
            motion.bodyVerticalMovement !== 'stable')
        ) {
          activityLabel = 'Auto: shoulder press movement';
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: upper-body movement';
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
      } else if (exercise === 'standingKneeRaise') {
        if (
          (motion.bodyVerticalMovement === 'down' || motion.bodyVerticalMovement === 'up') &&
          avgKneeAngle !== null &&
          avgKneeAngle < motionConfig.kneeBentThreshold
        ) {
          activityLabel = 'Auto: knee raise movement';
          activityDetected = true;
        } else if (hasRawMovement) {
          activityLabel = 'Auto: lower-body movement';
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
  }, [
    angleScope,
    bicepViewMode,
    exercise,
    getCameraGuideText,
    hasReliableBicepPose,
    hasReliableStandingKneeRaisePose,
    isDetectingContinuous,
    isPersonPresent,
    kneeRaiseAccuracy,
    kneeRaiseLift,
    kneeRaisePhase,
    kneeRaiseRepCount,
    motionConfig,
    normalizePoseKeypoints,
    smoothAngle,
    smoothKeypoints,
    squatViewMode,
  ]);

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

  // JS polling loop: consume latest shared pose on JS and update detector state.
  useEffect(() => {
    if (!isDetectingContinuous) {
      return;
    }

    const pollIntervalMs = exercise === 'standingKneeRaise'
      ? KNEE_RAISE_POSE_POLL_INTERVAL_MS
      : JS_POSE_POLL_INTERVAL_MS;

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
    }, pollIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [isDetectingContinuous, sharedPoseKeypoints, sharedPoseVersion, updatePose]);

  // Initialize camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await Camera.getCameraPermissionStatus();
        console.log(`${logTag} Camera permission status:`, status);

        if (status === 'granted') {
          setPermission(status);
          return;
        }

        const requested = await Camera.requestCameraPermission();
        console.log(`${logTag} Camera permission requested result:`, requested);
        setPermission(requested);
      } catch {
        console.error(`${logTag} Camera permission request failed`);
        setCameraError('Failed to request camera permission');
        setPermission('denied');
      }
    };

    checkPermission();
  }, [logTag]);

  useEffect(() => {
    console.log(`${logTag} Device selection`, {
      using: isFrontCamera ? 'front' : 'back',
      backAvailable: backCamera != null,
      frontAvailable: frontCamera != null,
      selectedDeviceReady: device != null,
      visionPluginAvailable,
    });
  }, [backCamera, device, frontCamera, isFrontCamera, logTag, visionPluginAvailable]);

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
  const bicepAccuracy = accuracy ?? 0;
  const bicepFormQuality = useMemo(() => {
    if (bicepAccuracy > 85) {
      return 'GOOD';
    }

    if (bicepAccuracy >= 70) {
      return 'OK';
    }

    return 'IMPROVE';
  }, [bicepAccuracy]);
  const genericFormText = accuracy !== null ? `${accuracy}%` : '--';
  const squatFormText = `${squatAccuracy}%`;

  // Utility functions
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFlipCamera = () => setIsFrontCamera(!isFrontCamera);

  const persistAiWorkoutSession = useCallback(async () => {
    const completedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy ?? 0)));

    try {
      await saveWorkoutSession({
        exercisesPerformed: [
          {
            exercise,
            reps: Math.max(0, repsRef.current),
            duration: Math.max(0, seconds),
            accuracy: completedAccuracy,
          },
        ],
        durationSeconds: Math.max(0, seconds),
      });
    } catch (error) {
      console.warn('[PostureScreen] Failed to save AI workout session', error);
    }
  }, [accuracy, exercise, seconds]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    const nextFeedback = isPaused ? 'Keep Going!' : 'Paused';
    lastFeedbackRef.current = nextFeedback;
    setFeedback(nextFeedback);
  };

  const handleEndWorkout = () => {
    const finalRepCount = Math.max(0, repsRef.current);

    Alert.alert(
      'End Workout',
      `You completed ${finalRepCount} reps in ${formatTime(seconds)}. Are you sure you want to end?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            await persistAiWorkoutSession();
            navigation.goBack();
          },
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
        if (exercise === 'jumpingJack') {
          resetJumpingJackDetector();
        }
        if (exercise === 'shoulderPress') {
          resetShoulderPressDetector();
        }
        if (exercise === 'standingKneeRaise') {
          resetStandingKneeRaiseDetector();
        }
        if (exercise === 'pushup') {
          resetPushupDetector();
        }
        if (exercise === 'squat') {
          resetSquatDetector();
        }
        setReps(0);
        setRepPhase('hold');
        setRepCount(0);
        setPhase('up');
        setElbowAngle(0);
        setRom(0);
        setRepSpeed(0);
        setAccuracy(null);
        setMaxAngle(0);
        setMinAngle(0);
        setSquatRepCount(0);
        setSquatPhase('up');
        setSquatKneeAngle(0);
        setSquatRom(0);
        setSquatAccuracy(0);
        setLungeRepCount(0);
        setLungePhase('up');
        setLungeLeftKneeAngle(180);
        setLungeRightKneeAngle(180);
        setLungeHipDrop(0);
        setJumpingJackRepCount(0);
        setJumpingJackPhase('close');
        setJumpingJackAnkleDistance(0);
        setPushupRepCount(0);
        setPushupPhase('up');
        setPushupLeftElbowAngle(180);
        setPushupRightElbowAngle(180);
        setPushupAvgElbowAngle(180);
        repCountRef.current = 0;
        phaseRef.current = 'up';
        elbowAngleRef.current = 0;
        romRef.current = 0;
        repSpeedRef.current = 0;
        bicepSpeedFeedbackRef.current = 'Controlled';
        squatSpeedFeedbackRef.current = 'Controlled';
        pushupSpeedFeedbackRef.current = 'Controlled';
        lungeSpeedFeedbackRef.current = 'Controlled';
        jumpingJackSpeedFeedbackRef.current = 'Controlled';
        kneeRaiseSpeedFeedbackRef.current = 'Controlled';
        accuracyRef.current = 0;
        maxAngleRef.current = 0;
        minAngleRef.current = 0;
        bicepUiSnapshotRef.current = {
          elbowAngle: 0,
          rom: 0,
          repSpeed: 0,
          accuracy: 0,
          maxAngle: 0,
          minAngle: 0,
        };
        bicepUiTickRef.current = 0;
        squatRepCountRef.current = 0;
        squatPhaseRef.current = 'up';
        squatKneeAngleRef.current = 0;
        squatRomRef.current = 0;
        squatAccuracyRef.current = 0;
        squatUiTickRef.current = 0;
        squatUiSnapshotRef.current = {
          repCount: 0,
          phase: 'up',
          kneeAngle: 0,
          rom: 0,
          accuracy: 0,
        };
        lungeRepCountRef.current = 0;
        lungePhaseRef.current = 'up';
        lungeLeftKneeAngleRef.current = 180;
        lungeRightKneeAngleRef.current = 180;
        lungeHipDropRef.current = 0;
        lungeUiTickRef.current = 0;
        lungeUiSnapshotRef.current = {
          repCount: 0,
          phase: 'up',
          leftKneeAngle: 180,
          rightKneeAngle: 180,
          hipDrop: 0,
        };
        jumpingJackRepCountRef.current = 0;
        jumpingJackPhaseRef.current = 'close';
        jumpingJackAnkleDistanceRef.current = 0;
        jumpingJackUiTickRef.current = 0;
        jumpingJackUiSnapshotRef.current = {
          repCount: 0,
          phase: 'close',
          ankleDistance: 0,
        };
        pushupRepCountRef.current = 0;
        pushupPhaseRef.current = 'up';
        pushupLeftElbowAngleRef.current = 180;
        pushupRightElbowAngleRef.current = 180;
        pushupAvgElbowAngleRef.current = 180;
        pushupUiTickRef.current = 0;
        pushupUiSnapshotRef.current = {
          repCount: 0,
          phase: 'up',
          leftElbowAngle: 180,
          rightElbowAngle: 180,
          avgElbowAngle: 180,
        };
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
        keypointHistoryBufferRef.current = [];
        kneeAngleBufferRef.current = [];
        elbowAngleBufferRef.current = [];
        setOverlayKeypoints([]);
        setDetectSummary('Starting continuous detection...');
        setElbowScanSummary('Elbow scan: waiting');
      } else {
        prevKeypointsRef.current = null;
        keypointHistoryBufferRef.current = [];
        kneeAngleBufferRef.current = [];
        elbowAngleBufferRef.current = [];
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
        frameProcessor={isDetectingContinuous && visionPluginAvailable ? frameProcessor : undefined}
        onInitialized={() => {
          console.log(`${logTag} Camera initialized`);
        }}
        onError={(error) => {
          console.error(`${logTag} Camera runtime error:`, error.message);
          setCameraError(error.message);
        }}
      />

      <PoseOverlay keypoints={overlayKeypoints} />

      {exercise === 'bicepCurl' && (
        <View style={styles.bicepOverlay} pointerEvents="box-none">
          <View style={styles.bicepOverlayPanel}>
            <View style={styles.viewModeSwitchRow}>
              <TouchableOpacity
                style={[styles.viewModeButton, bicepViewMode === 'front' && styles.viewModeButtonActive]}
                onPress={() => setBicepViewMode('front')}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewModeText, bicepViewMode === 'front' && styles.viewModeTextActive]}>Front</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, bicepViewMode === 'side' && styles.viewModeButtonActive]}
                onPress={() => setBicepViewMode('side')}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewModeText, bicepViewMode === 'side' && styles.viewModeTextActive]}>Side</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bicepMeta}>Phase: {phase.toUpperCase()}</Text>
            <Text
              style={[
                styles.bicepForm,
                bicepFormQuality === 'GOOD'
                  ? styles.bicepFormGood
                  : bicepFormQuality === 'OK'
                    ? styles.bicepFormOk
                    : styles.bicepFormImprove,
              ]}
            >
              Form: {bicepFormQuality}
            </Text>
          </View>
        </View>
      )}

      {exercise === 'squat' && (
        <View style={styles.squatOverlay} pointerEvents="none">
          <View style={styles.viewModeSwitchRow}>
            <TouchableOpacity
              style={[styles.viewModeButton, squatViewMode === 'front' && styles.viewModeButtonActive]}
              onPress={() => setSquatViewMode('front')}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewModeText, squatViewMode === 'front' && styles.viewModeTextActive]}>Front</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, squatViewMode === 'side' && styles.viewModeButtonActive]}
              onPress={() => setSquatViewMode('side')}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewModeText, squatViewMode === 'side' && styles.viewModeTextActive]}>Side</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.squatMetric}>Phase: {squatPhase.toUpperCase()}</Text>
          <Text style={styles.squatMetric}>Form: {squatFormText}</Text>
        </View>
      )}

      {exercise === 'jumpingJack' && (
        <View style={styles.jumpingJackOverlay} pointerEvents="none">
          <Text style={styles.jumpingJackMetric}>Phase: {jumpingJackPhase.toUpperCase()}</Text>
          <Text style={styles.jumpingJackMetric}>Form: {genericFormText}</Text>
        </View>
      )}

      {exercise === 'pushup' && (
        <View style={styles.pushupOverlay} pointerEvents="none">
          <Text style={styles.pushupMetric}>Phase: {pushupPhase.toUpperCase()}</Text>
          <Text style={styles.pushupMetric}>Form: {genericFormText}</Text>
        </View>
      )}

      {exercise === 'shoulderPress' && (
        <View style={styles.lungeOverlay} pointerEvents="none">
          <Text style={styles.lungeMetric}>Phase: {lungePhase.toUpperCase()}</Text>
          <Text style={styles.lungeMetric}>Form: {genericFormText}</Text>
        </View>
      )}

      {exercise === 'standingKneeRaise' && (
        <View style={styles.lungeOverlay} pointerEvents="none">
          <Text style={styles.lungeMetric}>Phase: {kneeRaisePhase.toUpperCase()}</Text>
          <Text style={styles.lungeMetric}>Form: {kneeRaiseAccuracy}%</Text>
        </View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.exerciseTitle, styles.exerciseTitleCompact]}>
                {exerciseTitle}
              </Text>
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

            {showInfoPanel && (
              <>
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
                  <Text style={styles.detectStatusText}>Vision plugin: {visionPluginAvailable ? 'ready' : 'not available'}</Text>
                  <Text style={styles.detectStatusText}>{detectSummary}</Text>
                  <Text style={styles.detectStatusText}>{elbowScanSummary}</Text>
                  <Text style={styles.detectStatusText}>Rep phase: {repPhase}</Text>
                  <Text style={styles.detectStatusText}>{calibrationStatus}</Text>
                  <Text style={styles.detectStatusText}>{cameraGuide}</Text>
                </View>
              </>
            )}
          </View>

          {/* Bottom Controls */}
          <View>
            <TouchableOpacity
              style={styles.infoToggleButton}
              activeOpacity={0.85}
              onPress={() => setShowInfoPanel((previous) => !previous)}
            >
              <Text style={styles.infoToggleButtonText}>{showInfoPanel ? 'Hide Info' : 'Show Info'}</Text>
            </TouchableOpacity>
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
    backgroundColor: Colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  poseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bicepOverlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bicepOverlayPanel: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 220,
    maxWidth: 280,
    alignItems: 'center',
  },
  viewModeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  viewModeButton: {
    borderWidth: 1,
    borderColor: Colors.whiteA28,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: OVERLAY_SUBTLE,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.whiteA16,
    borderColor: Colors.whiteA72,
  },
  viewModeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeTextActive: {
    color: SOFT_ACCENT,
  },
  bicepTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bicepRep: {
    color: SOFT_ACCENT,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  bicepMeta: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bicepAngle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bicepMetric: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  bicepForm: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  bicepFormGood: {
    color: Colors.success,
  },
  bicepFormOk: {
    color: Colors.warning,
  },
  bicepFormImprove: {
    color: Colors.error,
  },
  squatOverlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lungeOverlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lungeTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lungeRep: {
    color: SOFT_ACCENT,
    fontSize: 40,
    fontWeight: '900',
    marginTop: 6,
  },
  lungeMetric: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  jumpingJackOverlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pushupOverlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pushupTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pushupRep: {
    color: SOFT_ACCENT,
    fontSize: 40,
    fontWeight: '900',
    marginTop: 6,
  },
  pushupMetric: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  jumpingJackTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  jumpingJackRep: {
    color: SOFT_ACCENT,
    fontSize: 40,
    fontWeight: '900',
    marginTop: 6,
  },
  jumpingJackMetric: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  squatTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  squatRep: {
    color: SOFT_ACCENT,
    fontSize: 40,
    fontWeight: '900',
    marginTop: 6,
  },
  squatMetric: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    marginTop: 10,
    backgroundColor: OVERLAY_LIGHT,
    borderWidth: 1,
    borderColor: Colors.whiteA16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseTitleCompact: {
    fontSize: 16,
  },
  timerText: {
    fontSize: 12,
    color: '#FFFFFF',
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
    borderColor: Colors.whiteA28,
    paddingBottom: 4,
  },
  flipButtonText: {
    fontSize: 20,
    color: SOFT_ACCENT,
    fontWeight: '700',
  },

  // ===== STATUS BADGE =====
  topBadge: {
    backgroundColor: Colors.whiteA14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.whiteA28,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: SOFT_ACCENT,
  },
  topBadgePaused: {
    backgroundColor: Colors.warningA15,
    borderColor: Colors.warningA4,
  },
  topBadgeTextPaused: {
    color: Colors.warning,
  },

  // ===== STATS ROW =====
  cornerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cornerItem: {
    backgroundColor: OVERLAY_LIGHT,
    borderWidth: 1,
    borderColor: Colors.whiteA16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS,
    minWidth: 96,
  },
  cornerLabel: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  cornerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
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
    color: '#FFFFFF',
    backgroundColor: OVERLAY_LIGHT,
    borderWidth: 1,
    borderColor: Colors.whiteA16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
  },
  motionStatusBadge: {
    marginTop: 10,
    backgroundColor: Colors.blackA55,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.whiteA28,
    minWidth: 220,
    alignItems: 'center',
  },
  infoToggleButton: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
    backgroundColor: Colors.blackA62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.whiteA28,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  infoToggleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  motionStatusBadgeDetected: {
    borderColor: Colors.successA85,
    backgroundColor: Colors.successA18,
  },
  motionStatusBadgeIdle: {
    borderColor: Colors.textMutedA55,
    backgroundColor: Colors.blackA55,
  },
  motionStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  motionStatusTitleDetected: {
    color: Colors.success,
  },
  motionStatusTitleIdle: {
    color: '#FFFFFF',
  },
  motionStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  detectStatusBadge: {
    marginTop: 8,
    backgroundColor: Colors.blackA55,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.whiteA28,
    minWidth: 260,
    alignItems: 'center',
  },
  detectStatusTitle: {
    color: SOFT_ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },
  detectStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  debugHud: {
    marginTop: 12,
    backgroundColor: Colors.blackA62,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 290,
    borderWidth: 1,
    borderColor: Colors.whiteA28,
  },
  debugTitle: {
    color: SOFT_ACCENT,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  debugText: {
    color: '#FFFFFF',
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
    backgroundColor: Colors.secondaryDark,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.whiteA28,
  },
  detectButtonText: {
    color: Colors.textOnPrimary,
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
    borderColor: Colors.whiteA28,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.secondaryDark,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.whiteA28,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  // ===== PERMISSION STATES =====
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  permissionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});





