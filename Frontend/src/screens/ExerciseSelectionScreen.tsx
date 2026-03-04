import React from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SimpleIcon } from '../components/ui';
import { COLORS } from '../utils/constants';
import { ExerciseType, HomeStackParamList } from '../types';

type ExerciseCard = {
  key: ExerciseType;
  name: string;
  description: string;
  icon: string;
  cardBackground: string;
  cardBorder: string;
};

const EXERCISES: ExerciseCard[] = [
  {
    key: 'squat',
    name: 'Squats',
    description: 'Lower body strength and control',
    icon: 'activity',
    cardBackground: '#28322E',
    cardBorder: '#3E5149',
  },
  {
    key: 'pushup',
    name: 'Push Ups',
    description: 'Upper body push movement',
    icon: 'target',
    cardBackground: '#27312D',
    cardBorder: '#3D4F48',
  },
  {
    key: 'lunge',
    name: 'Lunges',
    description: 'Leg balance and coordination',
    icon: 'zap',
    cardBackground: '#28322E',
    cardBorder: '#3E5149',
  },
  {
    key: 'jumpingJack',
    name: 'Jumping Jacks',
    description: 'Full body cardio activation',
    icon: 'users',
    cardBackground: '#27312D',
    cardBorder: '#3D4F48',
  },
  {
    key: 'plank',
    name: 'Plank',
    description: 'Core endurance hold',
    icon: 'shield',
    cardBackground: '#28322E',
    cardBorder: '#3E5149',
  },
  {
    key: 'bicepCurl',
    name: 'Bicep Curl',
    description: 'Arm flexion and control',
    icon: 'activity',
    cardBackground: '#27312D',
    cardBorder: '#3D4F48',
  },
];

type ExerciseNavProp = NativeStackNavigationProp<HomeStackParamList, 'ExerciseSelection'>;

export const ExerciseSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseNavProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Exercise</Text>
        <Text style={styles.subtitle}>Select a movement to start posture tracking</Text>
      </View>

      <FlatList
        data={EXERCISES}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.column}
        ItemSeparatorComponent={() => <View style={styles.rowSpacer} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: item.cardBackground,
                borderColor: item.cardBorder,
              },
              pressed && styles.cardPressed,
            ]}
            onPress={() => navigation.navigate('Workout', { exerciseType: item.key })}
          >
            <View style={styles.cardBody}>
              <View style={styles.iconWrap}>
                <SimpleIcon name={item.icon} size={20} color={COLORS.primaryLight} />
              </View>

              <Text style={styles.cardTitle}>{item.name}</Text>

              <View>
                <Text style={styles.cardSubtitle}>{item.description}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    marginTop: 26,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  subtitle: {
    marginTop: 3,
    color: `${COLORS.textSecondary}CC`,
    fontSize: 12,
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  column: {
    gap: 14,
  },
  rowSpacer: {
    height: 12,
  },
  card: {
    flex: 1,
    height: 166,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: COLORS.card,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.background}7A`,
    borderWidth: 1,
    borderColor: '#3B4641',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: `${COLORS.textSecondary}E0`,
    fontSize: 11,
    lineHeight: 15,
  },
});
