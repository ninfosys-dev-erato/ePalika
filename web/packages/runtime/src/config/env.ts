import type { RuntimeEnv } from "../types";

/**
 * Reads environment in a framework-agnostic way (Vite, Rspack, Webpack).
 * Unsafe access guarded by optional chaining to avoid SSR crashes.
 */
export function readRuntimeEnv(): RuntimeEnv {
  const loc = typeof window !== "undefined" ? window.location : { origin: "" };

  return {
    keycloak: {
      url: (import.meta as any)?.env?.VITE_KEYCLOAK_URL ?? "",
      realm: (import.meta as any)?.env?.VITE_KEYCLOAK_REALM ?? "",
      clientId: (import.meta as any)?.env?.VITE_KEYCLOAK_CLIENT_ID ?? "",
      silentCheckSsoRedirectUri: `${loc.origin}/silent-check-sso.html`,
      autoLogin:
        ((import.meta as any)?.env?.VITE_AUTH_AUTO_LOGIN ?? "false") === "true",
    },
    graphql: {
      url:
        (import.meta as any)?.env?.VITE_GRAPHQL_HTTP_URL ??
        "http://localhost:4000/graphql",
    },
  };
}
