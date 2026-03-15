import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type MuscleFocusMapProps = {
  focus: string[];
};

const hasAny = (focus: string[], targets: string[]): boolean =>
  targets.some((target) => focus.map((f) => f.toLowerCase()).includes(target));

export const MuscleFocusMap: React.FC<MuscleFocusMapProps> = ({ focus }) => {
  const frontAbs = hasAny(focus, ['abs', 'core', 'obliques']);
  const frontChest = hasAny(focus, ['chest']);
  const frontArms = hasAny(focus, ['arms', 'triceps', 'shoulders']);
  const frontLegs = hasAny(focus, ['legs', 'cardio', 'glutes']);

  const backCore = hasAny(focus, ['core', 'obliques']);
  const backShoulder = hasAny(focus, ['shoulders', 'arms', 'triceps']);
  const backLegs = hasAny(focus, ['legs', 'glutes']);

  const active = Colors.primary;
  const muted = Colors.border;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Focus Area</Text>
      <View style={styles.row}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Front</Text>
          <Svg width={128} height={220}>
            <Circle cx={64} cy={20} r={14} fill={muted} />
            <Rect x={47} y={36} width={34} height={56} rx={12} fill={muted} />
            <Rect x={26} y={38} width={16} height={58} rx={8} fill={frontArms ? active : muted} />
            <Rect x={86} y={38} width={16} height={58} rx={8} fill={frontArms ? active : muted} />
            <Rect x={48} y={52} width={32} height={14} rx={6} fill={frontChest ? active : muted} />
            <Rect x={52} y={68} width={24} height={20} rx={5} fill={frontAbs ? active : muted} />
            <Rect x={48} y={96} width={14} height={76} rx={7} fill={frontLegs ? active : muted} />
            <Rect x={66} y={96} width={14} height={76} rx={7} fill={frontLegs ? active : muted} />
          </Svg>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Back</Text>
          <Svg width={128} height={220}>
            <Circle cx={64} cy={20} r={14} fill={muted} />
            <Rect x={47} y={36} width={34} height={56} rx={12} fill={muted} />
            <Rect x={26} y={38} width={16} height={58} rx={8} fill={backShoulder ? active : muted} />
            <Rect x={86} y={38} width={16} height={58} rx={8} fill={backShoulder ? active : muted} />
            <Rect x={52} y={62} width={24} height={18} rx={5} fill={backCore ? active : muted} />
            <Rect x={48} y={96} width={14} height={76} rx={7} fill={backLegs ? active : muted} />
            <Rect x={66} y={96} width={14} height={76} rx={7} fill={backLegs ? active : muted} />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  heading: {
    color: Colors.primary,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },
  row: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  panel: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
  },
  panelTitle: {
    marginBottom: 4,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
});



