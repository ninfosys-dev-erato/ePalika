import { lazy, Suspense, Component, ReactNode } from 'react'

// Lazy load MFE components from remote
const DartaIntake = lazy(() =>
  // @ts-ignore - Module Federation runtime import
  import('mfe_darta/DartaIntake')
    .then((m) => {
      console.log('DartaIntake module loaded:', m)
      // @module-federation/vite exports named exports, convert to default export for React.lazy
      return { default: m.DartaIntake }
    })
    .catch((err) => {
      console.error('Failed to load DartaIntake module:', err)
      return { default: () => <ModuleLoadError moduleName="दर्ता फारम" error={err} /> }
    })
)

const DartaList = lazy(() =>
  // @ts-ignore - Module Federation runtime import
  import('mfe_darta/DartaList')
    .then((m) => {
      console.log('DartaList module loaded:', m)
      // @module-federation/vite exports named exports, convert to default export for React.lazy
      return { default: m.DartaList }
    })
    .catch((err) => {
      console.error('Failed to load DartaList module:', err)
      return { default: () => <ModuleLoadError moduleName="दर्ता सूची" error={err} /> }
    })
)

const DartaTriage = lazy(() =>
  // @ts-ignore - Module Federation runtime import
  import('mfe_darta/TriageInbox')
    .then((m) => {
      console.log('TriageInbox module loaded:', m)
      // @module-federation/vite exports named exports, convert to default export for React.lazy
      return { default: m.TriageInbox }
    })
    .catch((err) => {
      console.error('Failed to load TriageInbox module:', err)
      return { default: () => <ModuleLoadError moduleName="त्रायज" error={err} /> }
    })
)

function LoadingFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>लोड हुँदैछ...</p>
    </div>
  )
}

function ModuleLoadError({ moduleName, error }: { moduleName: string; error: Error }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#dc2626' }}>मोड्युल लोड गर्न सकिएन</h2>
      <p>{moduleName} लोड गर्न समस्या भयो। कृपया पृष्ठ पुन: लोड गर्नुहोस्।</p>
      <details style={{ marginTop: '1rem', padding: '1rem', background: '#fee', borderRadius: '4px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>प्राविधिक विवरण</summary>
        <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>
          {error.message || String(error)}
        </pre>
      </details>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        पृष्ठ पुन: लोड गर्नुहोस्
      </button>
    </div>
  )
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Module loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ModuleLoadError moduleName="मोड्युल" error={this.state.error || new Error('Unknown error')} />
        )
      )
    }

    return this.props.children
  }
}

export function DartaIntakePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <DartaIntake />
      </Suspense>
    </ErrorBoundary>
  )
}

export function DartaListPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <DartaList />
      </Suspense>
    </ErrorBoundary>
  )
}

export function DartaTriagePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <DartaTriage />
      </Suspense>
    </ErrorBoundary>
  )
}
