import React, { useEffect, useState } from "react";
import { readRuntimeEnv } from "../config/env";
import { resolveRuntimeFlags } from "../config/mode";
import { LoginGate } from "./LoginGate";

/**
 * We rely on @egov/auth's unified API (adapters: LIVE, SIMULATED).
 */
import { initAuth, isAuthenticated, login } from "@egov/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const env = readRuntimeEnv();
      const flags = resolveRuntimeFlags();

      console.groupCollapsed("🔐 [Runtime/Auth] Initialize");
      console.info("Mode:", flags.auth);
      console.info("Realm:", env.keycloak?.realm);
      console.groupEnd();

      await initAuth(env.keycloak!);
      const isAuth = await isAuthenticated();
      if (alive) {
        setAuthenticated(isAuth);
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleLogin = async () => {
    await login();
    const isAuth = await isAuthenticated();
    setAuthenticated(isAuth);
  };

  if (!ready)
    return <div style={{ padding: 16 }}>🔑 Initializing identity…</div>;
  if (!authenticated) return <LoginGate onLogin={handleLogin} />;

  return <>{children}</>;
}
