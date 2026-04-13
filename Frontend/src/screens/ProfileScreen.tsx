import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getApiServerOrigin } from '../services/api';
import {
  getNotificationPreference,
  getProfileGoal,
  setNotificationPreference,
  updateProfileGoal,
} from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { getLocalOnboardingProfile, getOnboardingProfile } from '../services/onboardingService';
import { Colors } from '../theme/colors';
import { HomeStackParamList } from '../types';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Button, Card, PrimaryButton, SectionHeader, SimpleIcon, StatCard } from '../components/ui';

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
  { value: 'stay_active', label: 'Stay Active' },
];

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { getProgressForUser } = useAppData();
  const { themeMode, toggleTheme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useMemo(() => createStyles(themeMode), [themeMode]);
  const heroIconColor = themeMode === 'dark' ? Colors.textPrimary : Colors.primaryDark;
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const scrollRef = React.useRef<ScrollView>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarAsset, setAvatarAsset] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [weightLabel, setWeightLabel] = useState('--');
  const [workoutsCompletedLabel, setWorkoutsCompletedLabel] = useState('0');
  const [totalTimeLabel, setTotalTimeLabel] = useState('0m');
  const [streakLabel, setStreakLabel] = useState('0-day streak');
  const [selectedGoal, setSelectedGoal] = useState('improve_fitness');
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const selectedGoalLabel = GOAL_OPTIONS.find((option) => option.value === selectedGoal)?.label || 'Improve Fitness';

  // For button label
  const themeLabel = themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  useEffect(() => {
    if (!isEditing) {
      setName(user?.name || '');
    }
  }, [user?.name, isEditing]);

  useEffect(() => {
    if (!user?.id) {
      setWeightLabel('--');
      return;
    }

    const hydrateWeight = async () => {
      const localProfile = await getLocalOnboardingProfile(user.id);
      let profile = localProfile;

      if (!profile) {
        try {
          const remote = await getOnboardingProfile(user.id);
          profile = remote?.profile || remote?.data || null;
        } catch {
          profile = null;
        }
      }

      if (typeof profile?.weight === 'number' && profile.weight > 0) {
        setWeightLabel(`${profile.weight.toFixed(1)} kg`);
        return;
      }

      setWeightLabel('--');
    };

    hydrateWeight();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const calculateStreak = (dates: Array<string | Date>): number => {
      if (!dates.length) {
        return 0;
      }

      const uniqueDays = Array.from(
        new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)))
      ).sort((left, right) => (left < right ? 1 : -1));

      let streak = 1;
      let cursor = new Date(uniqueDays[0]);

      for (let index = 1; index < uniqueDays.length; index += 1) {
        const current = new Date(uniqueDays[index]);
        const diffDays = Math.round((cursor.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak += 1;
          cursor = current;
        } else if (diffDays > 1) {
          break;
        }
      }

      return streak;
    };

    const loadProfileProgress = async () => {
      const progress = await getProgressForUser(user.id);
      if (!progress?.performanceStats) {
        return;
      }

      setWorkoutsCompletedLabel(String(progress.performanceStats.totalWorkouts || 0));
      setTotalTimeLabel(`${Math.round(progress.performanceStats.totalWorkoutMinutes || 0)}m`);

      const workoutHistory = Array.isArray(progress?.workoutHistory) ? progress.workoutHistory : [];
      const streakDays = calculateStreak(
        workoutHistory.map((item: { completedAt?: string }) => item.completedAt || new Date().toISOString())
      );
      setStreakLabel(`${streakDays}-day streak`);
    };

    loadProfileProgress();
  }, [getProgressForUser, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const hydratePreferences = async () => {
      const notificationEnabled = await getNotificationPreference(user.id);
      setNotificationsEnabled(notificationEnabled);

      const remoteGoal = await getProfileGoal();
      if (remoteGoal) {
        setSelectedGoal(remoteGoal);
      }
    };

    hydratePreferences();
  }, [user?.id]);

  const avatarUrl = useMemo(() => {
    if (!user?.avatarUrl) return '';
    if (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) {
      return user.avatarUrl;
    }
    return `${getApiServerOrigin()}${user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`}`;
  }, [user?.avatarUrl]);

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setAvatarAsset({
        uri: asset.uri,
        name: asset.fileName,
        type: asset.type,
      });
    }
  };

  const handleSave = async () => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName && !avatarAsset) {
        Alert.alert('Nothing to update', 'Please change your name or photo.');
        return;
      }
      if (!trimmedName) {
        Alert.alert('Invalid name', 'Name cannot be empty.');
        return;
      }
      setSaving(true);
      await updateProfile({
        name: trimmedName,
        avatar: avatarAsset,
      });
      setIsEditing(false);
      setAvatarAsset(null);
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleToggleNotifications = async () => {
    if (!user?.id) {
      return;
    }

    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    await setNotificationPreference(user.id, nextValue);
  };

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await updateProfileGoal(selectedGoal);
      setGoalModalVisible(false);
    } catch (error: any) {
      Alert.alert('Goal update failed', error?.message || 'Unable to save your goal now.');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerAccentWash} />
          <View style={styles.headerSheen} />
          <View style={styles.headerRibbon} />
          <View style={styles.headerGridLineOne} />
          <View style={styles.headerGridLineTwo} />
          <View style={styles.headerTextureBarOne} />
          <View style={styles.headerTextureBarTwo} />
          <View style={styles.headerOverlay}>
            <View style={styles.headerTopRow}>
              <View style={styles.memberPill}>
                <SimpleIcon name="award" size={12} color={heroIconColor} />
                <Text style={styles.memberPillText}>Active member</Text>
              </View>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.headerEditButton}
                  activeOpacity={0.8}
                  onPress={handleStartEditing}
                >
                  <SimpleIcon name="edit" size={14} color={heroIconColor} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.headerCenter}>
              <View style={styles.avatarWrap}>
                {avatarAsset?.uri || avatarUrl ? (
                  <Image source={{ uri: avatarAsset?.uri || avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {(user?.name || 'User')
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                )}
              </View>

              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                />
              ) : (
                <Text style={styles.name}>{user?.name || 'User'}</Text>
              )}
              <Text style={styles.email}>{user?.email || 'email@domain.com'}</Text>
              <View style={styles.headerDivider} />

              {!isEditing ? (
                <View style={styles.headerInfoRow}>
                  <View style={styles.headerInfoChip}>
                    <SimpleIcon name="activity" size={12} color={heroIconColor} />
                    <Text style={styles.headerInfoText}>{workoutsCompletedLabel} workouts</Text>
                  </View>
                  <View style={styles.headerInfoChip}>
                    <SimpleIcon name="award" size={12} color={heroIconColor} />
                    <Text style={styles.headerInfoText}>{streakLabel}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {isEditing ? (
              <View style={styles.editRow}>
                <Button title="Change Photo" variant="secondary" onPress={handlePickAvatar} style={[styles.editBtnHalf, styles.editSecondaryButton]} />
                <PrimaryButton
                  title={saving ? 'Saving...' : 'Save'}
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.editBtnHalf, styles.editPrimaryButton]}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.statRow, compact && styles.statRowCompact]}>
          <StatCard
            label="Workouts Completed"
            value={workoutsCompletedLabel}
            icon={<SimpleIcon name="activity" size={16} color={Colors.warning} />}
          />
          <StatCard
            label="Weight"
            value={weightLabel}
            icon={<SimpleIcon name="target" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Total Time"
            value={totalTimeLabel}
            icon={<SimpleIcon name="clock" size={16} color={Colors.textSecondary} />}
          />
        </View>

        <SectionHeader title="Highlights" subtitle="This week in your training" style={styles.sectionTop} />
        <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightPill}>
              <SimpleIcon name="award" size={14} color={Colors.warning} />
              <Text style={styles.highlightText}>{streakLabel}</Text>
            </View>
            <View style={styles.highlightPill}>
              <SimpleIcon name="clock" size={14} color={Colors.textSecondary} />
              <Text style={styles.highlightText}>{totalTimeLabel} total</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Settings" subtitle="Manage your profile and preferences" style={styles.sectionTop} />
        <View style={styles.settingsShell}>
          <View style={styles.settingsShellGlow} />
          <View style={styles.settingsPanel}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={handleStartEditing}>
              <View style={styles.settingRowIconWrap}>
                <SimpleIcon name="user" size={16} color={Colors.primary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Edit Profile</Text>
                <Text style={styles.listSubtitle}>Update your name and profile picture</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>Manage</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => setGoalModalVisible(true)}>
              <View style={styles.settingRowIconWrap}>
                <SimpleIcon name="target" size={16} color={Colors.primary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Goals</Text>
                <Text style={styles.listSubtitle}>{selectedGoalLabel}</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>Update</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={handleToggleNotifications}>
              <View style={[styles.settingRowIconWrap, styles.settingRowIconMuted]}>
                <SimpleIcon name="bell" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Notifications</Text>
                <Text style={styles.listSubtitle}>Control reminders and workout alerts</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.border, true: Colors.primaryA52 }}
                  thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.8}
              onPress={() => {
                toggleTheme().catch((error) => {
                  console.warn('[ProfileScreen] Failed to toggle theme', error);
                });
              }}
            >
              <View style={styles.settingRowIconWrap}>
                <SimpleIcon
                  name={themeMode === 'dark' ? 'moon' : 'sun'}
                  size={16}
                  color={themeMode === 'dark' ? Colors.primary : Colors.warning}
                />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Appearance</Text>
                <Text style={styles.listSubtitle}>{themeLabel}</Text>
              </View>
              <View style={styles.themeToggleWrap}>
                <View style={[styles.themeToggle, themeMode === 'dark' && styles.themeToggleActive]}>
                  <Text style={styles.themeToggleIcon}>{themeMode === 'dark' ? 'D' : 'L'}</Text>
                  <View style={[styles.themeToggleKnob, themeMode === 'dark' && styles.themeToggleKnobActive]} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
              <View style={[styles.settingRowIconWrap, styles.settingRowIconMuted]}>
                <SimpleIcon name="shield" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Privacy & Security</Text>
                <Text style={styles.listSubtitle}>Manage account safety and data privacy</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>Review</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => navigation.navigate('HelpCenter')}>
              <View style={[styles.settingRowIconWrap, styles.settingRowIconMuted]}>
                <SimpleIcon name="life-buoy" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Help Center</Text>
                <Text style={styles.listSubtitle}>Get support and learn how to use Flexora</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>Support</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={logout}>
          <SimpleIcon name="log-out" size={16} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Modal
          visible={goalModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGoalModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set Fitness Goal</Text>
              <Text style={styles.modalSubtitle}>This updates your profile plan instantly.</Text>
              {GOAL_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.goalOption,
                    selectedGoal === option.value && styles.goalOptionActive,
                  ]}
                  onPress={() => setSelectedGoal(option.value)}
                >
                  <Text style={[styles.goalOptionText, selectedGoal === option.value && styles.goalOptionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}

              <View style={styles.modalActions}>
                <Pressable style={styles.modalBtnGhost} onPress={() => setGoalModalVisible(false)}>
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={handleSaveGoal} disabled={savingGoal}>
                  <Text style={styles.modalBtnText}>{savingGoal ? 'Saving...' : 'Save Goal'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.bottomSpace} />
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
    paddingTop: Spacing.x2 + Spacing.md,
    paddingBottom: Spacing.x2,
  },
  contentCompact: {
    paddingHorizontal: Spacing.md,
  },
  headerCard: {
    marginTop: Spacing.md,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  headerAccentWash: {
    position: 'absolute',
    top: -50,
    left: -20,
    width: 260,
    height: 160,
    transform: [{ rotate: '-6deg' }],
    backgroundColor: isDark ? Colors.primaryA34 : Colors.primaryLightA22,
  },
  headerSheen: {
    position: 'absolute',
    top: -18,
    right: -72,
    width: 230,
    height: 64,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: isDark ? Colors.primaryA14 : Colors.whiteA72,
  },
  headerRibbon: {
    position: 'absolute',
    top: 56,
    left: -52,
    width: 220,
    height: 52,
    transform: [{ rotate: '-10deg' }],
    backgroundColor: isDark ? Colors.primaryA52 : Colors.primaryA35,
  },
  headerGridLineOne: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 88,
    height: 1,
    backgroundColor: isDark ? Colors.primaryA52 : Colors.primaryA42,
  },
  headerGridLineTwo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 122,
    height: 1,
    backgroundColor: isDark ? Colors.primaryA35 : Colors.primaryA14,
  },
  headerTextureBarOne: {
    position: 'absolute',
    top: 38,
    left: -44,
    width: 180,
    height: 46,
    borderRadius: Radius.pill,
    transform: [{ rotate: '-14deg' }],
    backgroundColor: Colors.primaryA12,
  },
  headerTextureBarTwo: {
    position: 'absolute',
    bottom: 22,
    right: -48,
    width: 190,
    height: 52,
    borderRadius: Radius.pill,
    transform: [{ rotate: '-16deg' }],
    backgroundColor: Colors.primaryA08,
  },
  headerOverlay: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: isDark ? Colors.blackA58 : 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: isDark ? Colors.primaryA34 : Colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: isDark ? Colors.primaryA42 : Colors.primaryA35,
    backgroundColor: isDark ? Colors.primaryA14 : Colors.primaryA12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  memberPillText: {
    color: isDark ? Colors.textPrimary : Colors.primaryDark,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: isDark ? Colors.primaryA42 : Colors.primaryA35,
    backgroundColor: isDark ? Colors.primaryA14 : Colors.primaryA12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primaryLight,
    borderWidth: 4,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.primaryDark,
    fontSize: 30,
    fontWeight: FontWeight.heavy,
  },
  name: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.display,
    fontWeight: FontWeight.heavy,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  email: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: 'center',
  },
  headerDivider: {
    marginTop: Spacing.md,
    width: '68%',
    height: 1,
    backgroundColor: isDark ? Colors.primaryA42 : Colors.primaryA35,
  },
  headerInfoRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: isDark ? Colors.primaryA42 : Colors.primaryA35,
    backgroundColor: isDark ? Colors.primaryA14 : Colors.primaryLightA22,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  headerInfoText: {
    color: isDark ? Colors.textPrimary : Colors.primaryDark,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  nameInput: {
    marginTop: Spacing.md,
    minWidth: '72%',
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
    borderWidth: 1,
    borderColor: isDark ? Colors.primaryA42 : Colors.primaryA35,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  editRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editBtnHalf: {
    flex: 1,
  },
  editSecondaryButton: {
    backgroundColor: isDark ? Colors.card : Colors.white,
    borderColor: isDark ? Colors.border : Colors.white,
  },
  editPrimaryButton: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  statRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statRowCompact: {
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTop: {
    marginTop: Spacing.xl,
  },
  settingsShell: {
    position: 'relative',
    marginTop: Spacing.xs,
  },
  settingsShellGlow: {
    position: 'absolute',
    top: -10,
    right: 12,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryA08,
  },
  settingsPanel: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  settingRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRowIconMuted: {
    backgroundColor: Colors.card,
  },
  settingRowTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingTrailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  settingTrailingText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
    marginRight: Spacing.md,
  },
  listLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  listSubtitle: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
  },
  themeToggle: {
    width: 62,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  themeToggleWrap: {
    marginLeft: Spacing.sm,
  },
  themeToggleActive: {
    backgroundColor: Colors.primary,
  },
  themeToggleIcon: {
    position: 'absolute',
    left: 10,
    fontSize: 12,
  },
  themeToggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  themeToggleKnobActive: {
    marginLeft: 'auto',
  },
  highlightCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  highlightPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  highlightText: {
    color: Colors.textPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  signOutButton: {
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.errorA35,
    backgroundColor: Colors.errorA12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  signOutText: {
    color: Colors.error,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  bottomSpace: {
    height: 88,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.blackA58,
  },
  modalCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  modalSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    marginBottom: Spacing.md,
  },
  goalOption: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  goalOptionActive: {
    borderColor: Colors.primaryA35,
    backgroundColor: Colors.primaryLightA16,
  },
  goalOptionText: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  goalOptionTextActive: {
    color: Colors.primary,
  },
  modalActions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalBtnGhost: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  modalBtnGhostText: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  modalBtn: {
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  modalBtnText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  });
};



