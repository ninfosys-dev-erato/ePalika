import { useMemo, useState, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@egov/query'
import { ApolloProvider } from '@apollo/client/react'
import { createApolloClient } from "../graphql/clientFactory";
import { CarbonProviders } from '../ui/CarbonProviders'
import { initAuth, getAuthHeader, isAuthenticated, login } from '@egov/auth'
import { useUIStore } from '@egov/state-core'

const cfg = {
  url: import.meta.env.VITE_KEYCLOAK_URL!,
  realm: import.meta.env.VITE_KEYCLOAK_REALM!,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID!,
  silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
  autoLogin: import.meta.env.VITE_AUTH_AUTO_LOGIN === 'true',
} as const

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [qc, setQc] = useState<any>(null)
  const theme = useUIStore((state) => state.theme)

  // Build Apollo once; auth header is injected per-request (fresh token)
  const apollo = useMemo(
    () => createApolloClient(),
    []
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Safe: init is promise-memoized in @egov/auth (no loops / no double init)
      await initAuth(cfg)
      const client = await makeQueryClient({ persist: true })
      if (alive) {
        setQc(client)
        setReady(true)
        // Prefetch stub — fill with real queries later
        ;(window as any).__prefetch_darta__ = async () => {}
      }
    })()
    return () => { alive = false }
  }, [])

  if (!ready) return <div style={{ padding: 16 }}>Booting…</div>

  if (!isAuthenticated()) {
    return (
      <CarbonProviders theme={theme}>
        <div className="app">
          <h2>Session</h2>
          <p>You need to sign in to continue.</p>
        <button onClick={() => login()}>Sign in</button>
        </div>
      </CarbonProviders>
    )
  }

  return (
    <CarbonProviders theme={theme}>
      <ApolloProvider client={apollo}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </ApolloProvider>
    </CarbonProviders>
  )
}
