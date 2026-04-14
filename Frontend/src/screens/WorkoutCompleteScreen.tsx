import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getApiServerOrigin } from '../services/api';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { PrimaryButton, SimpleIcon } from '../components/ui';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutComplete'>;

const formatTotalTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const WorkoutCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { themeMode } = useTheme();
  const styles = React.useMemo(() => createStyles(), [themeMode]);
  const { user } = useAuth();
  const { completedExercises, totalSeconds } = route.params;
  const avatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')
      ? user.avatarUrl
      : `${getApiServerOrigin()}${user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`}`
    : '';
  const initials = (user?.name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <SimpleIcon name="arrow-left" size={20} color={Colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
            <SimpleIcon name="more-horizontal" size={20} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileWrap}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Text style={styles.name}>{user?.name || 'Workout Complete'}</Text>
          <Text style={styles.subMeta}>Session finished successfully</Text>
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amountValue}>{completedExercises}</Text>
          <Text style={styles.amountUnit}>Exercises Completed</Text>
          <Text style={styles.timeText}>{formatTotalTime(totalSeconds)}</Text>
        </View>

        <View style={styles.bottomBar}>
          <PrimaryButton
            title="Complete"
            onPress={() => navigation.navigate('HomeTabs')}
            style={styles.completeButton}
            icon={<SimpleIcon name="check-circle" size={18} color={Colors.textOnPrimary} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingTop: Spacing.x3 + Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileWrap: {
    alignItems: 'center',
    marginTop: Spacing.x3,
  },
  avatarWrap: {
    width: 94,
    height: 94,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.primaryDark,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  name: {
    marginTop: Spacing.lg,
    color: Colors.primaryDark,
    fontSize: 44,
    fontWeight: FontWeight.heavy,
    textAlign: 'center',
  },
  subMeta: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.title,
    textAlign: 'center',
  },
  amountWrap: {
    marginTop: 120,
    alignItems: 'center',
  },
  amountValue: {
    color: Colors.primaryDark,
    fontSize: 88,
    fontWeight: FontWeight.heavy,
    lineHeight: 96,
  },
  amountUnit: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: FontWeight.semi,
  },
  timeText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 28,
    fontWeight: FontWeight.medium,
  },
  bottomBar: {
    marginTop: 'auto',
    paddingBottom: Spacing.x2,
  },
  completeButton: {
    minHeight: 58,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});


