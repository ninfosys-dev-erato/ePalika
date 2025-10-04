import { forwardRef, InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './Input.module.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input variant - affects styling
   */
  variant?: 'default' | 'outlined' | 'filled'

  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Label text (Nepali supported)
   */
  label?: string

  /**
   * Error message to display
   */
  error?: string

  /**
   * Helper text (shown below input)
   */
  helperText?: string

  /**
   * Whether the field is required
   */
  required?: boolean

  /**
   * Whether input takes full width
   * @default true
   */
  fullWidth?: boolean
}

/**
 * Input - Mobile-first text input component
 *
 * Features:
 * - Touch-optimized (44px minimum height)
 * - Nepali language support
 * - Validation states (error, success)
 * - Multiple variants (default, outlined, filled)
 * - Accessible labels and error messages
 *
 * @example
 * ```tsx
 * <Input
 *   label="विषय"
 *   placeholder="उदा. नागरिकता सिफारिस"
 *   required
 *   error={errors.subject}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'outlined',
      size = 'medium',
      label,
      error,
      helperText,
      required,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className={clsx(
        styles.wrapper,
        fullWidth && styles.fullWidth,
        className
      )}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            styles.input,
            styles[variant],
            styles[size],
            hasError && styles.error,
            props.disabled && styles.disabled
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
