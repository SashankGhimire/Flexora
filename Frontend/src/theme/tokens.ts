import { Colors } from './colors';

export const Spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  x2: 24,
  x3: 30,
} as const;

export const Radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Typography = {
  display: 30,
  displayLine: 34,
  heading: 24,
  title: 20,
  subtitle: 14,
  body: 13,
  caption: 12,
} as const;

export const FontWeight = {
  medium: '500',
  semi: '600',
  bold: '700',
  heavy: '800',
} as const;

export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export const Buttons = {
  primary: {
    textColor: Colors.textOnPrimary,
  },
  secondary: {
    borderWidth: 1,
  },
} as const;


