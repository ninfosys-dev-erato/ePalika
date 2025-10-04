export * from './colors'
export * from './spacing'
export * from './typography'
export * from './motion'
export * from './breakpoints'

// Re-export as tokens object
import { colors } from './colors'
import { spacing, touchTarget } from './spacing'
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textStyles } from './typography'
import { duration, easing, motionVariants, springs } from './motion'
import { breakpoints, mediaQueries, containers } from './breakpoints'

export const tokens = {
  colors,
  spacing,
  touchTarget,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  duration,
  easing,
  motionVariants,
  springs,
  breakpoints,
  mediaQueries,
  containers,
} as const

export type Tokens = typeof tokens
