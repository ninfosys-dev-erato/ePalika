/// <reference types="../env.d.ts" />
import type { RuntimeFlags } from "../types";

/** Normalize uppercased string or fallback */
function norm(v?: string, fallback?: string) {
  return (v ?? fallback ?? "").toUpperCase();
}

/** Resolve runtime flags from URL params first, then env, then defaults. */
export function resolveRuntimeFlags(): RuntimeFlags {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);

  const authFromUrl = params.get("authMode");
  const gqlFromUrl = params.get("gqlMode");

  const authFromEnv = import.meta.env.VITE_AUTH_MODE;
  const gqlFromEnv = import.meta.env.VITE_GRAPHQL_MODE;

  const auth = ((): RuntimeFlags["auth"] => {
    const v = norm(authFromUrl, authFromEnv);
    if (v === "SIMULATED") return "SIMULATED";
    return "LIVE";
  })();

  const graphql = ((): RuntimeFlags["graphql"] => {
    const v = norm(gqlFromUrl, gqlFromEnv);
    if (v === "SIMULATED") return "SIMULATED";
    return "LIVE";
  })();

  return { auth, graphql };
}
