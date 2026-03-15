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
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';
import { Card, PrimaryButton, SectionHeader, SimpleIcon, StatCard } from '../components/ui';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarAsset, setAvatarAsset] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // For button label
  const themeLabel = themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  useEffect(() => {
    if (!isEditing) {
      setName(user?.name || '');
    }
  }, [user?.name, isEditing]);

  const avatarUrl = useMemo(() => {
    if (!user?.avatarUrl) return '';
    return `${API_BASE_URL.replace('/api', '')}${user.avatarUrl}`;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Profile" subtitle="Your fitness overview" />

        <Card style={styles.profileCard}>
          <View style={styles.profileBadge}>
            <SimpleIcon name="award" size={12} color={Colors.primary} />
            <Text style={styles.profileBadgeText}>Active member</Text>
          </View>

          <View style={styles.profileTopRow}>
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

            <View style={styles.profileInfo}>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textSecondary}
                />
              ) : (
                <Text style={styles.name}>{user?.name || 'User'}</Text>
              )}
              <Text style={styles.email}>{user?.email || 'email@domain.com'}</Text>
            </View>

            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={() => setIsEditing(true)}
              >
                <SimpleIcon name="edit" size={14} color={Colors.error} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <PrimaryButton title="Change Photo" onPress={handlePickAvatar} style={styles.editBtnHalf} />
              <PrimaryButton
                title={saving ? 'Saving...' : 'Save'}
                onPress={handleSave}
                disabled={saving}
                style={styles.editBtnHalf}
              />
            </View>
          ) : null}
        </Card>

        <View style={[styles.statRow, compact && styles.statRowCompact]}>
          <StatCard
            label="Workouts"
            value="24"
            icon={<SimpleIcon name="activity" size={16} color={Colors.warning} />}
          />
          <StatCard
            label="Total Reps"
            value="1240"
            icon={<SimpleIcon name="target" size={16} color={Colors.textSecondary} />}
          />
          <StatCard
            label="Accuracy"
            value="92%"
            icon={<SimpleIcon name="award" size={16} color={Colors.warning} />}
          />
        </View>

        <SectionHeader title="Highlights" subtitle="This week in your training" style={styles.sectionTop} />
        <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightPill}>
              <SimpleIcon name="fire" size={14} color={Colors.warning} />
              <Text style={styles.highlightText}>12-day streak</Text>
            </View>
            <View style={styles.highlightPill}>
              <SimpleIcon name="clock" size={14} color={Colors.textSecondary} />
              <Text style={styles.highlightText}>2h 45m total</Text>
            </View>
          </View>
        </Card>

        {/* Prominent theme toggle button */}
        <PrimaryButton
          title={themeLabel}
          onPress={toggleTheme}
          style={{ marginTop: 24, marginBottom: 8 }}
        />

        <SectionHeader title="Account" style={styles.sectionTop} />
        <Card style={styles.listCard}>
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8} onPress={() => setIsEditing(true)}>
            <Text style={styles.listLabel}>Edit Profile</Text>
            <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <Text style={styles.listLabel}>Goals</Text>
            <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <Text style={styles.listLabel}>Notifications</Text>
            <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8} onPress={toggleTheme}>
            <Text style={styles.listLabel}>Theme</Text>
            <View style={styles.themeValueWrap}>
              <Text style={styles.themeValue}>{themeMode === 'dark' ? 'Dark' : 'Light'}</Text>
              <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Support" style={styles.sectionTop} />
        <Card style={styles.listCard}>
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <Text style={styles.listLabel}>Privacy & Security</Text>
            <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <Text style={styles.listLabel}>Help Center</Text>
            <SimpleIcon name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

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
  bgOrbTop: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: Colors.primaryA1,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: Colors.primaryA08,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.x3 + Spacing.sm,
    paddingBottom: Spacing.x2,
  },
  contentCompact: {
    paddingHorizontal: Spacing.md,
  },
  profileCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
  },
  profileBadge: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryA32,
    backgroundColor: Colors.primaryLightA14,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileBadgeText: {
    color: Colors.primaryDark,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: Typography.title,
    fontWeight: FontWeight.heavy,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  email: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  nameInput: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  editButton: {
    minHeight: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.errorA4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorA14,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  editButtonText: {
    color: Colors.error,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  editRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editBtnHalf: {
    flex: 1,
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
  listCard: {
    marginTop: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: Colors.card,
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
  },
  themeValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  themeValue: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  highlightCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
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



