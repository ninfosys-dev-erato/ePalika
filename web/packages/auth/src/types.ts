// src/auth/types.ts
export type AuthMode = "simulated" | "live";

export type KeycloakConfig = {
  url: string;
  realm: string;
  clientId: string;
  silentCheckSsoRedirectUri: string;
  autoLogin?: boolean;
};

export type BaseAuthConfig = Partial<KeycloakConfig> & {
  // room for future knobs (clock skew, refresh window, telemetry, etc.)
};

export type AuthInitResult = { authenticated: boolean };

export type AuthEvent = "token" | "login" | "logout" | "error";

export interface AuthAdapter {
  /** idempotent; safe under React StrictMode double-mount/HMR */
  init(cfg: BaseAuthConfig): Promise<AuthInitResult>;
  isAuthenticated(): boolean;
  login(options?: Record<string, unknown>): Promise<void>;
  logout(options?: { redirectUri?: string }): Promise<void>;
  getToken(): string | null;
  getAuthHeader(): Record<string, string>;
  on(event: AuthEvent, cb: () => void): () => void;
}
