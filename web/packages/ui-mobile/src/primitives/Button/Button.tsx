import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import styles from './Button.module.css'

type ExcludedProps = 'color' | 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd' | 'onDragTransitionEnd'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ExcludedProps> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  /** Button size */
  size?: 'small' | 'medium' | 'large'
  /** Full width */
  fullWidth?: boolean
  /** Loading state */
  loading?: boolean
  /** Icon only (circular) */
  iconOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      iconOnly = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={clsx(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          iconOnly && styles.iconOnly,
          loading && styles.loading,
          className
        )}
        disabled={disabled || loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...(props as any)}
      >
        {loading && <span className={styles.spinner}>...</span>}
        <span className={clsx(styles.content, loading && styles.contentHidden)}>
          {children}
        </span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
