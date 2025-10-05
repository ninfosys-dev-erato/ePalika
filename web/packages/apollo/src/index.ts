import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { CreateClientOptions } from "./types";
import { resolveMode, resolveUrl, isDevToolsEnabled } from "./utils/env";

/**
 * New: createApolloClient — chooses simulated|federated automatically.
 */
export async function createApolloClient(
  options: CreateClientOptions = {}
): Promise<ApolloClient<NormalizedCacheObject>> {
  const mode = resolveMode();
  const url = options.url || resolveUrl();
  const devTools = options.devTools ?? isDevToolsEnabled();
  const getAuthHeader = options.getAuthHeader ?? (() => undefined);

  if (mode === "live") {
    const { LiveGraphQLAdapter } = await import("./adapters/live");
    const adapter = new LiveGraphQLAdapter();
    return adapter.createClient({ url, devTools, getAuthHeader });
  } else {
    const { SimulatedGraphQLAdapter } = await import("./adapters/simulated");
    const adapter = new SimulatedGraphQLAdapter();
    // url is ignored in simulated mode but kept for uniform shape
    return adapter.createClient({ url, devTools, getAuthHeader });
  }
}

/**
 * Legacy: makeApolloClient — direct HTTP (federated only).
 * Kept for backwards compatibility; prefer createApolloClient.
 */
export { makeHttpApolloClient as makeApolloClient } from "./links/http";

// Re-export types
export type { CreateClientOptions } from "./types";
