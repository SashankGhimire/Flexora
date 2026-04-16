import React from 'react';
import { InteractionManager } from 'react-native';
import { ImageBackground, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { resolveExercisePreview, resolveExerciseForWorkout } from '../data/workoutData';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { PrimaryButton, SimpleIcon } from '../components/ui';
import { WorkoutAnimation } from '../components/workout';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutProgram'>;

type WorkoutExerciseView = {
  id: string;
  name: string;
  type: 'timer' | 'reps';
  duration: number | null;
  reps: number | null;
  animation: string;
  focus: string[];
  instructions: string;
  mistakes: string[];
};

const PROGRAM_COVER: Record<string, string> = {
  Abs: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  Arm: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  Chest: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  Leg: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  Shoulder: 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop',
  Back: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'Full Body': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
};

const getExerciseMeta = (exercise: WorkoutExerciseView): string => {
  if (exercise.type === 'timer') {
    return `${exercise.duration ?? 0}s timer`;
  }
  return `${exercise.reps ?? 0} reps`;
};

export const WorkoutProgramScreen: React.FC<Props> = ({ route, navigation }) => {
  const { themeMode } = useTheme();
  const styles = React.useMemo(() => createStyles(), [themeMode]);
  const { programId } = route.params;
  const { getWorkout } = useAppData();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [program, setProgram] = React.useState<{ _id: string; title: string; category: string; duration: number } | null>(null);
  const [exercises, setExercises] = React.useState<WorkoutExerciseView[]>([]);
  const [selectedExercise, setSelectedExercise] = React.useState<WorkoutExerciseView | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const hydrateWorkout = async () => {
      setLoading(true);
      setError(null);

      try {
        const workout = await getWorkout(programId);
        if (!workout) {
          setProgram(null);
          setExercises([]);
          setError('Workout not found');
          return;
        }

        if (!mounted) {
          return;
        }

        setProgram({
          _id: workout._id,
          title: workout.title,
          category: workout.category,
          duration: workout.duration,
        });

        const mappedExercises: WorkoutExerciseView[] = workout.exercises
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const fallbackExercise = resolveExerciseForWorkout(workout.category, item.exercise?.name || '', item.order - 1);
            const resolvedPreview = resolveExercisePreview(item.exercise?.name || item.exercise?._id || '');
            const resolvedAnimation = resolvedPreview?.animation || fallbackExercise?.animation || 'jumping_jacks.json';

            return {
              id: item.exercise?._id || `${workout._id}-${item.order}`,
              name: item.exercise?.name || fallbackExercise?.name || 'Exercise',
              type: item.duration || item.exercise?.duration ? 'timer' : 'reps',
              duration: item.duration ?? item.exercise?.duration ?? fallbackExercise?.duration ?? null,
              reps: item.reps ?? item.exercise?.reps ?? fallbackExercise?.reps ?? null,
              animation: resolvedAnimation,
              focus: item.exercise?.targetMuscle || fallbackExercise?.focus || ['general'],
              instructions:
                item.exercise?.instructions || fallbackExercise?.instructions || resolveExercisePreview(item.exercise?.name || '')?.instructions || 'Follow proper form and controlled movement.',
              mistakes:
                item.exercise?.postureTips || fallbackExercise?.mistakes || resolveExercisePreview(item.exercise?.name || '')?.mistakes || ['Keep your posture aligned and controlled.'],
            };
          });

        if (mounted) {
          setExercises(mappedExercises);
        }
      } catch (loadError: any) {
        if (mounted) {
          setError(loadError?.message || 'Failed to load workout');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      hydrateWorkout();
    });

    return () => {
      mounted = false;
      interactionTask.cancel();
    };
  }, [getWorkout, programId]);

  if (!program && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.notFound}>{error || 'Program not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!program || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.notFound}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayFocus =
    program.category === 'full body'
      ? 'Full Body'
      : `${program.category.charAt(0).toUpperCase()}${program.category.slice(1)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: PROGRAM_COVER[displayFocus] }} style={styles.heroCard} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>{displayFocus.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{program.title}</Text>
            <Text style={styles.heroSub}>Structured beginner workout</Text>
          </View>
        </ImageBackground>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{program.duration} min</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{exercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>Exercise List</Text>
          <Text style={styles.sectionSub}>Tap any exercise for form guidance</Text>
        </View>
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.88}
              style={styles.exerciseItem}
              onPress={() => setSelectedExercise(exercise)}
            >
              <View style={styles.exerciseHead}>
                <View style={styles.previewWrap}>
                  <WorkoutAnimation
                    animation={exercise.animation}
                    size={68}
                    autoPlay
                    loop
                    speed={exercise.type === 'timer' ? 1 : 0.9}
                  />
                </View>
                <View style={styles.exerciseHeadText}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseSub}>Focus: {exercise.focus.join(', ')}</Text>
                </View>
                <View style={styles.exerciseIndexBadge}>
                  <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                </View>
              </View>

              <View style={styles.exerciseMetaRow}>
                <View style={styles.metaPill}>
                  <SimpleIcon name="clock" size={12} color={Colors.primary} />
                  <Text style={styles.metaPillText}>{getExerciseMeta(exercise)}</Text>
                </View>
                <View style={styles.metaPillAlt}>
                  <Text style={styles.metaPillTextAlt}>{exercise.type.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.exerciseFooter}>
                <Text style={styles.exerciseFooterText}>Tap to view form and mistakes</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.stickyCtaWrap}>
        <PrimaryButton
          title="START WORKOUT"
          onPress={() => navigation.navigate('WorkoutSession', { programId })}
          style={styles.stickyCtaButton}
        />
      </View>

      <Modal visible={Boolean(selectedExercise)} animationType="slide" transparent onRequestClose={() => setSelectedExercise(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedExercise ? (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{selectedExercise.name.toUpperCase()}</Text>
                  <TouchableOpacity style={styles.modalCloseTop} activeOpacity={0.85} onPress={() => setSelectedExercise(null)}>
                    <Text style={styles.modalCloseTopText}>X</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalAnimWrap}>
                  <WorkoutAnimation
                    key={selectedExercise.id}
                    animation={selectedExercise.animation}
                    size={170}
                    speed={selectedExercise.type === 'timer' ? 1 : 0.9}
                  />
                </View>
                <Text style={styles.modalSub}>Focus Area</Text>
                <View style={styles.focusTagRow}>
                  {selectedExercise.focus.map((item) => (
                    <View key={`${selectedExercise.id}-${item}`} style={styles.focusTag}>
                      <Text style={styles.focusTagText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.modalSub}>Instructions</Text>
                <Text style={styles.modalText}>{selectedExercise.instructions}</Text>
                <Text style={styles.modalSub}>Common Mistake</Text>
                <View style={styles.mistakeHighlight}>
                  <Text style={styles.mistakeHighlightText}>{selectedExercise.mistakes[0]}</Text>
                </View>
                <Text style={styles.modalSub}>All Common Mistakes</Text>
                {selectedExercise.mistakes.map((mistake, index) => (
                  <Text key={`${selectedExercise.id}-${index}`} style={styles.modalBullet}>{`${index + 1}. ${mistake}`}</Text>
                ))}
                <TouchableOpacity style={styles.closeButton} activeOpacity={0.85} onPress={() => setSelectedExercise(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: 168,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
  },
  heroCard: {
    minHeight: 186,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroImage: {
    borderRadius: Radius.xl,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.blackA45,
  },
  heroTag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA52,
    backgroundColor: Colors.primaryLightA2,
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: Colors.textOnPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  heroSub: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.body,
  },
  summaryCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryPill: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  summaryLabel: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  sectionTop: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  sectionSub: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  exerciseList: {
    gap: Spacing.sm,
  },
  exerciseItem: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  exerciseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewWrap: {
    width: 82,
    height: 82,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseHeadText: {
    flex: 1,
  },
  exerciseIndexBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA52,
    backgroundColor: Colors.primaryLightA2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  exerciseIndexText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  exerciseSub: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metaPill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA42,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPillAlt: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  metaPillText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },
  metaPillTextAlt: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },
  exerciseFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseFooterText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  bottomSpace: {
    height: 12,
  },
  stickyCtaWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.xl,
  },
  stickyCtaButton: {
    minHeight: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.blackA56,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '82%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.x2,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: FontWeight.heavy,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalCloseTop: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseTopText: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  modalAnimWrap: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  focusTagRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  focusTag: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  focusTagText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },
  modalSub: {
    marginTop: Spacing.md,
    color: Colors.primary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  mistakeHighlight: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.errorA35,
    backgroundColor: Colors.errorA12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  mistakeHighlightText: {
    color: Colors.error,
    fontSize: Typography.body,
    fontWeight: FontWeight.semi,
  },
  modalText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 19,
  },
  modalBullet: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    lineHeight: 19,
  },
  closeButton: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  closeText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
});



