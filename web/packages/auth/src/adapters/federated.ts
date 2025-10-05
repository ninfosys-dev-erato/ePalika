// src/auth/adapters/federated.ts
import type { AuthAdapter, AuthEvent, AuthInitResult, BaseAuthConfig } from '../types'

type KC = any

const AUTH_CHANNEL = 'egov-auth'
const REFRESH_WINDOW_SECONDS = 60
const REFRESH_INTERVAL_MS = 20_000

export class FederatedKeycloakAdapter implements AuthAdapter {
  private kc: KC | null = null
  private bc: BroadcastChannel | null = null
  private refreshTimer: number | null = null
  private listeners: Map<AuthEvent, Set<() => void>> = new Map([
    ['token', new Set()],
    ['login', new Set()],
    ['logout', new Set()],
    ['error', new Set()],
  ])

  private emit(ev: AuthEvent) {
    this.listeners.get(ev)?.forEach(fn => {
      try { fn() } catch {}
    })
  }

  on(event: AuthEvent, cb: () => void) {
    const set = this.listeners.get(event)!
    set.add(cb)
    return () => set.delete(cb)
  }

  private ensureSecureCrypto(): boolean {
    const isLocalhost =
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

    const hasCrypto =
      typeof window !== 'undefined' &&
      typeof window.crypto !== 'undefined' &&
      typeof window.crypto.subtle !== 'undefined' &&
      (window.isSecureContext || isLocalhost)

    return hasCrypto
  }

  async init(cfg: BaseAuthConfig): Promise<AuthInitResult> {
    if (!this.ensureSecureCrypto()) {
      console.warn('⚠️ Web Crypto API not available/secure; Keycloak disabled.')
      return { authenticated: false }
    }

    if (!this.bc && 'BroadcastChannel' in window) {
      this.bc = new BroadcastChannel(AUTH_CHANNEL)
      this.bc.onmessage = (e) => {
        if (e?.data?.type === 'logout') this.kc?.logout()
      }
    }

    // Dynamic import keeps initial chunk small
    const { default: Keycloak } = await import('keycloak-js')

    if (!this.kc) {
      this.kc = new (Keycloak as any)({
        url: cfg.url ?? import.meta.env.VITE_KEYCLOAK_URL,
        realm: cfg.realm ?? import.meta.env.VITE_KEYCLOAK_REALM,
        clientId: cfg.clientId ?? import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      })
    }

    try {
      const authenticated = await this.kc.init({
        onLoad:
          (cfg.autoLogin ?? (import.meta.env.VITE_AUTO_LOGIN === 'true'))
            ? 'login-required'
            : 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri:
          cfg.silentCheckSsoRedirectUri ?? import.meta.env.VITE_SILENT_CHECK_SSO_URI,
      })

      // Clean stray fragments (#state&code)
      if (location.hash.includes('state=') && location.hash.includes('code=')) {
        history.replaceState(null, '', location.pathname + location.search)
      }

      // Background refresh
      if (this.refreshTimer == null) {
        this.refreshTimer = window.setInterval(async () => {
          try {
            const didRefresh = await this.kc?.updateToken(REFRESH_WINDOW_SECONDS)
            if (didRefresh) this.emit('token')
          } catch (e) {
            console.warn('Token refresh failed', e)
            this.emit('error')
          }
        }, REFRESH_INTERVAL_MS)
      }

      if (!authenticated && (cfg.autoLogin ?? (import.meta.env.VITE_AUTO_LOGIN === 'true'))) {
        await this.kc.login({ prompt: 'login' })
        this.emit('login')
      } else if (authenticated) {
        this.emit('login')
      }

      return { authenticated: !!this.kc?.authenticated }
    } catch (err) {
      console.error('Auth init failed:', err)
      this.emit('error')
      return { authenticated: false }
    }
  }

  isAuthenticated(): boolean {
    return !!this.kc?.authenticated
  }

  async login(options?: Record<string, unknown>) {
    await this.kc?.login({ prompt: 'login', ...(options ?? {}) })
    this.emit('login')
  }

  async logout(options?: { redirectUri?: string }) {
    if (this.bc) this.bc.postMessage({ type: 'logout' })
    await this.kc?.logout({ redirectUri: options?.redirectUri ?? location.origin })
    this.emit('logout')
  }

  getToken(): string | null {
    return this.kc?.token ?? null
  }

  getAuthHeader(): Record<string, string> {
    const t = this.getToken()
    return t ? { Authorization: `Bearer ${t}` } : {}
  }
}
