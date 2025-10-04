/**
 * Motion tokens - Animation durations and easings
 * Optimized for 60fps on mobile devices
 */

export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
} as const

export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Spring-like (for mobile feel)
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Smooth
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const

// Framer Motion variants
export const motionVariants = {
  // Fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide from bottom (bottom sheet)
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },

  // Slide from right (navigation)
  slideLeft: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },

  // Scale (modal)
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },

  // TikTok-style vertical card
  verticalCard: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
} as const

// Spring presets for Framer Motion
export const springs = {
  // Gentle spring (default)
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },

  // Snappy spring (buttons, toggles)
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },

  // Bouncy spring (notifications, toasts)
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  },
} as const

export type DurationToken = typeof duration
export type EasingToken = typeof easing
export type MotionVariantToken = typeof motionVariants
export type SpringToken = typeof springs
