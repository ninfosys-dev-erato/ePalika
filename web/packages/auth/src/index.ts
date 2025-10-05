// src/auth/index.ts
import type { AuthAdapter, BaseAuthConfig, AuthInitResult } from "./types";

let adapterPromise: Promise<AuthAdapter> | null = null;
let initPromise: Promise<AuthInitResult> | null = null;

function selectAdapter(): Promise<AuthAdapter> {
  if (!adapterPromise) {
    // Vite replaces import.meta.env.* at build time. The unused branch is dead-code-eliminated,
    // and only the chosen adapter chunk is emitted.
    if (import.meta.env.VITE_AUTH_ADAPTER === "live") {
      adapterPromise = import("./adapters/live").then(
        (m) => new m.LiveKeycloakAdapter()
      );
    } else {
      adapterPromise = import("./adapters/simulated").then(
        (m) => new m.SimulatedAdapter()
      );
    }
  }
  return adapterPromise;
}

export async function initAuth(cfg: BaseAuthConfig): Promise<AuthInitResult> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const a = await selectAdapter();
    return a.init(cfg);
  })();
  return initPromise;
}

export async function isAuthenticated(): Promise<boolean> {
  const a = await selectAdapter();
  return a.isAuthenticated();
}

export async function login(options?: Record<string, unknown>) {
  const a = await selectAdapter();
  return a.login(options);
}

export async function logout(options?: { redirectUri?: string }) {
  const a = await selectAdapter();
  return a.logout(options);
}

export async function getToken(): Promise<string | null> {
  const a = await selectAdapter();
  return a.getToken();
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const a = await selectAdapter();
  return a.getAuthHeader();
}

/** Optional: subscribe to auth lifecycle events (token refresh, login/logout) */
export async function onAuthEvent(
  event: "token" | "login" | "logout" | "error",
  cb: () => void
) {
  const a = await selectAdapter();
  return a.on(event, cb);
}
