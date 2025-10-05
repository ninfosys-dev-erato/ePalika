// Tiny, runtime-loaded Keycloak wrapper (memory-only)
type KC = any

let kc: KC | null = null
let bc: BroadcastChannel | null = null
let initPromise: Promise<{ authenticated: boolean }> | null = null
let refreshTimer: number | null = null

export type KeycloakConfig = {
  url: string
  realm: string
  clientId: string
  silentCheckSsoRedirectUri: string
  autoLogin?: boolean
}

const AUTH_CHANNEL = 'egov-auth'

export async function initAuth(cfg: KeycloakConfig): Promise<{ authenticated: boolean }> {
  // Reuse a single init across StrictMode double-mount / HMR
  if (initPromise) return initPromise

  initPromise = (async () => {
    // Check if Web Crypto API is available (required for PKCE)
    const isLocalhost = typeof window !== 'undefined' &&
                        (window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '[::1]')

    const hasCrypto = typeof window !== 'undefined' &&
                      typeof window.crypto !== 'undefined' &&
                      typeof window.crypto.subtle !== 'undefined' &&
                      (window.isSecureContext || isLocalhost)

    if (!hasCrypto) {
      console.warn('⚠️ Web Crypto API not available. Authentication disabled.')
      console.warn('   Current context:', {
        hostname: window.location.hostname,
        isSecureContext: window.isSecureContext,
        hasCrypto: typeof window.crypto !== 'undefined',
        hasSubtle: typeof window.crypto?.subtle !== 'undefined'
      })
      // Return mock unauthenticated state for development
      return { authenticated: false }
    }

    // One-time BroadcastChannel (tab-wide logout)
    if ('BroadcastChannel' in window && !bc) {
      bc = new BroadcastChannel(AUTH_CHANNEL)
      bc.onmessage = (e) => {
        if (e.data?.type === 'logout') kc?.logout()
      }
    }

    // Dynamic import keeps initial chunk small
    const { default: Keycloak } = await import('keycloak-js')

    if (!kc) {
      kc = new (Keycloak as any)({
        url: cfg.url,
        realm: cfg.realm,
        clientId: cfg.clientId,
      })
    }

    try {
      const authenticated = await kc.init({
        onLoad: cfg.autoLogin ? 'login-required' : 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })

      // Background refresh (single interval)
      if (refreshTimer == null) {
        refreshTimer = window.setInterval(async () => {
          try { await kc?.updateToken(60) } catch {}
        }, 20_000)
      }

      if (!authenticated && cfg.autoLogin) {
        await kc.login({ prompt: 'login' })
      }

      // Clean up any leftover #state&code fragment (belt & suspenders)
      if (location.hash.includes('state=') && location.hash.includes('code=')) {
        history.replaceState(null, '', location.pathname + location.search)
      }

      return { authenticated: !!kc?.authenticated }
    } catch (error) {
      console.error('⚠️ Authentication initialization failed:', error)
      // Allow app to continue without auth in dev mode
      return { authenticated: false }
    }
  })()

  return initPromise
}

export function isAuthenticated() { return !!kc?.authenticated }
export function login() { return kc?.login({ prompt: 'login' }) }
export function logout() {
  bc?.postMessage({ type: 'logout' })
  return kc?.logout({ redirectUri: location.origin })
}
export function getToken() { return kc?.token }
export function getAuthHeader() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
