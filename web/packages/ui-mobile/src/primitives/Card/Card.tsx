import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import clsx from 'clsx'
import styles from './Card.module.css'

type ExcludedProps = 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd' | 'onDragTransitionEnd'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, ExcludedProps> {
  /**
   * Card variant - affects styling and elevation
   */
  variant?: 'default' | 'outlined' | 'elevated'

  /**
   * Padding size
   * @default 'medium'
   */
  padding?: 'none' | 'small' | 'medium' | 'large'

  /**
   * Whether card is interactive (clickable)
   */
  interactive?: boolean

  /**
   * Whether card takes full width
   * @default true
   */
  fullWidth?: boolean

  /**
   * Whether to enable motion animations
   * @default false
   */
  animated?: boolean

  /**
   * Header content
   */
  header?: ReactNode

  /**
   * Footer content
   */
  footer?: ReactNode

  /**
   * Main content
   */
  children: ReactNode
}

/**
 * Card - Reusable container component
 *
 * Features:
 * - Multiple variants (default, outlined, elevated)
 * - Touch-optimized (when interactive)
 * - Optional motion animations
 * - Header and footer slots
 * - Flexible padding options
 *
 * @example
 * ```tsx
 * <Card
 *   variant="elevated"
 *   interactive
 *   onClick={handleClick}
 *   header={<h3>दर्ता नं. २०८१-०००१</h3>}
 * >
 *   <p>विषय: नागरिकता सिफारिस</p>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'medium',
      interactive = false,
      fullWidth = true,
      animated = false,
      header,
      footer,
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const Component = animated ? motion.div : 'div'
    const motionProps: Partial<HTMLMotionProps<'div'>> = animated
      ? {
          whileHover: interactive ? { scale: 1.02 } : undefined,
          whileTap: interactive ? { scale: 0.98 } : undefined,
          transition: { duration: 0.2 },
        }
      : {}

    return (
      <Component
        ref={ref as any}
        className={clsx(
          styles.card,
          styles[variant],
          styles[`padding-${padding}`],
          interactive && styles.interactive,
          fullWidth && styles.fullWidth,
          className
        )}
        onClick={onClick}
        role={interactive && onClick ? 'button' : undefined}
        tabIndex={interactive && onClick ? 0 : undefined}
        {...(motionProps as any)}
        {...(props as any)}
      >
        {header && <div className={styles.header}>{header}</div>}

        <div className={styles.content}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </Component>
    )
  }
)

Card.displayName = 'Card'
