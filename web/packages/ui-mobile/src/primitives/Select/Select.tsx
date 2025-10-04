import { forwardRef, SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Select variant - affects styling
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
   * Options to display
   */
  options: SelectOption[]

  /**
   * Error message to display
   */
  error?: string

  /**
   * Helper text (shown below select)
   */
  helperText?: string

  /**
   * Whether the field is required
   */
  required?: boolean

  /**
   * Whether select takes full width
   * @default true
   */
  fullWidth?: boolean

  /**
   * Placeholder text when no value selected
   */
  placeholder?: string
}

/**
 * Select - Mobile-first dropdown component
 *
 * Features:
 * - Touch-optimized (44px minimum height)
 * - Nepali language support
 * - Validation states (error, success)
 * - Multiple variants (default, outlined, filled)
 * - Accessible labels and error messages
 * - Native select for better mobile UX
 *
 * @example
 * ```tsx
 * <Select
 *   label="स्तर"
 *   placeholder="छान्नुहोस्"
 *   options={[
 *     { value: 'MUNICIPALITY', label: 'नगरपालिका' },
 *     { value: 'WARD', label: 'वडा' }
 *   ]}
 *   required
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'outlined',
      size = 'medium',
      label,
      options,
      error,
      helperText,
      required,
      fullWidth = true,
      placeholder,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className={clsx(
        styles.wrapper,
        fullWidth && styles.fullWidth,
        className
      )}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              styles.select,
              styles[variant],
              styles[size],
              hasError && styles.error,
              props.disabled && styles.disabled
            )}
            aria-invalid={hasError}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom chevron icon */}
          <div className={styles.chevron} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {error && (
          <span id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={`${selectId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
