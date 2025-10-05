import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { clsx } from 'clsx'
import styles from './BottomSheet.module.css'

export interface BottomSheetProps {
  /** Is the bottom sheet open */
  open: boolean
  /** Callback when bottom sheet should close */
  onClose: () => void
  /** Bottom sheet content */
  children: ReactNode
  /** Enable swipe to dismiss */
  dismissible?: boolean
  /** Snap points (vh percentages) */
  snapPoints?: number[]
  /** Initial snap point index */
  initialSnap?: number
  /** Show drag handle */
  showHandle?: boolean
  /** Custom className */
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  dismissible = true,
  snapPoints = [90],
  initialSnap = 0,
  showHandle = true,
  className,
}: BottomSheetProps) {
  const currentSnap = snapPoints[initialSnap] || 90

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down > 100px, close
    if (dismissible && info.offset.y > 100) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            className={clsx(styles.sheet, className)}
            initial={{ y: '100%' }}
            animate={{ y: `${100 - currentSnap}%` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={dismissible ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className={styles.handleContainer}>
                <div className={styles.handle} />
              </div>
            )}

            {/* Content */}
            <div className={styles.content}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
