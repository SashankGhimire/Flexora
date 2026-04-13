import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontWeight, Spacing, Typography } from '../../theme/tokens';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  rightNode?: React.ReactNode;
  style?: ViewStyle;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightNode,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightNode ? <View>{rightNode}</View> : null}
    </View>
  );
};

const createStyles = (colors: { textPrimary: string; textSecondary: string }) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      gap: 8,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.title,
      fontWeight: FontWeight.bold,
    },
    subtitle: {
      marginTop: Spacing.xs,
      color: colors.textSecondary,
      fontSize: Typography.caption,
      lineHeight: 16,
    },
  });


