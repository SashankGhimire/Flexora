import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Spacing, Typography } from '../../theme/tokens';
import { SimpleIcon } from './SimpleIcon';

interface PageHeaderProps {
  title?: string;
  onProfilePress?: () => void;
  onBellPress?: () => void;
  showStartIcon?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onProfilePress,
  onBellPress,
  showStartIcon = false,
}) => {
  return (
    <View style={styles.header}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.iconRow, !title && styles.iconRowFull]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBellPress}
          activeOpacity={0.7}
        >
          <SimpleIcon name="bell" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.profileButton]}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <SimpleIcon name="user" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconRowFull: {
    marginLeft: 'auto',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryA08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    backgroundColor: Colors.primaryA1,
  },
});

export default PageHeader;
