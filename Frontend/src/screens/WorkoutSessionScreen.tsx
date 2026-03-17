import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
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
  const isFocused = useIsFocused();
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

  const shouldPlayExerciseLoop =
    isFocused && phase === 'exercise' && !paused && voiceQueue.length === 0;
  const shouldPlayVoiceCue = isFocused && phase !== 'countdown' && voiceQueue.length > 0;
  const shouldPlayCountdownAudio = isFocused && phase === 'countdown';

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

  useEffect(() => {
    return () => {
      setVoiceQueue([]);
    };
  }, []);

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
      {shouldPlayVoiceCue && voiceQueue[0] ? (
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

      {shouldPlayExerciseLoop ? (
        <Video
          key="exercise-loop-active"
          source={require('../assets/audio/exercise_loop.wav')}
          paused={false}
          repeat
          muted={false}
          volume={0.6}
          controls={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          style={styles.hiddenAudio}
        />
      ) : null}

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programSubtitle}>{program.focus} workout</Text>
          </View>
          <TouchableOpacity style={styles.finishButton} activeOpacity={0.85} onPress={handleFinishSession}>
            <SimpleIcon name="x" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {phase === 'ready' ? (
          <View style={styles.readyWrap}>
            <ScrollView
              style={styles.readyScroll}
              contentContainerStyle={styles.readyScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.readyContent}>
                <View style={styles.readyTopMeta}>
                  <View style={styles.readyEyebrowPill}>
                    <Text style={styles.readyEyebrow}>Ready</Text>
                  </View>
                  <View style={styles.livePill}>
                    <Text style={styles.livePillText}>Guided Session</Text>
                  </View>
                </View>

              <Text style={styles.readyTitle}>{currentExercise.name}</Text>
              <Text style={styles.readySub}>
                {program.focus} workout with guided pacing and music
              </Text>

              <View style={styles.heroShell}>
                <View style={styles.heroAccentOrb} />
                <View style={styles.heroAccentOrbSecondary} />
                <View style={styles.heroPanel}>
                  <View style={styles.heroPanelGlow} />
                  <WorkoutAnimation animation={currentExercise.animation} size={235} speed={currentExercise.type === 'timer' ? 1 : 0.9} />
                </View>
              </View>

              <View style={styles.progressStrip}>
                <View style={styles.progressPill}>
                  <Text style={styles.progressLabel}>Program</Text>
                  <Text style={styles.progressValue}>{program.name}</Text>
                </View>
                <View style={styles.progressPill}>
                  <Text style={styles.progressLabel}>Up Next</Text>
                  <Text style={styles.progressValue}>Exercise 1 of {exercises.length}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <SimpleIcon name="clock" size={16} color={Colors.primary} />
                  <Text style={styles.detailValue}>{program.durationMinutes} min</Text>
                    <Text style={styles.detailLabel}>Duration</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <SimpleIcon name="list" size={16} color={Colors.primary} />
                    <Text style={styles.detailValue}>{exercises.length}</Text>
                    <Text style={styles.detailLabel}>Exercises</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <SimpleIcon name="bar-chart-2" size={16} color={Colors.primary} />
                    <Text style={styles.detailValue}>Beginner</Text>
                    <Text style={styles.detailLabel}>Level</Text>
                </View>
              </View>

              <View style={styles.previewBlock}>
                <Text style={styles.previewLabel}>First exercise target</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewTimer}>
                    <TimerCircle progress={1} label={currentExercise.type === 'timer' ? formatClock(currentExercise.duration ?? 20) : `x${currentExercise.reps ?? 0}`} />
                  </View>
                  <Text style={styles.previewCardTitle}>{currentExercise.type === 'timer' ? 'Timed exercise' : 'Rep-based exercise'}</Text>
                  <Text style={styles.previewCardText}>
                    {currentExercise.type === 'timer'
                      ? 'Move with steady pace and maintain form until the timer ends.'
                      : 'Complete the target reps with controlled movement and good form.'}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomCtaWrap}>
                <Text style={styles.bottomHint}>Tap below when you are ready to begin</Text>
              </View>

                <PrimaryButton
                  title="Start Workout"
                  onPress={() => {
                    setCountdown(3);
                    setPhase('countdown');
                  }}
                  style={styles.readyButton}
                />
              </View>
            </ScrollView>
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

      {phase === 'countdown' ? <CountdownOverlay count={countdown} active={shouldPlayCountdownAudio} /> : null}
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
  headerTextWrap: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  programName: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  programSubtitle: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  finishButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyWrap: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  readyScroll: {
    flex: 1,
  },
  readyScrollContent: {
    paddingBottom: Spacing.xl,
  },
  readyContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  readyTopMeta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyEyebrowPill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryA12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  readyEyebrow: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  livePill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  livePillText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  heroShell: {
    width: '100%',
    marginTop: Spacing.lg,
    position: 'relative',
  },
  heroAccentOrb: {
    position: 'absolute',
    top: -12,
    right: -4,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryA12,
  },
  heroAccentOrbSecondary: {
    position: 'absolute',
    bottom: -8,
    left: 6,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLightA14,
  },
  heroPanel: {
    width: '100%',
    borderRadius: 20,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  heroPanelGlow: {
    position: 'absolute',
    top: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primaryA08,
  },
  readyTitle: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: FontWeight.heavy,
    textAlign: 'center',
  },
  readySub: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  detailRow: {
    width: '100%',
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressStrip: {
    width: '100%',
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressPill: {
    flex: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
  },
  progressValue: {
    marginTop: 4,
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  detailItem: {
    flex: 1,
    minHeight: 88,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  detailValue: {
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  detailLabel: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    textAlign: 'center',
  },
  previewBlock: {
    width: '100%',
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  previewLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewTimer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  previewCardTitle: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  previewCardText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  bottomCtaWrap: {
    width: '100%',
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  bottomHint: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    textAlign: 'center',
  },
  readyButton: {
    marginTop: Spacing.md,
    width: '100%',
    minHeight: 54,
    borderRadius: Radius.lg,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hiddenAudio: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
});



