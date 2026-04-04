import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getApiServerOrigin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getLocalOnboardingProfile, getOnboardingProfile } from '../services/onboardingService';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Button, Card, PrimaryButton, SectionHeader, SimpleIcon, StatCard } from '../components/ui';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
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

  const avatarUrl = useMemo(() => {
    if (!user?.avatarUrl) return '';
    return `${getApiServerOrigin()}${user.avatarUrl}`;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerGlowLarge} />
          <View style={styles.headerGlowSmall} />
          <View style={styles.headerTopRow}>
            <View style={styles.memberPill}>
              <SimpleIcon name="award" size={12} color={Colors.textOnPrimary} />
              <Text style={styles.memberPillText}>Active member</Text>
            </View>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.headerEditButton}
                activeOpacity={0.8}
                onPress={handleStartEditing}
              >
                <SimpleIcon name="edit" size={14} color={Colors.textOnPrimary} />
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
                placeholderTextColor="rgba(255,255,255,0.72)"
              />
            ) : (
              <Text style={styles.name}>{user?.name || 'User'}</Text>
            )}
            <Text style={styles.email}>{user?.email || 'email@domain.com'}</Text>
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

        <View style={[styles.statRow, compact && styles.statRowCompact]}>
          <StatCard
            label="Workouts Completed"
            value="24"
            icon={<SimpleIcon name="activity" size={16} color={Colors.warning} />}
          />
          <StatCard
            label="Weight"
            value={weightLabel}
            icon={<SimpleIcon name="target" size={16} color={Colors.primary} />}
          />
          <StatCard
            label="Total Time"
            value="2h 45m"
            icon={<SimpleIcon name="clock" size={16} color={Colors.textSecondary} />}
          />
        </View>

        <SectionHeader title="Highlights" subtitle="This week in your training" style={styles.sectionTop} />
        <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightPill}>
              <SimpleIcon name="flame" size={14} color={Colors.warning} />
              <Text style={styles.highlightText}>12-day streak</Text>
            </View>
            <View style={styles.highlightPill}>
              <SimpleIcon name="clock" size={14} color={Colors.textSecondary} />
              <Text style={styles.highlightText}>2h 45m total</Text>
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

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
              <View style={styles.settingRowIconWrap}>
                <SimpleIcon name="target" size={16} color={Colors.primary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Goals</Text>
                <Text style={styles.listSubtitle}>Review and update your fitness targets</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>View</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
              <View style={[styles.settingRowIconWrap, styles.settingRowIconMuted]}>
                <SimpleIcon name="bell" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingRowTextWrap}>
                <Text style={styles.listLabel}>Notifications</Text>
                <Text style={styles.listSubtitle}>Control reminders and workout alerts</Text>
              </View>
              <View style={styles.settingTrailingWrap}>
                <Text style={styles.settingTrailingText}>Alerts</Text>
                <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={toggleTheme}>
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

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
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

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: Spacing.x2,
  },
  contentCompact: {
    paddingHorizontal: Spacing.md,
  },
  headerCard: {
    marginTop: Spacing.sm,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  headerGlowLarge: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: Colors.primaryLightA22,
  },
  headerGlowSmall: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: Colors.primaryLightA16,
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
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  memberPillText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  headerEditButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.primaryLight,
    borderWidth: 4,
    borderColor: Colors.white,
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
    color: Colors.textOnPrimary,
    fontSize: 26,
    fontWeight: FontWeight.heavy,
    textAlign: 'center',
  },
  email: {
    marginTop: Spacing.xs,
    color: 'rgba(255,255,255,0.82)',
    fontSize: Typography.body,
    textAlign: 'center',
  },
  nameInput: {
    marginTop: Spacing.md,
    minWidth: '72%',
    color: Colors.textOnPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
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
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  editPrimaryButton: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  statRow: {
    marginTop: Spacing.md,
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
});



