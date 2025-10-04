/**
 * Color tokens for mobile-first Darta-Chalani system
 * Based on Nepal government branding and accessibility standards
 */

export const colors = {
  // Primary - Nepal Red
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#dc2626', // Main Nepal red
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#6b1717',
  },

  // Secondary - Nepal Blue
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#003893', // Nepal blue
    600: '#002a6b',
    700: '#001f4d',
    800: '#001738',
    900: '#001028',
  },

  // Neutrals
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#000000',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    700: '#15803d',
  },

  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#b45309',
  },

  error: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c',
  },

  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    700: '#1d4ed8',
  },

  // Surface colors
  surface: {
    background: '#ffffff',
    backgroundAlt: '#fafafa',
    card: '#ffffff',
    cardHover: '#f5f5f5',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#a3a3a3',
    inverse: '#ffffff',
    disabled: '#d4d4d4',
    link: '#003893',
    linkHover: '#001f4d',
  },

  // Border colors
  border: {
    default: '#e5e5e5',
    hover: '#d4d4d4',
    focus: '#003893',
    error: '#ef4444',
    disabled: '#f5f5f5',
  },
} as const

export type ColorToken = typeof colors
