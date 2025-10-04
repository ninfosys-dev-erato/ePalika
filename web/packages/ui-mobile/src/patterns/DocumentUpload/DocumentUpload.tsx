import { useState, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import styles from './DocumentUpload.module.css'

// Lazy load Camera component
const Camera = lazy(() => import('../Camera').then((m) => ({ default: m.Camera })))

export interface UploadedDocument {
  id: string
  name: string
  dataUrl: string
  size: number
  type: string
  uploadedAt: string
}

export interface DocumentUploadProps {
  /**
   * Label text (Nepali supported)
   */
  label?: string

  /**
   * Helper text
   */
  helperText?: string

  /**
   * Error message
   */
  error?: string

  /**
   * Whether field is required
   */
  required?: boolean

  /**
   * Maximum file size in MB
   * @default 5
   */
  maxSizeMB?: number

  /**
   * Maximum number of files
   * @default 1
   */
  maxFiles?: number

  /**
   * Accepted file types
   */
  accept?: string

  /**
   * Current uploaded documents
   */
  documents?: UploadedDocument[]

  /**
   * Callback when documents change
   */
  onChange?: (documents: UploadedDocument[]) => void

  /**
   * Whether to show camera option
   * @default true
   */
  allowCamera?: boolean
}

/**
 * DocumentUpload - File upload with camera capture
 *
 * Features:
 * - Gallery file picker
 * - Camera photo capture (lazy loaded)
 * - Image preview with thumbnails
 * - File size validation
 * - Multiple file support
 * - Nepali language support
 *
 * @example
 * ```tsx
 * <DocumentUpload
 *   label="कागजात"
 *   required
 *   maxFiles={3}
 *   documents={documents}
 *   onChange={setDocuments}
 * />
 * ```
 */
export function DocumentUpload({
  label = 'कागजात',
  helperText,
  error,
  required,
  maxSizeMB = 5,
  maxFiles = 1,
  accept = 'image/*,.pdf',
  documents = [],
  onChange,
  allowCamera = true,
}: DocumentUploadProps) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasError = Boolean(error)
  const canAddMore = documents.length < maxFiles

  // Handle file selection from gallery
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newDocuments: UploadedDocument[] = []

    for (let i = 0; i < files.length && documents.length + newDocuments.length < maxFiles; i++) {
      const file = files[i]

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds ${maxSizeMB}MB limit`)
        continue
      }

      // Convert to base64
      const dataUrl = await fileToDataUrl(file)

      newDocuments.push({
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        dataUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      })
    }

    if (newDocuments.length > 0) {
      onChange?.([...documents, ...newDocuments])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle camera capture
  const handleCameraCapture = (imageData: string) => {
    const newDocument: UploadedDocument = {
      id: `photo-${Date.now()}`,
      name: `photo-${Date.now()}.jpg`,
      dataUrl: imageData,
      size: Math.round(imageData.length * 0.75), // Rough estimate
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    }

    onChange?.([...documents, newDocument])
    setCameraOpen(false)
  }

  // Remove document
  const handleRemove = (id: string) => {
    onChange?.(documents.filter((doc) => doc.id !== id))
  }

  // Open file picker
  const openFilePicker = () => {
    if (!canAddMore) return
    fileInputRef.current?.click()
  }

  // Open camera
  const openCamera = () => {
    if (!canAddMore) return
    setCameraOpen(true)
  }

  return (
    <div className={styles.wrapper}>
      {/* Label */}
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div className={clsx(styles.uploadArea, hasError && styles.uploadAreaError)}>
          <div className={styles.uploadButtons}>
            {/* Gallery button */}
            <button
              type="button"
              className={styles.uploadButton}
              onClick={openFilePicker}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                  fill="currentColor"
                />
              </svg>
              <span>ग्यालरीबाट छान्नुहोस्</span>
            </button>

            {/* Camera button */}
            {allowCamera && (
              <button
                type="button"
                className={styles.uploadButton}
                onClick={openCamera}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 5H16.83L15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z"
                    fill="currentColor"
                  />
                </svg>
                <span>फोटो खिच्नुहोस्</span>
              </button>
            )}
          </div>

          <p className={styles.hint}>
            अधिकतम आकार: {maxSizeMB}MB | {maxFiles - documents.length} फाइल थप्न सकिन्छ
          </p>
        </div>
      )}

      {!canAddMore && (
        <p className={styles.limitReached}>अधिकतम फाइल थपिसकिएको छ</p>
      )}

      {/* Document previews */}
      <AnimatePresence>
        {documents.length > 0 && (
          <div className={styles.documents}>
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                className={styles.document}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Preview */}
                {doc.type.startsWith('image/') ? (
                  <img src={doc.dataUrl} alt={doc.name} className={styles.preview} />
                ) : (
                  <div className={styles.previewPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className={styles.info}>
                  <p className={styles.name}>{doc.name}</p>
                  <p className={styles.size}>{formatFileSize(doc.size)}</p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemove(doc.id)}
                  aria-label="हटाउनुहोस्"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Helper text or error */}
      {error && (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className={styles.helperText}>{helperText}</span>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Camera component (lazy loaded) */}
      {allowCamera && cameraOpen && (
        <Suspense fallback={null}>
          <Camera
            mode="photo"
            isOpen={cameraOpen}
            onCapture={handleCameraCapture}
            onClose={() => setCameraOpen(false)}
            title="कागजात फोटो खिच्नुहोस्"
          />
        </Suspense>
      )}
    </div>
  )
}

// Helper: Convert file to base64 data URL
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
