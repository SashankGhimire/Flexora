import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Video from 'react-native-video';
import { HomeStackParamList } from '../types';
import { getExercisesForProgram, getProgramById } from '../data/workoutData';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { PrimaryButton, SimpleIcon } from '../components/ui';
import { CountdownOverlay, ExercisePlayer, RestScreen, TimerCircle, WorkoutAnimation } from '../components/workout';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutSession'>;
type SessionPhase = 'ready' | 'countdown' | 'exercise' | 'rest';

const REST_DEFAULT = 30;

const SYSTEM_VOICE_AUDIO: Record<'start' | 'rest' | 'coming_up_next', any> = {
  start: require('../assets/audio/start.wav'),
  rest: require('../assets/audio/rest.wav'),
  coming_up_next: require('../assets/audio/coming_up_next.wav'),
};

const EXERCISE_NAME_AUDIO: Record<string, any> = {
  'jumping-jacks': require('../assets/audio/exercises/jumping-jacks.wav'),
  crunches: require('../assets/audio/exercises/crunches.wav'),
  'russian-twist': require('../assets/audio/exercises/russian-twist.wav'),
  'mountain-climbers': require('../assets/audio/exercises/mountain-climbers.wav'),
  'plank-hold': require('../assets/audio/exercises/plank-hold.wav'),
  'arm-circles': require('../assets/audio/exercises/arm-circles.wav'),
  'tricep-dips': require('../assets/audio/exercises/tricep-dips.wav'),
  'incline-pushups': require('../assets/audio/exercises/incline-pushups.wav'),
  'bodyweight-squats': require('../assets/audio/exercises/bodyweight-squats.wav'),
  'reverse-lunges': require('../assets/audio/exercises/reverse-lunges.wav'),
  'high-knees': require('../assets/audio/exercises/high-knees.wav'),
  pushups: require('../assets/audio/exercises/pushups.wav'),
  'glute-bridge': require('../assets/audio/exercises/glute-bridge.wav'),
  'shoulder-taps': require('../assets/audio/exercises/shoulder-taps.wav'),
};

const resolveVoiceCueSource = (cue: string): any =>
  SYSTEM_VOICE_AUDIO[cue as keyof typeof SYSTEM_VOICE_AUDIO] ?? EXERCISE_NAME_AUDIO[cue];

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
  const [voiceQueue, setVoiceQueue] = useState<string[]>([]);
  const previousPhaseRef = React.useRef<SessionPhase>('ready');

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

  const enqueueVoiceCues = useCallback((cues: string[]) => {
    if (!cues.length) {
      return;
    }
    setVoiceQueue((prev) => [...prev, ...cues]);
  }, []);

  const handleVoiceCueComplete = useCallback(() => {
    setVoiceQueue((prev) => (prev.length ? prev.slice(1) : prev));
  }, []);

  const handleFinishSession = () => {
    const completedSoFar = phase === 'rest' ? currentIndex + 1 : currentIndex;
    Alert.alert(
      'Finish Workout?',
      `You have completed ${completedSoFar} exercise(s) in ${formatClock(totalSeconds)}.`,
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: () => navigation.navigate('HomeTabs'),
        },
      ]
    );
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

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    if (phase === 'exercise' && previousPhase !== 'exercise') {
      enqueueVoiceCues(['start']);
    }

    if (phase === 'rest' && previousPhase !== 'rest') {
      const nextExerciseId = exercises[currentIndex + 1]?.id;
      const nextQueue = ['rest', 'coming_up_next'];
      if (nextExerciseId && EXERCISE_NAME_AUDIO[nextExerciseId]) {
        nextQueue.push(nextExerciseId);
      }
      enqueueVoiceCues(nextQueue);
    }

    previousPhaseRef.current = phase;
  }, [phase, currentIndex, exercises, enqueueVoiceCues]);

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
      {voiceQueue[0] ? (
        <Video
          key={`voice-cue-${voiceQueue[0]}-${voiceQueue.length}`}
          source={resolveVoiceCueSource(voiceQueue[0])}
          paused={false}
          repeat={false}
          muted={false}
          controls={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onEnd={handleVoiceCueComplete}
          onError={handleVoiceCueComplete}
          style={styles.hiddenAudio}
        />
      ) : null}

      <Video
        source={require('../assets/audio/exercise_loop.wav')}
        paused={phase !== 'exercise' || paused}
        repeat
        muted={false}
        volume={0.6}
        controls={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        style={styles.hiddenAudio}
      />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.programName}>{program.name.toUpperCase()}</Text>
          {phase !== 'ready' ? (
            <TouchableOpacity style={styles.finishButton} activeOpacity={0.85} onPress={handleFinishSession}>
              <SimpleIcon name="x" size={16} color="#F87171" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {phase === 'ready' ? (
          <View style={styles.readyWrap}>
            <View style={styles.readyCard}>
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>UP NEXT</Text>
              </View>
              <WorkoutAnimation animation={currentExercise.animation} size={220} speed={currentExercise.type === 'timer' ? 1 : 0.9} />
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
    paddingTop: Spacing.x3 + Spacing.sm,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerSpacer: {
    width: 34,
    height: 34,
  },
  programName: {
    flexShrink: 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  finishButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.38)',
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.lg,
  },
  readyCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  readyBadge: {
    alignSelf: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  readyBadgeText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
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
  hiddenAudio: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
});
