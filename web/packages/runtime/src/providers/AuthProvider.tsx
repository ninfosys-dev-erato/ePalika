// packages/runtime/src/providers/AuthProvider.tsx
/// <reference types="../env.d.ts" />
import { useState, useEffect } from "react";
import { initAuth, isAuthenticated, login } from "@egov/auth";
import { CarbonProviders } from "@egov/ui";
import { useUIStore } from "@egov/state-core";

const cfg = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
  autoLogin: import.meta.env.VITE_AUTH_AUTO_LOGIN === "true",
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    (async () => {
      await initAuth(cfg);
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);
      setReady(true);
    })();
  }, []);

  if (!ready)
    return <div style={{ padding: 16 }}>🔑 Initializing Identity Context…</div>;

  if (!authenticated) {
    return (
      <CarbonProviders theme={theme}>
        <div style={{ padding: 32 }}>
          <h3>Authentication Required</h3>
          <p>Sign in to continue.</p>
          <button onClick={() => login()}>Sign In</button>
        </div>
      </CarbonProviders>
    );
  }

  return <>{children}</>;
}
