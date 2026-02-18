/**
 * WorkoutScreen Component
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

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { COLORS } from '../../constants/theme';
import { ExerciseType, HomeStackParamList } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

// Constants
const ACCENT = '#22C55E';
const OVERLAY_LIGHT = 'rgba(0,0,0,0.45)';
const OVERLAY_MEDIUM = 'rgba(0,0,0,0.5)';
const OVERLAY_SUBTLE = 'rgba(0,0,0,0.3)';
const GAP = 12;
const BORDER_RADIUS = 14;

type WorkoutScreenProps = NativeStackScreenProps<HomeStackParamList, 'Workout'>;

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  squat: 'Squats',
  pushup: 'Pushups',
  lunge: 'Lunges',
  plank: 'Plank',
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

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ route, navigation }) => {
  const { exercise } = route.params;
  const isFocused = useIsFocused();

  // Camera Devices
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');

  // State Management
  const [permission, setPermission] = useState('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [reps, setReps] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Get Ready');
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selected device based on camera mode
  const device = isFrontCamera ? frontCamera : backCamera;

  // Initialize camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await Camera.requestCameraPermission();
        setPermission(status);
      } catch (error) {
        console.error('Permission error:', error);
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
    setFeedback(isPaused ? 'Keep Going!' : 'Paused');
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
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={isFocused} />

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
          </View>

          {/* Bottom Controls */}
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

  // ===== BUTTONS =====
  bottomBar: {
    flexDirection: 'row',
    gap: GAP,
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
