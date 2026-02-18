import React from 'react';
import { ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/feather';

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
  user: 'user',
  
  // Action icons
  logout: 'log-out',
  'log-out': 'log-out',
  settings: 'settings',
  edit: 'edit',
  check: 'check',
  'at-sign': 'at-sign',
  shield: 'shield',
  eye: 'eye',
  'eye-off': 'eye-off',
  bell: 'bell',
  target: 'target',
  'help-circle': 'help-circle',
  fire: 'fire',
  lock: 'lock',
  cpu: 'cpu',
  
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
  
  // General icons
  menu: 'menu',
  search: 'search',
  image: 'image',
  plus: 'plus',
  minus: 'minus',
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({
  name,
  size = 24,
  color = '#000',
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
