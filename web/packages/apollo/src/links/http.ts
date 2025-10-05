import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { sha256 } from "js-sha256";

export type HttpClientOpts = {
  url: string;
  getAuthHeader?: () => Record<string, string> | undefined;
  devTools?: boolean;
};

export function makeHttpApolloClient({
  url,
  getAuthHeader,
  devTools,
}: HttpClientOpts) {
  const retry = new RetryLink({
    attempts: { max: 2, retryIf: (error) => !!error },
    delay: { initial: 150, max: 600, jitter: true },
  });

  const apq = createPersistedQueryLink({
    sha256: (q: string) => sha256(q),
    useGETForHashedQueries: false, // keep POST; auth headers break shared caches
  });

  const batch = new BatchHttpLink({
    uri: url,
    batchMax: 12,
    batchInterval: 10,
    fetch: (input, init) =>
      fetch(input as any, {
        ...init,
        headers: { ...(init?.headers || {}), ...(getAuthHeader?.() || {}) },
      }),
  });

  const cache = new InMemoryCache({
    typePolicies: {
      Query: { fields: {} },
    },
  });

  return new ApolloClient({
    link: from([retry, apq, batch]),
    cache,
    defaultOptions: {
      query: { fetchPolicy: "cache-first" },
      watchQuery: { fetchPolicy: "cache-first" },
    },
  });
}
