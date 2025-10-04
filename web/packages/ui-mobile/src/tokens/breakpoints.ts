/**
 * Breakpoint tokens - Mobile-first responsive design
 * Base: 360px (Android small), scale up
 */

export const breakpoints = {
  xs: '360px',  // Small Android
  sm: '390px',  // iPhone 13/14
  md: '412px',  // Large Android
  lg: '768px',  // Tablet portrait
  xl: '1024px', // Tablet landscape
  '2xl': '1280px', // Desktop
} as const

// Media queries (mobile-first)
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const

// Container max widths
export const containers = {
  xs: breakpoints.xs,
  sm: breakpoints.sm,
  md: breakpoints.md,
  lg: '720px',
  xl: '960px',
  '2xl': '1200px',
} as const

export type BreakpointToken = typeof breakpoints
export type MediaQueryToken = typeof mediaQueries
