import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontWeight } from '../../theme/tokens';

type CountdownOverlayProps = {
  count: number;
};

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  return (
    <View style={styles.overlay}>
      <Text style={styles.number}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  number: {
    color: Colors.textPrimary,
    fontSize: 96,
    fontWeight: FontWeight.heavy,
  },
});
