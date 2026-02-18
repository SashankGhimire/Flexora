import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SimpleIcon } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { ExerciseType, HomeStackParamList } from '../../types/navigation';

const ACCENT = '#22C55E';

const EXERCISES: Array<{
  key: ExerciseType;
  name: string;
  subtitle: string;
  icon: string;
}> = [
  {
    key: 'squat',
    name: 'Squats',
    subtitle: 'Lower body strength',
    icon: 'activity',
  },
  {
    key: 'pushup',
    name: 'Pushups',
    subtitle: 'Upper body power',
    icon: 'target',
  },
  {
    key: 'lunge',
    name: 'Lunges',
    subtitle: 'Leg balance control',
    icon: 'zap',
  },
  {
    key: 'plank',
    name: 'Plank',
    subtitle: 'Core stability hold',
    icon: 'shield',
  },
];

type ExerciseNavProp = NativeStackNavigationProp<
  HomeStackParamList,
  'ExerciseSelection'
>;

export const ExerciseSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseNavProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Exercise</Text>
        <Text style={styles.subtitle}>Pick a movement to begin</Text>
      </View>

      <FlatList
        data={EXERCISES}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Workout', { exercise: item.key })}
          >
            <View style={styles.iconWrap}>
              <SimpleIcon name={item.icon} size={22} color={ACCENT} />
            </View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  column: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${ACCENT}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
