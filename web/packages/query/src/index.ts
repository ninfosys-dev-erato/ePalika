import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient, PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { set, get, del } from 'idb-keyval'

const DB_KEY = 'rq-egov-v1'
const CHANNEL = 'rq-egov-bc'

/** Minimal IDB persister (async, non-blocking) */
const persister: Persister = {
  persistClient: (client) => set(DB_KEY, client),
  restoreClient: async () => (await get(DB_KEY)) as PersistedClient | undefined,
  removeClient: () => del(DB_KEY),
}

export type MakeQueryClientOpts = {
  persist?: boolean
  maxAgeMs?: number
}

/** Create a tuned QueryClient + optional persistence + cross-tab sync */
export async function makeQueryClient(opts: MakeQueryClientOpts = {}) {
  const {
    persist = true,
    maxAgeMs = 6 * 60 * 60 * 1000, // 6h
  } = opts

  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 120_000,   // 2m -> instant revisits, fewer refetches
        gcTime: 900_000,      // 15m in-memory
        retry: 2,
      },
      mutations: { retry: 1 },
    },
  })

  // Cross-tab invalidation using native BroadcastChannel (tiny footprint)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const bc = new BroadcastChannel(CHANNEL)
    bc.onmessage = (ev: MessageEvent) => {
      const m = ev.data
      if (m?.type === 'invalidate' && m.queryKey) {
        client.invalidateQueries({ queryKey: m.queryKey }).catch(() => {})
      }
    }
    // Expose a helper for apps (optional)
    ;(window as any).__egov_bc_invalidate__ = (queryKey: any[]) =>
      bc.postMessage({ type: 'invalidate', queryKey })
  }

  if (persist) {
    await persistQueryClient({
      queryClient: client,
      persister,
      maxAge: maxAgeMs,
      // Throttle writes to avoid main-thread pressure
      buster: 'v1',
    })
  }

  return client
}
