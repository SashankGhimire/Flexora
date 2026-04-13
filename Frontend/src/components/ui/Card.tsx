import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Spacing } from '../../theme/tokens';

type CardProps = ViewProps & {
  style?: ViewStyle | ViewStyle[];
};

export const Card: React.FC<CardProps> = ({ style, children, ...rest }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const createStyles = (colors: { card: string; border: string }) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
    },
  });


