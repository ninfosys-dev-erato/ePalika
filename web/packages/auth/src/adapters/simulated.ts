// src/auth/adapters/simulated.ts
import type { AuthAdapter, AuthEvent, AuthInitResult, BaseAuthConfig } from '../types'

const AUTH_CHANNEL = 'egov-auth'
const STORAGE_KEY = 'egov-simulated-auth-token'

export class SimulatedAdapter implements AuthAdapter {
  private token: string | null = null
  private bc: BroadcastChannel | null = null
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

  async init(_cfg: BaseAuthConfig): Promise<AuthInitResult> {
    if ('BroadcastChannel' in window) {
      if (!this.bc) {
        this.bc = new BroadcastChannel(AUTH_CHANNEL)
        this.bc.onmessage = (e) => {
          if (e?.data?.type === 'logout') this.logout()
        }
      }
    }

    // Check localStorage for persisted token
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.token = stored
        return { authenticated: true }
      }
    } catch (e) {
      console.warn('Failed to restore auth from localStorage:', e)
    }

    return { authenticated: false }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  async login() {
    // Dev-only opaque token; enough to keep shapes consistent
    const payload = {
      sub: 'dev-user-1',
      name: 'Dev User',
      email: 'dev.user@example.com',
      roles: ['dev', 'admin'],
      iat: Date.now(),
    }
    this.token = `dev.${btoa(JSON.stringify(payload))}.local`

    // Persist token to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, this.token)
    } catch (e) {
      console.warn('Failed to persist auth to localStorage:', e)
    }

    this.emit('login')
    this.emit('token')
  }

  async logout() {
    if (this.bc) this.bc.postMessage({ type: 'logout' })
    this.token = null

    // Remove token from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to remove auth from localStorage:', e)
    }

    this.emit('logout')
  }

  getToken(): string | null {
    return this.token
  }

  getAuthHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {}
  }
}
