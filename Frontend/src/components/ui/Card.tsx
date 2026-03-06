import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/tokens';

type CardProps = ViewProps & {
  style?: ViewStyle | ViewStyle[];
};

export const Card: React.FC<CardProps> = ({ style, children, ...rest }) => {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
