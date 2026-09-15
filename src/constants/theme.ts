import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppThemePalette {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryGreen: string;
  primaryGreenDark: string;
  primaryGreenLight: string;
  primaryGreenBg: string;
  micCoral: string;
  micCoralActive: string;
  micRippleOuter: string;
  micRippleMiddle: string;
  bottomNavBg: string;
  bottomNavBorder: string;
  cardShadow: string;
}

export const lightTheme: AppThemePalette = {
  isDark: false,
  background: '#F7F9F6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#EEF2F0',
  borderSubtle: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  primaryGreen: '#2E7D32',
  primaryGreenDark: '#1B5E20',
  primaryGreenLight: '#4CAF50',
  primaryGreenBg: '#E8F5E9',
  micCoral: '#F87171',
  micCoralActive: '#EF4444',
  micRippleOuter: 'rgba(254, 205, 211, 0.45)',
  micRippleMiddle: 'rgba(254, 202, 202, 0.65)',
  bottomNavBg: '#FFFFFF',
  bottomNavBorder: '#EBECEE',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
};

export const darkTheme: AppThemePalette = {
  isDark: true,
  background: '#121413',
  surface: '#1E2320',
  surfaceElevated: '#262D28',
  border: '#2C352F',
  borderSubtle: '#37423B',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  primaryGreen: '#4ADE80',
  primaryGreenDark: '#22C55E',
  primaryGreenLight: '#86EFAC',
  primaryGreenBg: '#183822',
  micCoral: '#F87171',
  micCoralActive: '#EF4444',
  micRippleOuter: 'rgba(248, 113, 113, 0.2)',
  micRippleMiddle: 'rgba(248, 113, 113, 0.35)',
  bottomNavBg: '#181D1A',
  bottomNavBorder: '#27302A',
  cardShadow: 'rgba(0, 0, 0, 0.35)',
};

export const Colors = {
  light: {
    text: lightTheme.textPrimary,
    background: lightTheme.background,
    backgroundElement: lightTheme.surface,
    backgroundSelected: lightTheme.primaryGreenBg,
    textSecondary: lightTheme.textSecondary,
  },
  dark: {
    text: darkTheme.textPrimary,
    background: darkTheme.background,
    backgroundElement: darkTheme.surface,
    backgroundSelected: darkTheme.primaryGreenBg,
    textSecondary: darkTheme.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    rounded: 'system-ui, sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

