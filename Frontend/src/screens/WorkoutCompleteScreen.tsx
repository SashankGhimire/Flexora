import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/tokens';
import { WorkoutCompleteCard } from '../components/workout';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutComplete'>;

const formatTotalTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const WorkoutCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { completedExercises, totalSeconds } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WorkoutCompleteCard
          completed={completedExercises}
          totalTime={formatTotalTime(totalSeconds)}
          onDone={() => navigation.navigate('HomeTabs')}
        />
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
