import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { getExercisesForProgram, getProgramById } from '../data/workoutData';
import { Colors } from '../theme/colors';
import { FontWeight, Spacing, Typography } from '../theme/tokens';
import { PrimaryButton } from '../components/ui';
import { CountdownOverlay, ExercisePlayer, RestScreen, TimerCircle, WorkoutAnimation } from '../components/workout';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutSession'>;
type SessionPhase = 'ready' | 'countdown' | 'exercise' | 'rest';

const REST_DEFAULT = 30;

const formatClock = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const WorkoutSessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { programId } = route.params;
  const program = getProgramById(programId);
  const exercises = getExercisesForProgram(programId);

  const [phase, setPhase] = useState<SessionPhase>('ready');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const [restTimeLeft, setRestTimeLeft] = useState(REST_DEFAULT);
  const [restTotal, setRestTotal] = useState(REST_DEFAULT);
  const [paused, setPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const currentExercise = exercises[currentIndex];

  const currentExerciseDisplay = useMemo(() => {
    if (!currentExercise) return '';
    if (currentExercise.type === 'timer') {
      return formatClock(exerciseTimeLeft);
    }
    return `x${currentExercise.reps ?? 0}`;
  }, [currentExercise, exerciseTimeLeft]);

  const completeWorkout = useCallback(() => {
    navigation.replace('WorkoutComplete', {
      programId,
      completedExercises: exercises.length,
      totalSeconds,
    });
  }, [navigation, programId, exercises.length, totalSeconds]);

  const goToRestPhase = useCallback(() => {
    if (currentIndex >= exercises.length - 1) {
      completeWorkout();
      return;
    }

    setRestTimeLeft(REST_DEFAULT);
    setRestTotal(REST_DEFAULT);
    setPaused(false);
    setPhase('rest');
  }, [completeWorkout, currentIndex, exercises.length]);

  const moveToNextExercise = useCallback(() => {
    if (currentIndex >= exercises.length - 1) {
      completeWorkout();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setCountdown(3);
    setPaused(false);
    setPhase('ready');
  }, [completeWorkout, currentIndex, exercises.length]);

  const moveToPreviousExercise = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
    setPhase('exercise');
    setPaused(false);
  };

  useEffect(() => {
    if (!currentExercise || phase !== 'exercise') return;

    if (currentExercise.type === 'timer') {
      setExerciseTimeLeft(currentExercise.duration ?? 20);
    }
  }, [currentIndex, currentExercise, phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('exercise');
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (paused) return;
    if (phase !== 'exercise' && phase !== 'rest') return;

    const sessionTimer = setInterval(() => {
      setTotalSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [phase, paused]);

  useEffect(() => {
    if (paused || phase !== 'exercise' || !currentExercise || currentExercise.type !== 'timer') return;

    const timer = setInterval(() => {
      setExerciseTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          goToRestPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, paused, currentExercise, goToRestPhase]);

  useEffect(() => {
    if (paused || phase !== 'rest') return;

    const timer = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          moveToNextExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, paused, moveToNextExercise]);

  if (!program || !currentExercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.fallbackText}>Session data unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.programName}>{program.name.toUpperCase()}</Text>

        {phase === 'ready' ? (
          <View style={styles.readyWrap}>
            <WorkoutAnimation animation={currentExercise.animation} size={230} speed={currentExercise.type === 'timer' ? 1 : 0.9} />
            <Text style={styles.readyTitle}>READY TO GO</Text>
            <Text style={styles.readySub}>{currentExercise.name}</Text>
            <View style={styles.previewTimer}>
              <TimerCircle progress={1} label={currentExercise.type === 'timer' ? formatClock(currentExercise.duration ?? 20) : `x${currentExercise.reps ?? 0}`} />
            </View>
            <PrimaryButton
              title="Start"
              onPress={() => {
                setCountdown(3);
                setPhase('countdown');
              }}
              style={styles.readyButton}
            />
          </View>
        ) : null}

        {phase === 'exercise' ? (
          <ExercisePlayer
            exercise={currentExercise}
            displayValue={currentExerciseDisplay}
            onPrev={moveToPreviousExercise}
            onPauseResume={() => setPaused((prev) => !prev)}
            onNext={goToRestPhase}
            onDoneReps={goToRestPhase}
            paused={paused}
          />
        ) : null}

        {phase === 'rest' ? (
          <RestScreen
            nextExerciseName={
              currentIndex < exercises.length - 1 ? exercises[currentIndex + 1].name : 'Finish Workout'
            }
            timeLeft={restTimeLeft}
            total={restTotal}
            onAddTime={() => {
              setRestTimeLeft((prev) => prev + 20);
              setRestTotal((prev) => prev + 20);
            }}
            onSkip={moveToNextExercise}
          />
        ) : null}
      </View>

      {phase === 'countdown' ? <CountdownOverlay count={countdown} /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x2,
    paddingBottom: Spacing.x2,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  programName: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  readyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  readySub: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  previewTimer: {
    marginTop: Spacing.xl,
  },
  readyButton: {
    marginTop: Spacing.xl,
    width: '100%',
  },
});
