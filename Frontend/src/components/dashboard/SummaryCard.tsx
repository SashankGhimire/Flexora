import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SimpleIcon } from '../ui';
import { COLORS } from '../../constants/theme';

interface SummaryItem {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

interface SummaryCardProps {
  items: SummaryItem[];
  style?: ViewStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ items, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Today's Summary</Text>

      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color || COLORS.primary}20` },
              ]}
            >
              <SimpleIcon
                name={item.icon}
                size={20}
                color={item.color || COLORS.primary}
              />
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },
});
