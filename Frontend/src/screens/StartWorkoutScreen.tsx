import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, SimpleIcon } from '../components/ui';
import { HomeStackParamList, HomeTabParamList } from '../types';
import { Colors } from '../theme/colors';
import { FontWeight, Spacing, Typography } from '../theme/tokens';

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
        <Card style={styles.heroCard}>
          <View style={styles.badge}>
            <SimpleIcon name="activity" size={13} color={Colors.primary} />
            <Text style={styles.badgeText}>Workout Ready</Text>
          </View>

          <Text style={styles.title}>Ready to move?</Text>
          <Text style={styles.subtitle}>Train with real-time posture guidance and hit your goals.</Text>

          <Button title="Start Workout" onPress={handleStart} style={styles.startButton} />
        </Card>
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
  heroCard: {
    backgroundColor: Colors.card,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  badgeText: {
    marginLeft: Spacing.xs,
    color: Colors.primary,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: Typography.display,
    lineHeight: Typography.displayLine,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.subtitle,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  startButton: {
    marginTop: Spacing.xl,
  },
});
