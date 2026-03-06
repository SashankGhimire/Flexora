import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SimpleIcon } from '../ui';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type OptionCardProps = {
  label: string;
  iconName?: string;
  selected?: boolean;
  onPress: () => void;
};

export const OptionCard: React.FC<OptionCardProps> = ({ label, iconName, selected, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, selected && styles.selectedCard]}
    >
      <View style={styles.leftRow}>
        {iconName ? (
          <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
            <SimpleIcon
              name={iconName}
              size={18}
              color={selected ? '#0A1A14' : Colors.secondary}
            />
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.label, selected && styles.selectedLabel]}
        >
          {label}
        </Text>
      </View>
      <View style={[styles.dot, selected && styles.selectedDot]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    minHeight: 62,
  },
  selectedCard: {
    borderColor: 'rgba(52, 211, 153, 0.42)',
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#12161B',
    marginRight: Spacing.sm,
  },
  iconBadgeSelected: {
    borderColor: 'rgba(52, 211, 153, 0.5)',
    backgroundColor: Colors.primary,
  },
  label: {
    flexShrink: 1,
    color: Colors.textPrimary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semi,
    lineHeight: 18,
  },
  selectedLabel: {
    color: '#B7F7DA',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDot: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});
