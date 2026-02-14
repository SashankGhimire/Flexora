import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SimpleIcon } from '../../components/ui';
import { API_BASE_URL } from '../../constants/api';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarAsset, setAvatarAsset] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your fitness overview</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() => {
              if (!isEditing) {
                setIsEditing(true);
              }
            }}
            disabled={saving || isEditing}
          >
            <SimpleIcon
              name="edit"
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {avatarAsset?.uri || avatarUrl ? (
              <Image
                source={{ uri: avatarAsset?.uri || avatarUrl }}
                style={styles.avatarImage}
              />
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
                placeholderTextColor={COLORS.placeholder}
              />
            ) : (
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            )}
            <Text style={styles.profileEmail}>{user?.email || 'email@domain.com'}</Text>
            {isEditing ? (
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handlePickAvatar}
                activeOpacity={0.85}
              >
                <SimpleIcon name="image" size={16} color={COLORS.primary} />
                <Text style={styles.changePhotoText}>Change photo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setName(user?.name || '');
                setAvatarAsset(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <View style={styles.listCard}>
          <TouchableOpacity
            style={styles.listItem}
            activeOpacity={0.8}
            onPress={() => setIsEditing(true)}
          >
            <View style={styles.listLeft}>
              <View style={styles.listIcon}>
                <SimpleIcon name="user" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.listText}>Edit Profile</Text>
            </View>
            <SimpleIcon name="arrow-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.listDivider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <View style={styles.listLeft}>
              <View style={styles.listIcon}>
                <SimpleIcon name="target" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.listText}>Goals</Text>
            </View>
            <SimpleIcon name="arrow-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.listDivider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <View style={styles.listLeft}>
              <View style={styles.listIcon}>
                <SimpleIcon name="bell" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.listText}>Notifications</Text>
            </View>
            <SimpleIcon name="arrow-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Support</Text>
        </View>

        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <View style={styles.listLeft}>
              <View style={styles.listIcon}>
                <SimpleIcon name="shield" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.listText}>Privacy & Security</Text>
            </View>
            <SimpleIcon name="arrow-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.listDivider} />
          <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
            <View style={styles.listLeft}>
              <View style={styles.listIcon}>
                <SimpleIcon name="help-circle" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.listText}>Help Center</Text>
            </View>
            <SimpleIcon name="arrow-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={logout}
        >
          <SimpleIcon name="log-out" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  editButton: {
    width: 40,
    marginTop: 30,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileInfo: {
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  changePhotoText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  sectionTitleRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  listDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${COLORS.error}40`,
    backgroundColor: `${COLORS.error}15`,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
});
