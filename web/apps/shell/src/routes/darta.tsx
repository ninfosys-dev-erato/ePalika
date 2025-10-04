import { lazy, Suspense } from 'react'

// Lazy load MFE components from remote
const DartaIntake = lazy(() =>
  // @ts-ignore - Module Federation runtime import
  import('mfe_darta/DartaIntake').then((m) => ({ default: m.DartaIntake }))
)

const DartaList = lazy(() =>
  // @ts-ignore - Module Federation runtime import
  import('mfe_darta/DartaList').then((m) => ({ default: m.DartaList }))
)

function LoadingFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>लोड हुँदैछ...</p>
    </div>
  )
}

export function DartaIntakePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DartaIntake />
    </Suspense>
  )
}

export function DartaListPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DartaList />
    </Suspense>
  )
}
