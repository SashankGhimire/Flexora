import React from 'react';
import { ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import { Colors } from '../../theme/colors';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Map icon names to Feather icons
const ICON_MAP: Record<string, string> = {
  // Navigation icons
  home: 'home',
  activity: 'activity',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  user: 'user',
  
  // Action icons
  logout: 'log-out',
  'log-out': 'log-out',
  settings: 'settings',
  edit: 'edit',
  'edit-2': 'edit-2',
  check: 'check',
  'at-sign': 'at-sign',
  shield: 'shield',
  mail: 'mail',
  eye: 'eye',
  'eye-off': 'eye-off',
  bell: 'bell',
  target: 'target',
  'help-circle': 'help-circle',
  'life-buoy': 'life-buoy',
  fire: 'fire',
  flame: 'fire',
  lock: 'lock',
  cpu: 'cpu',
  sun: 'sun',
  moon: 'moon',
  music: 'music',
  'refresh-cw': 'refresh-cw',
  'refresh-ccw': 'refresh-ccw',
  
  // Data icons
  clock: 'clock',
  zap: 'zap',
  circle: 'circle',
  'check-circle': 'check-circle',
  'alert-circle': 'alert-circle',
  trending: 'trending-up',
  award: 'award',
  lightbulb: 'sun',
  users: 'users',
  'arrow-down': 'chevron-down',
  'arrow-left': 'arrow-left',
  'more-horizontal': 'more-horizontal',
  
  // General icons
  menu: 'menu',
  search: 'search',
  image: 'image',
  plus: 'plus',
  minus: 'minus',
  x: 'x',
  'x-circle': 'x-circle',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  list: 'list',
  'bar-chart-2': 'bar-chart-2',
  'bar-chart': 'bar-chart-2',
  dumbbell: 'tool',
  person: 'user',
  female: 'user',
  calendar: 'calendar',
  star: 'star',
  heart: 'heart',
  runner: 'activity',
  bot: 'cpu',
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({
  name,
  size = 24,
  color = Colors.textPrimary,
  style,
}) => {
  const iconName = ICON_MAP[name] || 'help-circle';
  
  return (
    <Icon
      name={iconName as any}
      size={size}
      color={color}
      style={style}
    />
  );
};


