import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PrimaryButton, SimpleIcon } from '../components/ui';
import { resetWorkoutProgress } from '../services/progressService';
import { getLocalOnboardingProfile, getOnboardingProfile } from '../services/onboardingService';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { HomeStackParamList } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutSettings'>;

const REST_OPTIONS = [15, 20, 25, 30, 45, 60] as const;

const formatGender = (value?: string): string => {
  if (value === 'male') return 'Male';
  if (value === 'female') return 'Female';
  if (value === 'prefer_not') return 'Prefer not to say';
  return 'Not set';
};

const formatAge = (value?: number): string => {
  if (typeof value !== 'number' || value <= 0) {
    return 'Not set';
  }

  return `${Math.floor(value)} years`;
};

export const WorkoutSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { themeMode } = useTheme();
  const styles = useMemo(() => createStyles(themeMode), [themeMode]);
  const { width } = useWindowDimensions();
  const compact = width <= 390;

  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(Number(user?.restTimerSeconds || 25));
  const [onboardingProfile, setOnboardingProfile] = useState<{
    age?: number;
    gender?: string;
    dateOfBirth?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setOnboardingProfile(null);
      return;
    }

    let mounted = true;

    const hydrateOnboardingProfile = async () => {
      const localProfile = await getLocalOnboardingProfile(user.id);
      let profile = localProfile;

      if (!profile) {
        try {
          const remote = await getOnboardingProfile(user.id);
          profile = remote?.profile || null;
        } catch {
          profile = null;
        }
      }

      if (!mounted) {
        return;
      }

      setOnboardingProfile(profile || null);
    };

    hydrateOnboardingProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const resolvedGender = user?.gender || onboardingProfile?.gender;
  const resolvedAge = typeof onboardingProfile?.age === 'number' && onboardingProfile.age > 0 ? onboardingProfile.age : null;

  const handleSave = async () => {
    if (!user?.id) {
      return;
    }

    if (restTimerSeconds < 5 || restTimerSeconds > 300) {
      Alert.alert('Invalid rest timer', 'Choose a rest timer between 5 and 300 seconds.');
      return;
    }

    setSaving(true);
    try {
      await updateAuthProfile({
        restTimerSeconds,
      });

      Alert.alert(
        'Workout Settings Updated',
        restTimerSeconds === 20 ? 'Rest timer added to 20 seconds.' : 'Your rest timer was saved successfully.'
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save Failed', error?.message || 'Could not save workout settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetProgress = async () => {
    Alert.alert(
      'Restart Progress?',
      'This clears workout history and stats for this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetWorkoutProgress();
              Alert.alert('Progress Reset', 'Your workout progress has been restarted.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Reset Failed', error?.message || 'Could not restart progress.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <SimpleIcon name="chevron-left" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Workout Settings</Text>
            <Text style={styles.subtitle}>Read-only profile details from backend and recovery controls for training.</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileHeaderIconWrap}>
              <SimpleIcon name="user" size={20} color={Colors.primaryDark} />
            </View>
            <View style={styles.profileHeaderTextWrap}>
              <Text style={styles.profileCardTitle}>Details</Text>
              <Text style={styles.profileCardText}>Used to tailor your workouts, pacing, and recovery.</Text>
            </View>
          </View>

          <View style={styles.profileInfoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <SimpleIcon name="user" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{formatGender(resolvedGender)}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <SimpleIcon name="activity" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{formatAge(resolvedAge ?? undefined)}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Rest Timer</Text>
          <Text style={styles.sectionSub}>Sets the break between exercises for non-AI workouts.</Text>
          <View style={styles.optionGrid}>
            {REST_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.optionPill, restTimerSeconds === option && styles.optionPillActive]}
                onPress={() => setRestTimerSeconds(option)}
              >
                <Text style={[styles.optionPillText, restTimerSeconds === option && styles.optionPillTextActive]}>{option}s</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIconWrap}>
            <SimpleIcon name="refresh-ccw" size={16} color={Colors.error} />
          </View>
          <View style={styles.warningTextWrap}>
            <Text style={styles.warningTitle}>Restart Progress</Text>
            <Text style={styles.warningText}>Clear workout history and stats for this account.</Text>
          </View>
          <Pressable style={styles.warningButton} onPress={handleResetProgress} disabled={resetting}>
            <Text style={styles.warningButtonText}>{resetting ? 'Resetting...' : 'Restart'}</Text>
          </Pressable>
        </View>

        <PrimaryButton title={saving ? 'Saving...' : 'Save Settings'} onPress={handleSave} disabled={saving} style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (themeMode: 'light' | 'dark') => {
  const isDark = themeMode === 'dark';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      marginTop: Spacing.sm,
      paddingBottom: Spacing.x3,
    },
    contentCompact: {
      paddingHorizontal: Spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      flex: 1,
      paddingTop: 2,
    },
    title: {
      color: Colors.textPrimary,
      fontSize: Typography.heading,
      fontWeight: FontWeight.heavy,
    },
    subtitle: {
      marginTop: 4,
      color: Colors.textSecondary,
      fontSize: Typography.caption,
      lineHeight: 18,
    },
    profileCard: {
      marginTop: Spacing.lg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.card,
      overflow: 'hidden',
      padding: Spacing.md,
    },
    profileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    profileHeaderIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 18,
      backgroundColor: Colors.primaryLightA22,
      borderWidth: 1,
      borderColor: Colors.primaryA35,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileHeaderTextWrap: {
      flex: 1,
    },
    profileCardTitle: {
      color: Colors.textPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
    },
    profileCardText: {
      marginTop: 4,
      color: Colors.textSecondary,
      fontSize: Typography.caption,
      lineHeight: 18,
    },
    profileInfoList: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: isDark ? Colors.background : Colors.white,
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
    },
    infoIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTextWrap: {
      flex: 1,
    },
    infoLabel: {
      color: Colors.textSecondary,
      fontSize: Typography.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: FontWeight.semi,
    },
    infoValue: {
      marginTop: 4,
      color: Colors.textPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
    },
    infoDivider: {
      height: 1,
      backgroundColor: Colors.border,
      marginLeft: 72,
    },
    sectionCard: {
      marginTop: Spacing.md,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.card,
      padding: Spacing.md,
    },
    sectionLabel: {
      color: Colors.textPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.semi,
      marginBottom: 8,
    },
    sectionSub: {
      color: Colors.textSecondary,
      fontSize: Typography.caption,
      marginBottom: Spacing.sm,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    optionPill: {
      minWidth: 68,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingVertical: 10,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    optionPillActive: {
      backgroundColor: Colors.primaryLightA22,
      borderColor: Colors.primaryA35,
    },
    optionPillText: {
      color: Colors.textPrimary,
      fontSize: Typography.caption,
      fontWeight: FontWeight.semi,
    },
    optionPillTextActive: {
      color: Colors.primary,
    },
    warningCard: {
      marginTop: Spacing.md,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.errorA35,
      backgroundColor: Colors.errorA12,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    warningIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.errorA35,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warningTextWrap: {
      flex: 1,
    },
    warningTitle: {
      color: Colors.textPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
    },
    warningText: {
      marginTop: 4,
      color: Colors.textSecondary,
      fontSize: Typography.caption,
      lineHeight: 18,
    },
    warningButton: {
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: Colors.errorA35,
      backgroundColor: Colors.card,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    warningButtonText: {
      color: Colors.error,
      fontSize: Typography.caption,
      fontWeight: FontWeight.bold,
    },
    saveButton: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.xl,
    },
  });
};
