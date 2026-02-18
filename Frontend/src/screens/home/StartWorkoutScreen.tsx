import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/theme';
import { HomeStackParamList, HomeTabParamList } from '../../types/navigation';

const ACCENT = '#22C55E';

type StartWorkoutNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'StartWorkout'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

export const StartWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<StartWorkoutNavProp>();

  const handleStart = () => {
    navigation.navigate('ExerciseSelection');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>Ready to move?</Text>
          <Text style={styles.subtitle}>
            Train with real-time posture guidance and hit your goals.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
