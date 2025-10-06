import React, { useEffect, useState } from "react";
import { readRuntimeEnv } from "../config/env";
import { resolveRuntimeFlags } from "../config/mode";
import { LoginGate } from "./pages/LoginGate/LoginGate";
import { LoadingGate } from "./pages/LoadingIdentity/LoadingIdentity";

/**
 * We rely on @egov/auth's unified API (adapters: LIVE, SIMULATED).
 */
import { initAuth, isAuthenticated, login } from "@egov/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

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

      // Show loading spinner for at least 800ms for smooth UX
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 800));
      await minLoadingTime;

      if (alive) {
        setAuthenticated(isAuth);
        setReady(true);
        // Delay hiding loading to allow for smooth transition
        setTimeout(() => setShowLoading(false), 100);
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

  // Show loading gate during initialization
  if (!ready || showLoading) {
    return <LoadingGate title="Please wait" description="Initializing identity…" />;
  }

  // Show login gate if not authenticated
  if (!authenticated) {
    return <LoginGate onLogin={handleLogin} />;
  }

  // Show children if authenticated
  return <>{children}</>;
}
