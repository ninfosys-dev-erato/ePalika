import { useMemo, useState } from 'react'
import { Button } from '../../primitives/Button'
import styles from './Receipt.module.css'
import type { ReceiptPdfField, ReceiptPdfOptions } from './pdf'
import { generateReceiptPdf } from './pdf'

export interface ReceiptField extends ReceiptPdfField {
  emphasis?: boolean
}

export interface ReceiptProps extends ReceiptPdfOptions {
  fields: ReceiptField[]
  fileName?: string
  onDownload?: () => void
  downloadLabel?: string
}

export function Receipt({
  title,
  subtitle,
  referenceNumber,
  issuedAt,
  issuedBy,
  organization,
  fields,
  meta,
  notes,
  fileName = `receipt-${referenceNumber}`,
  onDownload,
  downloadLabel = 'PDF डाउनलोड गर्नुहोस्',
}: ReceiptProps) {
  const [downloading, setDownloading] = useState(false)

  const formattedIssuedAt = useMemo(() => formatDisplayDate(issuedAt), [issuedAt])

  const handleDownload = async () => {
    if (typeof window === 'undefined') return

    try {
      setDownloading(true)
      const blob = await generateReceiptPdf({
        title,
        subtitle,
        referenceNumber,
        issuedAt,
        issuedBy,
        organization,
        fields,
        meta,
        notes,
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      onDownload?.()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className={styles.receipt} aria-labelledby="receipt-title">
      <header className={styles.header}>
        <h2 id="receipt-title" className={styles.title}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      <div className={styles.reference}>
        <span className={styles.referenceLabel}>दर्ता नम्बर</span>
        <span className={styles.referenceValue}>{referenceNumber}</span>
      </div>

      <div className={styles.meta}>
        {organization?.name && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>संस्था</span>
            <span className={styles.metaValue}>{organization.name}</span>
          </div>
        )}
        {formattedIssuedAt && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>जारी मिति</span>
            <span className={styles.metaValue}>{formattedIssuedAt}</span>
          </div>
        )}
        {issuedBy && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>जारी गर्ने</span>
            <span className={styles.metaValue}>{issuedBy}</span>
          </div>
        )}
        {meta?.map((item) => (
          <div key={`${item.label}-${item.value}`} className={styles.metaItem}>
            <span className={styles.metaLabel}>{item.label}</span>
            <span className={styles.metaValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.fields}>
        {fields.map((field) => (
          <div key={`${field.label}-${field.value}`} className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}</span>
            <span
              className={styles.fieldValue}
              style={field.emphasis ? { fontWeight: 600 } : undefined}
            >
              {field.value}
            </span>
          </div>
        ))}
      </div>

      {notes && <p className={styles.notes}>{notes}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'तैयार गर्दै...' : downloadLabel}
        </Button>
      </div>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} ePalika. सबै अधिकार सुरक्षित।
      </footer>
    </section>
  )
}

function formatDisplayDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return new Intl.DateTimeFormat('ne-NP', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date)
  } catch (error) {
    console.warn('Failed to format display date for receipt:', error)
    return iso
  }
}
