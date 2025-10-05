import { ChangeEvent, FormEvent, useState } from 'react'
import { Button } from '@egov/ui/primitives/Button'
import { TextInput } from '@egov/ui/primitives/TextInput'
import { TextArea } from '@egov/ui/primitives/TextArea'
import { Select } from '@egov/ui/primitives/Select'
import {
  DocumentUpload,
  type UploadedDocument,
} from '@egov/ui/patterns/DocumentUpload'
import { useChalaniStore, useUIStore, type ChalaniDraft } from '@egov/state-core'
import styles from './ChalaniCompose.module.css'

const CHANNEL_OPTIONS = [
  { value: 'POSTAL', label: 'हुलाक' },
  { value: 'EMAIL', label: 'इमेल' },
  { value: 'SPECIAL_MESSENGER', label: 'दूतमार्फत' },
]

const SIGNATORY_OPTIONS = [
  { value: 'mayor', label: 'नगर प्रमुख' },
  { value: 'ceo', label: 'प्रमुख प्रशासकीय अधिकृत' },
  { value: 'secretary', label: 'नगर सचिव' },
]

const DEFAULT_TEMPLATE = `माननीय,

आपको ${new Date().toLocaleDateString('ne-NP')} मा … सम्बन्धमा आधिकारिक सूचना पठाइएको छ। कृपया आवश्यक कार्यान्वयन गरी ७ दिनभित्र प्रगति बुझाउन अनुरोध गर्दछौं।

धन्यवाद,
चलानी शाखा`

export function ChalaniCompose() {
  const draft = useChalaniStore((state) => state.draft)
  const setDraft = useChalaniStore((state) => state.setDraft)
  const clearDraft = useChalaniStore((state) => state.clearDraft)
  const addToast = useUIStore((state) => state.addToast)

  const [isSubmitting, setSubmitting] = useState(false)

  const chalaniDraft: ChalaniDraft = (draft ?? {}) as ChalaniDraft
  const documents: UploadedDocument[] = (chalaniDraft.documents ?? []) as UploadedDocument[]

  const handleDraftChange = (field: string, value: unknown) => {
    setDraft({
      ...chalaniDraft,
      [field]: value,
    })
  }

  const handleDocumentsChange = (nextDocuments: UploadedDocument[]) => {
    setDraft({
      ...chalaniDraft,
      documents: nextDocuments,
    })
  }

  const resetDraft = () => {
    clearDraft()
    addToast('चलानी ड्राफ्ट खाली गरियो', 'info')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      addToast('चलानी ड्राफ्ट सुरक्षित भयो', 'success')
      clearDraft()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.container}>
      <form className={styles.composer} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <h1 className={styles.title}>चलानी तयार गर्नुहोस्</h1>
          <p className={styles.subtitle}>
            दर्ता गरिएको पत्राचारलाई उपयुक्त टेम्पलेट र हस्ताक्षरकर्तासहित पठाउनुहोस्।
          </p>
        </header>

        <div className={styles.section}>
          <div className={styles.twoColumn}>
            <TextInput
              label="विषय"
              placeholder="उदा. भवन निर्माण बुध्दीपत्र"
              value={chalaniDraft.subject || ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleDraftChange('subject', event.target.value)
              }
              required
            />
            <TextInput
              label="प्राप्तकर्ता"
              placeholder="संस्था वा व्यक्तिको नाम"
              value={chalaniDraft.recipientName || ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleDraftChange('recipientName', event.target.value)
              }
              required
            />
          </div>

          <div className={styles.twoColumn}>
            <TextInput
              label="गन्तव्य ठेगाना"
              placeholder="नगरपालिका, वडा, जिल्ला"
              value={chalaniDraft.recipientAddress || ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleDraftChange('recipientAddress', event.target.value)
              }
            />
            <Select
              label="पठाउने माध्यम"
              options={CHANNEL_OPTIONS}
              value={chalaniDraft.dispatchChannel || CHANNEL_OPTIONS[0].value}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                handleDraftChange('dispatchChannel', event.target.value)
              }
            />
          </div>

          <Select
            label="हस्ताक्षरकर्ता"
            options={SIGNATORY_OPTIONS}
            value={chalaniDraft.signatoryId || SIGNATORY_OPTIONS[0].value}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              handleDraftChange('signatoryId', event.target.value)
            }
            helperText="अन्तिम स्वीकृतिको लागि जिम्मेवार अधिकारी"
          />
        </div>

        <div className={styles.section}>
          <div className={styles.metaRow}>
            <span className={styles.metaPrimary}>चलानी विवरण</span>
            <span className={styles.metaSecondary}>
              टेम्पलेट परिवर्तन गर्दा पुरानो नोटहरू हटिन सक्छन्।
            </span>
          </div>
          <div className={styles.badges}>
            <span className={styles.badge}>चलानी नम्बर: TBD</span>
            <span className={styles.badge}>मसौदा: स्वचालित रूपमा सुरक्षित हुन्छ</span>
          </div>
          <label className={styles.bodyLabel} htmlFor="chalani-body">
            पत्रको मुख्य भाग
          </label>
         <TextArea
            id="chalani-body"
            labelText="पत्रको मुख्य भाग"
            placeholder="औपचारिक पत्र यहाँ लेख्नुहोस्..."
            value={chalaniDraft.body ?? DEFAULT_TEMPLATE}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              handleDraftChange('body', event.target.value)
            }
          />
          <span className={styles.hint}>
            नोट: कार्यालयको आधिकारिक footnote स्वचालित रूपमा थपिनेछ।
          </span>
        </div>

        <div className={styles.section}>
          <DocumentUpload
            label="संलग्नक"
            helperText="परिपत्र, तालिम वा पुराना पत्रहरू जोड्नुहोस्"
            maxFiles={5}
            documents={documents}
            onChange={handleDocumentsChange}
          />
        </div>

        {isSubmitting && <span className={styles.processing}>चलानी तयार गर्दै...</span>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={resetDraft} disabled={isSubmitting}>
            रद्द गर्नुहोस्
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'पठाइँदै...' : 'चलानी सुरक्षित गर्नुहोस्'}
          </Button>
        </div>
      </form>
    </section>
  )
}
