import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing } from '../../theme/tokens';
import { SimpleIcon } from '../ui';

type PickerInputProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

export const PickerInput: React.FC<PickerInputProps> = ({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}) => {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.iconButton} onPress={decrease} activeOpacity={0.8}>
        <SimpleIcon name="minus" size={16} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.valueWrap}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={styles.valueText}
        >
          {`${value}${suffix ? ` ${suffix}` : ''}`}
        </Text>
      </View>
      <TouchableOpacity style={styles.iconButton} onPress={increase} activeOpacity={0.8}>
        <SimpleIcon name="plus" size={16} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12161B',
  },
  valueWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  valueText: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: FontWeight.heavy,
  },
});
