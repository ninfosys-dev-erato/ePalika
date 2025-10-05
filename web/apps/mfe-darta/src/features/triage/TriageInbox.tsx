import { useEffect, useMemo, useState } from 'react'
import { Card } from '@egov/ui/primitives/Card'
import { Button } from '@egov/ui/primitives/Button'
import { Select } from '@egov/ui/primitives/Select'
import {
  useDartasQuery,
  useRouteDartaMutation,
  IntakeChannel,
  Scope,
  Darta,
} from '@egov/api-schema/generated'
import { useDartaStore, useUIStore } from '@egov/state-core'
import styles from './TriageInbox.module.css'

const ORGANIZATIONAL_UNITS = [
  { id: '1', name: 'शिक्षा विभाग' },
  { id: '2', name: 'स्वास्थ्य विभाग' },
  { id: '3', name: 'योजना तथा विकास विभाग' },
  { id: '4', name: 'वित्त विभाग' },
]

// Generated unions include '%future added value' which makes a plain Record
// require that key; use Partial<Record<...>> and fallbacks when reading values.
const CHANNEL_LABELS: Partial<Record<IntakeChannel, string>> = {
  COUNTER: 'प्रत्यक्ष',
  EMAIL: 'इमेल',
  EDARTA_PORTAL: 'पोर्टल',
  POSTAL: 'हुलाक',
  COURIER: 'कुरियर',
}

const SCOPE_LABELS: Partial<Record<Scope, string>> = {
  MUNICIPALITY: 'नगरपालिका',
  WARD: 'वडा',
}

export function TriageInbox() {
  const selectedDarta = useDartaStore((state) => state.selectedDarta)
  const selectDarta = useDartaStore((state) => state.selectDarta)
  const addToast = useUIStore((state) => state.addToast)

  const { data, loading, error, refetch } = useDartasQuery({
    variables: {
      filter: {
        status: 'PENDING_TRIAGE',
      },
      pagination: {
        page: 1,
        limit: 50,
      },
    },
    fetchPolicy: 'cache-and-network',
  })

  const [selectedUnitId, setSelectedUnitId] = useState(ORGANIZATIONAL_UNITS[0].id)
  const [notes, setNotes] = useState('')
  const [routeDarta, { loading: routing }] = useRouteDartaMutation()

  // Use generated Darta type where possible
  const triageItems = useMemo(() => {
    return (data?.dartas?.edges ?? []).map((edge: any) => edge.node as Darta) as Darta[]
  }, [data])

  useEffect(() => {
    if (!triageItems.length) {
      selectDarta(null)
      return
    }

    if (!selectedDarta || !triageItems.some((item: Darta) => item.id === selectedDarta.id)) {
      selectDarta(triageItems[0])
    }
  }, [triageItems, selectedDarta, selectDarta])

  const handleRoute = async () => {
    if (!selectedDarta) return

    try {
      await routeDarta({
        variables: {
          input: {
            dartaId: selectedDarta.id,
            organizationalUnitId: selectedUnitId,
            notes: notes || undefined,
          },
        },
      })

      addToast('दर्ता सफलतापूर्वक अग्रसर गरियो', 'success')
      selectDarta(null)
      setNotes('')
      await refetch()
    } catch (err) {
      console.error('Route darta error:', err)
      addToast('त्रुटि: दर्ता अग्रसर गर्न सकिएन', 'error')
    }
  }

  const handleSkip = async () => {
    if (!selectedDarta) return

    const currentIndex = triageItems.findIndex((item: Darta) => item.id === selectedDarta.id)
    const next = triageItems[currentIndex + 1] ?? triageItems[0]
    selectDarta(next)
    addToast('दर्ता पछि समीक्षा गर्न ठेवियो', 'info')
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <p>लोड हुँदैछ...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className={styles.errorBlock}>
          <h2>त्रुटि</h2>
          <p>इनबक्स लोड गर्न सकिएन</p>
        </div>
      )
    }

    if (triageItems.length === 0) {
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateTitle}>सबै दर्ताहरू सम्हालिएको छ</span>
          <p>नयाँ दर्ता प्राप्त भएपछि यहाँ देखिन्छ</p>
        </div>
      )
    }

    return (
      <div className={styles.list}>
        {triageItems.map((item: Darta) => {
          const isSelected = selectedDarta?.id === item.id
          return (
            <Card
              key={item.id}
              variant="outlined"
              padding="medium"
              interactive
              animated
              onClick={() => selectDarta(item)}
              className={isSelected ? styles.selected : undefined}
              header={
                <div className={styles.cardHeader}>
                  <div className={styles.dartaNumber}>{item.formattedDartaNumber}</div>
                  <div className={`${styles.status} ${(styles as any).pending_triage ?? 'pending_triage'}`}>
                    प्राथमिकता
                  </div>
                </div>
              }
            >
              <div className={styles.subject}>{item.subject}</div>
              <div className={styles.meta}>
                <span className={styles.metaBadge}>{item.applicant?.fullName ?? '---'}</span>
                <span className={styles.metaBadge}>{CHANNEL_LABELS[item.intakeChannel] ?? item.intakeChannel}</span>
                <span className={styles.metaBadge}>{formatRelativeTime(item.receivedDate ?? '')}</span>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderDetail = () => {
    if (!selectedDarta) {
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateTitle}>इनबक्स खाली छ</span>
          <p>समीक्षाका लागि नयाँ दर्ता प्रतीक्षा गर्दै</p>
        </div>
      )
    }

    return (
      <div className={styles.detail}>
        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>{selectedDarta.subject}</h2>
          <p className={styles.detailSubtitle}>
            दर्ता नं. {selectedDarta.formattedDartaNumber}
          </p>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>निवेदक</span>
            <span className={styles.detailValue}>{selectedDarta.applicant.fullName}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>माध्यम</span>
            <span className={styles.detailValue}>{CHANNEL_LABELS[selectedDarta.intakeChannel]}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>स्तर</span>
            <span className={styles.detailValue}>{SCOPE_LABELS[selectedDarta.scope]}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>प्राप्त मिति</span>
            <span className={styles.detailValue}>{formatAbsoluteDate(selectedDarta.receivedDate)}</span>
          </div>
        </div>

        <div>
          <span className={styles.inlineLabel}>फारवर्ड गर्ने इकाई</span>
          <div className={styles.unitChips}>
            {ORGANIZATIONAL_UNITS.map((unit) => {
              const active = unit.id === selectedUnitId
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`${styles.unitChip} ${active ? styles.unitChipActive : ''}`}
                >
                  {unit.name}
                </button>
              )
            })}
          </div>
          <Select
            label="अन्य विभाग"
            variant="outlined"
            value={selectedUnitId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            options={ORGANIZATIONAL_UNITS.map((unit) => ({
              value: unit.id,
              label: unit.name,
            }))}
            helperText="शीघ्र पहुँचका लागि माथिका बटनहरू प्रयोग गर्नुहोस्"
          />
        </div>

        <div>
          <span className={styles.inlineLabel}>टीका/नोट</span>
          <textarea
            className={styles.notesArea}
            placeholder="केही निर्देशन या टिप्पणी थप्नुहोस्"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className={styles.helperText}>नोट वैकल्पिक हो, तर भविष्यका लागि उपयोगी हुन सक्छ।</div>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={routing || triageItems.length <= 1}
          >
            पछि हेर्ने
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleRoute}
            disabled={routing}
          >
            {routing ? 'फारवर्ड गर्दै...' : 'फारवर्ड गर्नुहोस्'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>त्रायज इनबक्स</h1>
        <span className={styles.count}>{triageItems.length} दर्ता</span>
      </header>

      <div className={styles.layout}>
        {renderList()}
        {renderDetail()}
      </div>
    </section>
  )
}

function formatAbsoluteDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ne-NP', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch (error) {
    console.warn('Failed to format date', error)
    return iso
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso)
    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffMinutes = Math.round(diffMs / 60000)

    if (diffMinutes < 1) return 'अहिले'
    if (diffMinutes < 60) return `${diffMinutes} मिनेट अघि`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} घण्टा अघि`

    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} दिन अघि`
  } catch (error) {
    console.warn('Failed to format relative time', error)
    return iso
  }
}
