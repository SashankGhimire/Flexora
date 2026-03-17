import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export const THEME_MODE_STORAGE_KEY = '@flexora:theme_mode';

const LightColors = {
  primary: '#4CAF7D',
  primaryLight: '#7ED1A8',
  primaryDark: '#2F8F6B',
  secondary: '#7ED1A8',
  accent: '#22D3EE',

  background: '#F3FBF7',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  input: '#FFFFFF',
  border: '#E6F4EA',
  divider: '#E6F4EA',

  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#22D3EE',

  primaryA08: 'rgba(76, 175, 125, 0.08)',
  primaryA1: 'rgba(76, 175, 125, 0.1)',
  primaryA12: 'rgba(76, 175, 125, 0.12)',
  primaryA14: 'rgba(76, 175, 125, 0.14)',
  primaryA3: 'rgba(76, 175, 125, 0.3)',
  primaryA32: 'rgba(76, 175, 125, 0.32)',
  primaryA34: 'rgba(76, 175, 125, 0.34)',
  primaryA35: 'rgba(76, 175, 125, 0.35)',
  primaryA42: 'rgba(76, 175, 125, 0.42)',
  primaryA5: 'rgba(76, 175, 125, 0.5)',
  primaryA52: 'rgba(76, 175, 125, 0.52)',

  primaryLightA12: 'rgba(126, 209, 168, 0.12)',
  primaryLightA14: 'rgba(126, 209, 168, 0.14)',
  primaryLightA15: 'rgba(126, 209, 168, 0.15)',
  primaryLightA16: 'rgba(126, 209, 168, 0.16)',
  primaryLightA18: 'rgba(126, 209, 168, 0.18)',
  primaryLightA2: 'rgba(126, 209, 168, 0.2)',
  primaryLightA22: 'rgba(126, 209, 168, 0.22)',

  errorA12: 'rgba(239, 68, 68, 0.12)',
  errorA14: 'rgba(239, 68, 68, 0.14)',
  errorA35: 'rgba(239, 68, 68, 0.35)',
  errorA38: 'rgba(239, 68, 68, 0.38)',
  errorA4: 'rgba(239, 68, 68, 0.4)',

  warningA14: 'rgba(245, 158, 11, 0.14)',
  warningA15: 'rgba(245, 158, 11, 0.15)',
  warningA4: 'rgba(245, 158, 11, 0.4)',
  warningA45: 'rgba(245, 158, 11, 0.45)',

  successA08: 'rgba(34, 197, 94, 0.08)',
  successA12: 'rgba(34, 197, 94, 0.12)',
  successA18: 'rgba(34, 197, 94, 0.18)',
  successA26: 'rgba(34, 197, 94, 0.26)',
  successA3: 'rgba(34, 197, 94, 0.3)',
  successA65: 'rgba(34, 197, 94, 0.65)',
  successA75: 'rgba(34, 197, 94, 0.75)',
  successA85: 'rgba(34, 197, 94, 0.85)',

  blackA3: 'rgba(17, 24, 39, 0.3)',
  blackA45: 'rgba(17, 24, 39, 0.45)',
  blackA46: 'rgba(17, 24, 39, 0.46)',
  blackA5: 'rgba(17, 24, 39, 0.5)',
  blackA55: 'rgba(17, 24, 39, 0.55)',
  blackA56: 'rgba(17, 24, 39, 0.56)',
  blackA58: 'rgba(17, 24, 39, 0.58)',
  blackA62: 'rgba(17, 24, 39, 0.62)',
  blackA72: 'rgba(17, 24, 39, 0.72)',

  textSecondaryA2: 'rgba(107, 114, 128, 0.2)',
  textMutedA55: 'rgba(156, 163, 175, 0.55)',

  backgroundA82: 'rgba(243, 251, 247, 0.82)',

  white: '#FFFFFF',
  black: '#1A1A1A',
} as const;

const DarkColors = {
  ...LightColors,
  primary: '#4CAF7D',
  primaryLight: '#7ED1A8',
  primaryDark: '#2F8F6B',
  secondary: '#7ED1A8',

  background: '#0F1111',
  card: '#171A1A',
  surface: '#171A1A',
  input: '#1E2222',
  border: '#2A3030',
  divider: '#232828',

  textPrimary: '#E5E7EB',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  backgroundA82: 'rgba(15, 17, 17, 0.82)',
  black: '#050707',
} as const;

const resolveInitialThemeMode = (): ThemeMode =>
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

let currentThemeMode: ThemeMode = resolveInitialThemeMode();

export let isDarkMode = currentThemeMode === 'dark';
export let Colors = isDarkMode ? DarkColors : LightColors;

export const setThemeMode = (mode: ThemeMode): void => {
  currentThemeMode = mode;
  isDarkMode = mode === 'dark';
  Colors = isDarkMode ? DarkColors : LightColors;
};

export const getThemeMode = (): ThemeMode => currentThemeMode;


