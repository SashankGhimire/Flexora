import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type WorkoutCardProgram = {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  exerciseIds: string[];
};

type WorkoutCardProps = {
  program: WorkoutCardProgram;
  onPress: () => void;
};

const PROGRAM_COVER: Record<string, string> = {
  'abs-beginner': 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  'arm-beginner': 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  'chest-beginner': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  'leg-beginner': 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  'shoulder-beginner': 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'back-beginner': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'full-body-beginner': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
  abs: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=70',
  arms: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=900&q=70',
  chest: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70',
  legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=70',
  shoulder: 'https://images.unsplash.com/photo-1659350774685-04b709a54863?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  back: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70',
  'full body': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70',
};

const resolveProgramCover = (program: WorkoutCardProgram): string =>
  PROGRAM_COVER[program.id] || PROGRAM_COVER[program.focus.toLowerCase()] || PROGRAM_COVER['full body'];

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ program, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <ImageBackground source={{ uri: resolveProgramCover(program) }} imageStyle={styles.image} style={styles.imageWrap}>
        <View style={styles.overlay}>
          <View style={styles.topRow}>
            <Text style={styles.focus}>{program.focus.toUpperCase()}</Text>
            <View style={styles.timePill}>
              <Text style={styles.time}>{program.durationMinutes} min</Text>
            </View>
          </View>

          <Text style={styles.name}>{program.name}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.meta}>{program.exerciseIds.length} exercises</Text>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaText}>Open</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  imageWrap: {
    minHeight: 126,
  },
  image: {
    borderRadius: Radius.xl,
  },
  overlay: {
    minHeight: 126,
    backgroundColor: Colors.blackA45,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focus: {
    color: Colors.primaryLight,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  timePill: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundA82,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  time: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  name: {
    marginTop: Spacing.md,
    color: Colors.textOnPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.heavy,
  },
  bottomRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.caption,
  },
  ctaPill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA42,
    backgroundColor: Colors.primaryLightA2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  ctaText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
});



