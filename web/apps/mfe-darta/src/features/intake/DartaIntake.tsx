import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDartaStore, useUIStore } from '@egov/state-core'
import { Button } from '@egov/ui-mobile/primitives/Button'
import { Input } from '@egov/ui-mobile/primitives/Input'
import { DocumentUpload, UploadedDocument } from '@egov/ui-mobile/patterns/DocumentUpload'
import { Receipt, ReceiptProps } from '@egov/ui-mobile/patterns/Receipt'
import {
  useCreateDartaMutation,
  IntakeChannel,
  Scope,
  CaseStatus,
  type CreateDartaMutation,
} from '@egov/graphql-schema/generated'
import styles from './DartaIntake.module.css'

interface DartaDraft {
  subject?: string
  applicant?: {
    name?: string
    phone?: string
  }
}

/**
 * Darta Intake - Mobile-first form for registering incoming correspondence
 *
 * Features:
 * - Touch-optimized form fields (44px min)
 * - Camera scanner integration (lazy loaded)
 * - Offline draft support via Zustand persist
 * - Real-time validation
 * - Nepali language support
 */
export function DartaIntake() {
  const draft = useDartaStore((state) => state.draft)
  const setDraft = useDartaStore((state) => state.setDraft)
  const clearDraft = useDartaStore((state) => state.clearDraft)
  const addToast = useUIStore((state) => state.addToast)

  const [createDarta, { loading }] = useCreateDartaMutation()
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ReceiptProps | null>(null)

  const [channel, setChannel] = useState<IntakeChannel>(() => draft?.intakeChannel || 'COUNTER')
  const [scope, setScope] = useState<Scope>(() => draft?.scope || 'MUNICIPALITY')

  const documents: UploadedDocument[] = useMemo(() => {
    if (!draft?.documents || !Array.isArray(draft.documents)) return []
    return draft.documents.map((doc) => ({ ...doc }))
  }, [draft])

  useEffect(() => {
    const storedChannel = draft?.intakeChannel
    if (storedChannel && storedChannel !== channel) {
      setChannel(storedChannel)
    }

    const storedScope = draft?.scope
    if (storedScope && storedScope !== scope) {
      setScope(storedScope)
    }
  }, [draft, channel, scope])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!documents.length) {
      setDocumentError('कृपया कम्तीमा एक कागजात थप्नुहोस्')
      return
    }

    const primaryDocument = documents[0]
    const annexIds = documents.slice(1).map((doc) => doc.id)

    try {
      const result = await createDarta({
        variables: {
          input: {
            scope,
            subject: draft?.subject || '',
            applicant: {
              fullName: draft?.applicantName || '',
              phone: draft?.applicantPhone || '',
              type: 'CITIZEN',
            },
            intakeChannel: channel,
            primaryDocumentId: primaryDocument.id,
            annexIds: annexIds.length ? annexIds : undefined,
            receivedDate: new Date().toISOString(),
            idempotencyKey: `darta-${Date.now()}`,
          },
        },
      })

      if (result.data?.createDarta) {
        addToast(`दर्ता सफलतापूर्वक सुरक्षित गरियो - ${result.data.createDarta.formattedDartaNumber}`, 'success')
        setReceipt(buildReceiptPayload(result.data.createDarta))
        clearDraft()
        setDocumentError(null)
        setChannel('COUNTER')
        setScope('MUNICIPALITY')
      }
    } catch (error) {
      console.error('Create darta error:', error)
      addToast('त्रुटि: दर्ता सुरक्षित गर्न सकिएन', 'error')
    }
  }

  const handleDraftChange = (field: string, value: any) => {
    if (receipt) {
      setReceipt(null)
    }

    setDraft({
      ...(draft || {}),
      [field]: value,
    })
  }

  const handleDocumentsChange = (nextDocuments: UploadedDocument[]) => {
    const normalized = nextDocuments.map((doc) => ({ ...doc }))
    if (receipt) {
      setReceipt(null)
    }
    setDraft({
      ...(draft || {}),
      documents: normalized.length ? normalized : undefined,
    })

    if (documentError && nextDocuments.length) {
      setDocumentError(null)
    }
  }

  const handleChannelChange = (nextChannel: IntakeChannel) => {
    setChannel(nextChannel)
    if (receipt) {
      setReceipt(null)
    }
    setDraft({
      ...(draft || {}),
      intakeChannel: nextChannel,
    })
  }

  const handleScopeChange = (nextScope: Scope) => {
    setScope(nextScope)
    if (receipt) {
      setReceipt(null)
    }
    setDraft({
      ...(draft || {}),
      scope: nextScope,
    })
  }

  const handleReset = () => {
    clearDraft()
    setDocumentError(null)
    setChannel('COUNTER')
    setScope('MUNICIPALITY')
    setReceipt(null)
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>नयाँ दर्ता</h1>
        <p className={styles.subtitle}>आवेदन दर्ता गर्नुहोस्</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Intake Channel */}
        <div className={styles.field}>
          <label className={styles.label}>माध्यम</label>
          <div className={styles.buttonGroup}>
            {(['COUNTER', 'EMAIL', 'EDARTA_PORTAL', 'POSTAL'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                className={`${styles.channelButton} ${channel === ch ? styles.active : ''}`}
                onClick={() => handleChannelChange(ch)}
              >
                {getChannelLabel(ch)}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className={styles.field}>
          <label className={styles.label}>स्तर</label>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.scopeButton} ${scope === 'MUNICIPALITY' ? styles.active : ''}`}
              onClick={() => handleScopeChange('MUNICIPALITY')}
            >
              नगरपालिका
            </button>
            <button
              type="button"
              className={`${styles.scopeButton} ${scope === 'WARD' ? styles.active : ''}`}
              onClick={() => handleScopeChange('WARD')}
            >
              वडा
            </button>
          </div>
        </div>

        {/* Subject */}
        <Input
          label="विषय"
          placeholder="उदा. नागरिकता सिफारिस अनुरोध"
          value={draft?.subject || ''}
          onChange={(e) => handleDraftChange('subject', e.target.value)}
          required
        />

        {/* Applicant Name */}
        <Input
          label="निवेदकको नाम"
          placeholder="पुरा नाम"
          value={draft?.applicantName || ''}
          onChange={(e) => handleDraftChange('applicantName', e.target.value)}
          required
        />

        {/* Applicant Phone */}
        <Input
          label="सम्पर्क नम्बर"
          type="tel"
          placeholder="९८XXXXXXXX"
          value={draft?.applicantPhone || ''}
          onChange={(e) => handleDraftChange('applicantPhone', e.target.value)}
        />

        <div className={styles.field}>
          <DocumentUpload
            label="संलग्न कागजात"
            required
            helperText="PDF वा फोटो (५MB भित्र)"
            error={documentError || undefined}
            documents={documents}
            onChange={handleDocumentsChange}
            maxFiles={3}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!draft || loading}
          >
            रद्द गर्नुहोस्
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'सुरक्षित गर्दै...' : 'दर्ता गर्नुहोस्'}
          </Button>
        </div>
      </form>

      {receipt && (
        <div className={styles.receiptSection}>
          <Receipt {...receipt} />
        </div>
      )}
    </motion.div>
  )
}

function getChannelLabel(channel: IntakeChannel): string {
  const labels: Record<string, string> = {
    'COUNTER': 'प्रत्यक्ष',
    'EMAIL': 'इमेल',
    'EDARTA_PORTAL': 'पोर्टल',
    'POSTAL': 'हुलाक',
    'COURIER': 'कुरियर',
  }
  return labels[channel] || channel
}

function getScopeLabel(scope: Scope): string {
  return scope === 'MUNICIPALITY' ? 'नगरपालिका' : 'वडा'
}

function getStatusLabel(status: CaseStatus): string {
  const labels: Partial<Record<CaseStatus, string>> = {
    PENDING_TRIAGE: 'विचाराधीन',
    PENDING_REVIEW: 'समिक्षा हुँदै',
    PENDING_APPROVAL: 'स्वीकृतिको प्रतिक्षा',
    APPROVED: 'स्वीकृत',
    DISPATCHED: 'प्रेषित',
    ACKNOWLEDGED: 'प्राप्त पुष्टि',
    CLOSED: 'बन्द',
    VOID: 'रद्द',
  }
  return labels[status] || status
}

function buildReceiptPayload(created: CreateDartaMutation['createDarta']): ReceiptProps {
  const organizationName = created.scope === 'MUNICIPALITY' ? 'नगरपालिका दर्ता शाखा' : 'वडा कार्यालय'

  const fields = [
    { label: 'विषय', value: created.subject, emphasis: true },
    { label: 'निवेदक', value: created.applicant.fullName },
    { label: 'सम्पर्क', value: created.applicant.phone || 'उपलब्ध छैन' },
    { label: 'माध्यम', value: getChannelLabel(created.intakeChannel) },
    { label: 'स्थिति', value: getStatusLabel(created.status) },
  ]

  const meta = [
    { label: 'वित्तीय वर्ष', value: created.fiscalYear },
    { label: 'स्तर', value: getScopeLabel(created.scope) },
  ]

  return {
    title: 'दर्ता रसिद',
    subtitle: 'आवेदन प्राप्तिको प्रमाण',
    referenceNumber: created.formattedDartaNumber,
    issuedAt: created.createdAt,
    issuedBy: 'दर्ता शाखा',
    organization: {
      name: organizationName,
    },
    fields,
    meta,
    notes: 'कृपया यो रसिद सुरक्षित राख्नुहोस् र आवश्यक परे प्रस्तुत गर्नुहोस्।',
    fileName: `darta-receipt-${created.formattedDartaNumber}`,
  }
}
