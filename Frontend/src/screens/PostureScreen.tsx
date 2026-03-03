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
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCameraDevice, Camera, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { analyzeMotion } from '../ai/motionIntelligence';
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
const DEBUG_MIN_SCORE = 0.2;
const DEBUG_HAND_THRESHOLD = 0.008;
const DEBUG_HIP_THRESHOLD = 0.006;
const DEBUG_LOG_EVERY_N_FRAMES = 10;
const RAW_DELTA_THRESHOLD = 0.003;
const UI_UPDATE_EVERY_N_FRAMES = 3;

type PostureScreenProps = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

type PoseKeypoint = {
  x: number;
  y: number;
  score: number;
};

type DebugMotionSnapshot = {
  frame: number;
  leftWristDeltaY: number;
  rightWristDeltaY: number;
  hipDeltaY: number;
  leftWristMovement: 'up' | 'down' | 'stable';
  rightWristMovement: 'up' | 'down' | 'stable';
  bodyMovement: 'up' | 'down' | 'stable';
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

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  squat: 'Squats',
  pushup: 'Pushups',
  lunge: 'Lunges',
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
    minScore: 0.2,
    handThreshold: 0.01,
    hipThreshold: 0.005,
    rawDeltaThreshold: 0.003,
    kneeBentThreshold: 145,
    elbowBentThreshold: 130,
  },
  pushup: {
    minScore: 0.2,
    handThreshold: 0.006,
    hipThreshold: 0.004,
    rawDeltaThreshold: 0.0025,
    kneeBentThreshold: 150,
    elbowBentThreshold: 135,
  },
  lunge: {
    minScore: 0.2,
    handThreshold: 0.009,
    hipThreshold: 0.005,
    rawDeltaThreshold: 0.003,
    kneeBentThreshold: 150,
    elbowBentThreshold: 130,
  },
  plank: {
    minScore: 0.18,
    handThreshold: 0.005,
    hipThreshold: 0.003,
    rawDeltaThreshold: 0.002,
    kneeBentThreshold: 155,
    elbowBentThreshold: 125,
  },
  bicepCurl: {
    minScore: 0.15,
    handThreshold: 0.003,
    hipThreshold: 0.003,
    rawDeltaThreshold: 0.0015,
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
  const { exercise } = route.params;
  const isFocused = useIsFocused();

  // Camera Devices
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');

  // State Management
  const [permission, setPermission] = useState('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [reps] = useState(0);
  const [accuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Get Ready');
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetectingContinuous, setIsDetectingContinuous] = useState(false);
  const [debugMotion, setDebugMotion] = useState<DebugMotionSnapshot | null>(null);
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
  const prevManualElbowAvgRef = useRef<number | null>(null);
  const prevRealtimeElbowAvgRef = useRef<number | null>(null);
  const lastFeedbackRef = useRef('Get Ready');
  const lastMotionStatusRef = useRef('No movement|0');
  const lastActivityStatusRef = useRef('Auto: no movement|0');
  const motionFrameCountRef = useRef(0);
  const droppedFrameCountRef = useRef(0);
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

  // Selected device based on camera mode
  const device = isFrontCamera ? frontCamera : backCamera;
  const motionConfig = useMemo(() => EXERCISE_MOTION_CONFIG[exercise], [exercise]);
  const detectPosePlugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});

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
    setCalibrationStatus('Calibrating motion... 0/30');
  }, [motionConfig]);

  const toPoseKeypoints = useCallback((rawKeypoints: PoseKeypoint[]): PoseKeypoint[] => {
    return rawKeypoints.map((point) => ({
      x: Number(point.x),
      y: Number(point.y),
      score: typeof point.score === 'number' ? point.score : 1,
    }));
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

    if (!detectedKeypoints || detectedKeypoints.length < 17) {
      droppedFrameCountRef.current += 1;
      if (droppedFrameCountRef.current % DEBUG_LOG_EVERY_N_FRAMES === 0) {
        console.log('[MotionDebug] Invalid keypoint frame', {
          droppedFrames: droppedFrameCountRef.current,
          receivedLength: detectedKeypoints?.length ?? 0,
        });
      }
      return;
    }

    const currentKeypoints = toPoseKeypoints(detectedKeypoints);

    const previous = prevKeypointsRef.current;
    if (previous) {
      const currentThresholds = activeThresholdsRef.current;
      const effectiveThresholds = {
        minScore: Math.min(currentThresholds.minScore, motionConfig.minScore + 0.03),
        handThreshold: Math.min(currentThresholds.handThreshold, motionConfig.handThreshold * 1.4),
        hipThreshold: Math.min(currentThresholds.hipThreshold, motionConfig.hipThreshold * 1.4),
        rawDeltaThreshold: Math.min(currentThresholds.rawDeltaThreshold, motionConfig.rawDeltaThreshold * 1.4),
      };

      const motion = analyzeMotion(previous, currentKeypoints, {
        minScore: effectiveThresholds.minScore,
        handThreshold: effectiveThresholds.handThreshold,
        hipThreshold: effectiveThresholds.hipThreshold,
      });

      const leftWristDeltaY = currentKeypoints[9].y - previous[9].y;
      const rightWristDeltaY = currentKeypoints[10].y - previous[10].y;
      const prevHipY = (previous[11].y + previous[12].y) * 0.5;
      const currentHipY = (currentKeypoints[11].y + currentKeypoints[12].y) * 0.5;
      const hipDeltaY = currentHipY - prevHipY;
      const hasRawMovement =
        Math.abs(leftWristDeltaY) > effectiveThresholds.rawDeltaThreshold ||
        Math.abs(rightWristDeltaY) > effectiveThresholds.rawDeltaThreshold ||
        Math.abs(hipDeltaY) > effectiveThresholds.rawDeltaThreshold;
      const hasBodyMovement =
        Math.abs(hipDeltaY) > Math.min(effectiveThresholds.hipThreshold, motionConfig.hipThreshold * 1.2);

      const calibrationFrames = calibrationFrameCountRef.current;
      if (calibrationFrames < 30) {
        calibrationFrameCountRef.current += 1;
        calibrationSumsRef.current.leftWristAbsDelta += Math.abs(leftWristDeltaY);
        calibrationSumsRef.current.rightWristAbsDelta += Math.abs(rightWristDeltaY);
        calibrationSumsRef.current.hipAbsDelta += Math.abs(hipDeltaY);

        if (calibrationFrameCountRef.current % 5 === 0) {
          setCalibrationStatus(`Calibrating motion... ${calibrationFrameCountRef.current}/30`);
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
          setCalibrationStatus('Calibration complete');
          console.log('[MotionDebug] Calibration complete', activeThresholdsRef.current);
        }
      }

      setCameraGuide(getCameraGuideText(currentKeypoints));

      motionFrameCountRef.current += 1;
      if (motionFrameCountRef.current % DEBUG_LOG_EVERY_N_FRAMES === 0) {
        const debugSnapshot: DebugMotionSnapshot = {
          frame: motionFrameCountRef.current,
          leftWristDeltaY,
          rightWristDeltaY,
          hipDeltaY,
          leftWristMovement: motion.handMovement.leftWrist,
          rightWristMovement: motion.handMovement.rightWrist,
          bodyMovement: motion.bodyVerticalMovement,
        };

        console.log('[MotionDebug]', {
          frame: debugSnapshot.frame,
          sameArrayRef: previous === currentKeypoints,
          minScore: motionConfig.minScore,
          handThreshold: effectiveThresholds.handThreshold,
          hipThreshold: effectiveThresholds.hipThreshold,
          rawDeltaThreshold: effectiveThresholds.rawDeltaThreshold,
          exercise,
          deltas: {
            leftWristDeltaY: debugSnapshot.leftWristDeltaY,
            rightWristDeltaY: debugSnapshot.rightWristDeltaY,
            hipDeltaY: debugSnapshot.hipDeltaY,
          },
          movement: {
            leftWrist: debugSnapshot.leftWristMovement,
            rightWrist: debugSnapshot.rightWristMovement,
            body: debugSnapshot.bodyMovement,
          },
          angles: {
            leftElbow: motion.angles.leftElbow,
            rightElbow: motion.angles.rightElbow,
            leftKnee: motion.angles.leftKnee,
            rightKnee: motion.angles.rightKnee,
          },
        });

        setDebugMotion(debugSnapshot);
      }

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
        setDetectSummary(`Detected ${currentKeypoints.length}/17 keypoints`);

        if (avgElbowAngle === null) {
          setElbowScanSummary('Elbow scan: low confidence / not visible');
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
          setElbowScanSummary(`Elbows L:${leftLabel}° R:${rightLabel}° (${elbowMovement})`);
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
  }, [exercise, getCameraGuideText, isDetectingContinuous, motionConfig, toPoseKeypoints]);

  const onPoseFromWorklet = Worklets.createRunOnJS((keypoints: PoseKeypoint[]) => {
    updatePose(keypoints);
  });

  // Frame Processor Hook for real-time pose detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    try {
      if (detectPosePlugin == null) {
        return;
      }

      const detectedResult = detectPosePlugin.call(frame) as unknown;
      if (!Array.isArray(detectedResult) || detectedResult.length === 0) {
        return;
      }

      const serializableKeypoints = detectedResult.map((point) => ({
        x: Number(point.x),
        y: Number(point.y),
        score: typeof point.score === 'number' ? point.score : 1,
      }));
      
      // Update keypoints and run movement intelligence on JS thread
      onPoseFromWorklet(serializableKeypoints);
    } catch (error) {
      // Silently log errors to avoid spam; plugin will retry on next frame
      console.warn('[FrameProcessor] Pose detection error:', error);
    }
  }, [detectPosePlugin, onPoseFromWorklet]);

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
        prevKeypointsRef.current = null;
        prevRealtimeElbowAvgRef.current = null;
        prevManualElbowAvgRef.current = null;
        motionFrameCountRef.current = 0;
        droppedFrameCountRef.current = 0;
        setDetectSummary('Starting continuous detection...');
        setElbowScanSummary('Elbow scan: waiting');
      } else {
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
        isActive={isFocused && !isPaused}
        photo
        frameProcessor={frameProcessor}
      />

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
              <Text style={styles.detectStatusText}>{calibrationStatus}</Text>
              <Text style={styles.detectStatusText}>{cameraGuide}</Text>
            </View>
            {debugMotion && (
              <View style={styles.debugHud}>
                <Text style={styles.debugTitle}>Motion Debug</Text>
                <Text style={styles.debugText}>Frame: {debugMotion.frame}</Text>
                <Text style={styles.debugText}>
                  L Wrist ΔY: {debugMotion.leftWristDeltaY.toFixed(4)} ({debugMotion.leftWristMovement})
                </Text>
                <Text style={styles.debugText}>
                  R Wrist ΔY: {debugMotion.rightWristDeltaY.toFixed(4)} ({debugMotion.rightWristMovement})
                </Text>
                <Text style={styles.debugText}>
                  Hip ΔY: {debugMotion.hipDeltaY.toFixed(4)} ({debugMotion.bodyMovement})
                </Text>
              </View>
            )}
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
