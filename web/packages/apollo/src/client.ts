import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { sha256 } from 'js-sha256'

export type MakeApolloClientOpts = {
  url: string
  getAuthHeader?: () => Record<string, string> // Provide later from Keycloak
}

export function makeApolloClient({ url, getAuthHeader }: MakeApolloClientOpts) {
  const retry = new RetryLink({
    attempts: { max: 2, retryIf: (error) => !!error },
    delay: { initial: 150, max: 600, jitter: true },
  })

  // APQ with tiny hasher (sync)
  const apq = createPersistedQueryLink({
    sha256: (q: string) => sha256(q),
    useGETForHashedQueries: false, // auth headers kill shared caches; keep POST
  })

  // Batching: coalesce within 10ms into one HTTP request
  const batch = new BatchHttpLink({
    uri: url,
    batchMax: 12,
    batchInterval: 10,
    fetch: (input, init) =>
      fetch(input as any, {
        ...init,
        // inject Authorization lazily (no global state)
        headers: { ...(init?.headers || {}), ...(getAuthHeader?.() || {}) },
      }),
  })

  const cache = new InMemoryCache({
    typePolicies: {
      Query: { fields: {} }, // we’ll add merge policies per list later
    },
  })

  return new ApolloClient({
    link: from([retry, apq, batch]),
    cache,
    connectToDevTools: import.meta?.env?.DEV,
    defaultOptions: {
      query: { fetchPolicy: 'cache-first' },
      watchQuery: { fetchPolicy: 'cache-first' },
    },
  })
}
