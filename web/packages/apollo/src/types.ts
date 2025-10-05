import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";

export type GraphQLMode = "simulated" | "federated";

export type CreateClientOptions = {
  /** HTTP endpoint for federated mode */
  url?: string;
  /** Attach Authorization header synchronously */
  getAuthHeader?: () => Record<string, string> | undefined;
  /** Enable Apollo DevTools in browsers */
  devTools?: boolean;
};

export interface GraphQLAdapter {
  createClient(opts: Required<CreateClientOptions>): Promise<ApolloClient>;
}
