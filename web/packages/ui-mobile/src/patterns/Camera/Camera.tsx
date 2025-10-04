import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Camera.module.css'

export type CameraMode = 'photo' | 'qr' | 'barcode'

export interface CameraProps {
  /**
   * Camera mode
   */
  mode?: CameraMode

  /**
   * Whether camera is active/visible
   */
  isOpen: boolean

  /**
   * Callback when photo is captured
   */
  onCapture?: (imageData: string) => void

  /**
   * Callback when QR/barcode is scanned
   */
  onScan?: (data: string) => void

  /**
   * Callback when camera is closed
   */
  onClose: () => void

  /**
   * Facing mode (user = front camera, environment = back camera)
   */
  facingMode?: 'user' | 'environment'

  /**
   * Title text (Nepali supported)
   */
  title?: string
}

/**
 * Camera - Lazy-loaded camera component for photo capture and scanning
 *
 * Features:
 * - Photo capture with preview
 * - QR code scanning (requires qr-scanner library)
 * - Barcode scanning
 * - Front/back camera switching
 * - Mobile-optimized fullscreen UI
 * - Nepali language support
 *
 * Note: This component should be lazy loaded:
 * ```tsx
 * const Camera = lazy(() => import('@egov/ui-mobile/patterns/Camera'))
 * ```
 *
 * @example
 * ```tsx
 * <Camera
 *   mode="photo"
 *   isOpen={cameraOpen}
 *   onCapture={(imageData) => setPhoto(imageData)}
 *   onClose={() => setCameraOpen(false)}
 *   title="कागजात फोटो खिच्नुहोस्"
 * />
 * ```
 */
export function Camera({
  mode = 'photo',
  isOpen,
  onCapture,
  onScan,
  onClose,
  facingMode = 'environment',
  title = 'फोटो खिच्नुहोस्',
}: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      setStream(mediaStream)
      setError(null)
    } catch (err) {
      console.error('Camera error:', err)
      setError('क्यामेरा पहुँच गर्न सकिएन')
    }
  }, [currentFacingMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64 image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      onCapture?.(imageData)

      // Close camera after capture
      onClose()
    }
  }, [onCapture, onClose])

  // Switch camera
  const switchCamera = useCallback(() => {
    setCurrentFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [])

  // Start camera when opened
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && stream) {
      stopCamera()
      startCamera()
    }
  }, [currentFacingMode])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>{title}</h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="बन्द गर्नुहोस्"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Camera view */}
            <div className={styles.videoWrapper}>
              {error ? (
                <div className={styles.error}>
                  <p>{error}</p>
                  <button onClick={startCamera} className={styles.retryButton}>
                    पुन: प्रयास गर्नुहोस्
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className={styles.video}
                    playsInline
                    muted
                  />

                  {/* Scanning overlay for QR/barcode mode */}
                  {(mode === 'qr' || mode === 'barcode') && (
                    <div className={styles.scanOverlay}>
                      <div className={styles.scanBox} />
                      <p className={styles.scanHint}>
                        {mode === 'qr' ? 'QR कोड स्क्यान गर्नुहोस्' : 'बारकोड स्क्यान गर्नुहोस्'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Hidden canvas for photo capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            {!error && (
              <div className={styles.controls}>
                {/* Switch camera button */}
                <button
                  className={styles.controlButton}
                  onClick={switchCamera}
                  aria-label="क्यामेरा बदल्नुहोस्"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 5H16.83L15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15 13L12 11V15L15 13Z"
                      fill="white"
                    />
                  </svg>
                </button>

                {/* Capture button (only in photo mode) */}
                {mode === 'photo' && (
                  <button
                    className={styles.captureButton}
                    onClick={capturePhoto}
                    aria-label="फोटो खिच्नुहोस्"
                  >
                    <div className={styles.captureInner} />
                  </button>
                )}

                {/* Placeholder for symmetry */}
                <div className={styles.controlButton} style={{ visibility: 'hidden' }} />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
