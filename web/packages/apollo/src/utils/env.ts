import { isBrowser } from "./isBrowser";
import type { GraphQLMode } from "../types";

function readEnv(name: string): string | undefined {
  // Vite
  // @ts-ignore: Vite defines import.meta.env at compile time in apps
  const viteVal =
    typeof import.meta !== "undefined" && (import.meta as any).env?.[name];
  if (viteVal != null) return String(viteVal);
  // Node/SSR fallback
  if (typeof process !== "undefined" && (process as any).env) {
    const v = (process as any).env[name];
    if (v != null) return String(v);
  }
  return undefined;
}

export function resolveMode(): GraphQLMode {
  let fromQuery: string | null = null;
  if (isBrowser) {
    const sp = new URLSearchParams(window.location.search);
    fromQuery = (sp.get("gql") || sp.get("mode"))?.toLowerCase() || null;
  }
  const fromEnv = (
    readEnv("VITE_GRAPHQL_ADAPTER") ||
    readEnv("GRAPHQL_ADAPTER") ||
    "simulated"
  ).toLowerCase();
  const v = (fromQuery || fromEnv) as GraphQLMode;
  return v === "federated" ? "federated" : "simulated";
}

export function resolveUrl(): string {
  return (
    readEnv("VITE_GRAPHQL_HTTP_URL") ||
    readEnv("GRAPHQL_HTTP_URL") ||
    "http://localhost:4000/graphql"
  );
}

export function isDevToolsEnabled(): boolean {
  // Vite/dev or generic NODE_ENV check
  // @ts-ignore
  const viteDev =
    typeof import.meta !== "undefined" && !!(import.meta as any).env?.DEV;
  const nodeDev =
    typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
  return !!(viteDev || nodeDev);
}
