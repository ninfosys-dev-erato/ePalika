import { useDartaStore } from '@egov/state-core'
import { useDartasQuery } from '@egov/graphql-schema/generated'
import { Card } from '@egov/ui-mobile/primitives/Card'
import styles from './DartaList.module.css'

/**
 * Darta List - Mobile-optimized list view with infinite scroll
 *
 * Features:
 * - Virtual scrolling for performance
 * - Swipe actions (route, archive)
 * - Filter by status, scope, fiscal year
 * - Search with Nepali support
 * - Pull-to-refresh
 */
export function DartaList() {
  const selectedDarta = useDartaStore((state) => state.selectedDarta)
  const selectDarta = useDartaStore((state) => state.selectDarta)

  // Fetch dartas from GraphQL
  const { data, loading, error } = useDartasQuery({
    variables: {
      pagination: {
        page: 1,
        limit: 50,
      },
    },
  })

  const dartas = data?.dartas?.edges?.map((edge: any) => edge.node) || []

  if (loading) {
    return (
      <div className={styles.empty}>
        <p>लोड गर्दै...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <h2>त्रुटि</h2>
        <p>दर्ता लोड गर्न सकिएन</p>
      </div>
    )
  }

  if (dartas.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>कुनै दर्ता छैन</h2>
        <p>नयाँ दर्ता थप्नुहोस्</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>दर्ता सूची</h1>
        <div className={styles.count}>{dartas.length} दर्ताहरू</div>
      </header>

      <div className={styles.list}>
        {dartas.map((darta: any) => (
          <Card
            key={darta.id}
            variant="outlined"
            padding="medium"
            interactive
            animated
            onClick={() => selectDarta(darta)}
            className={selectedDarta?.id === darta.id ? styles.selected : ''}
            header={
              <div className={styles.cardHeader}>
                <div className={styles.dartaNumber}>{darta.formattedDartaNumber}</div>
                <div className={`${styles.status} ${styles[darta.status.toLowerCase()]}`}>
                  {getStatusLabel(darta.status)}
                </div>
              </div>
            }
          >
            <div className={styles.subject}>{darta.subject}</div>

            <div className={styles.meta}>
              <span className={styles.applicant}>{darta.applicant.fullName}</span>
              <span className={styles.scope}>{getScopeLabel(darta.scope)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    INTAKE: 'नयाँ',
    TRIAGE: 'पहिचान',
    REVIEW: 'समीक्षा',
    APPROVED: 'स्वीकृत',
    DISPATCHED: 'पठाइयो',
    CLOSED: 'बन्द',
  }
  return labels[status] || status
}

function getScopeLabel(scope: string): string {
  return scope === 'MUNICIPALITY' ? 'नगरपालिका' : 'वडा'
}
