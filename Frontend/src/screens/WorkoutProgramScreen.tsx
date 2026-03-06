import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { WorkoutExercise, getExercisesForProgram, getProgramById } from '../data/workoutData';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Card, PrimaryButton, SectionHeader } from '../components/ui';
import { ExerciseCard, WorkoutAnimation } from '../components/workout';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutProgram'>;

export const WorkoutProgramScreen: React.FC<Props> = ({ route, navigation }) => {
  const { programId } = route.params;
  const program = getProgramById(programId);
  const exercises = getExercisesForProgram(programId);
  const [selectedExercise, setSelectedExercise] = React.useState<WorkoutExercise | null>(null);

  if (!program) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.notFound}>Program not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title={program.name.toUpperCase()} subtitle="Structured beginner workout" />

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{program.durationMinutes} min</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{exercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Exercise List" subtitle="Instructions and form guidance" style={styles.sectionTop} />
        {exercises.map((exercise, index) => (
          <ExerciseCard key={exercise.id} index={index} exercise={exercise} onPress={() => setSelectedExercise(exercise)} />
        ))}

        <PrimaryButton
          title="START WORKOUT"
          onPress={() => navigation.navigate('WorkoutSession', { programId })}
          style={styles.startButton}
        />

        <View style={styles.bottomSpace} />
      </ScrollView>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x2,
    paddingBottom: Spacing.x2,
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
  summaryCard: {
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
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
  startButton: {
    marginTop: Spacing.lg,
  },
  bottomSpace: {
    height: 92,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.56)',
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
    borderColor: 'rgba(34, 197, 94, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(248, 113, 113, 0.13)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  mistakeHighlightText: {
    color: '#FCA5A5',
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
    color: Colors.background,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
});
