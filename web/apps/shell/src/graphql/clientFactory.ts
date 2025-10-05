/**
 * ---------------------------------------------------------------------------
 * 🏢 ePalika GraphQL Client Factory — Enterprise Integration Layer
 * ---------------------------------------------------------------------------
 * Provides a single seam for all ApolloClient instances across MFEs.
 *
 * ✅ REAL MODE → Delegates to @egov/apollo (Batch + Retry + Persisted Query)
 * ✅ MOCK MODE → Builds SchemaLink with @egov/api-schema + @egov/mock-db
 *
 * Mode resolution order:
 *   1️⃣ URL param ?mode=real|mock
 *   2️⃣ Env var   VITE_GRAPHQL_MODE   (default: MOCK)
 * ---------------------------------------------------------------------------
 */

import { SchemaLink } from "@apollo/client/link/schema";
import { makeApolloClient } from "@egov/apollo";
import { buildMockSchema } from "./schemaLink";

const GRAPHQL_MODE =
  new URLSearchParams(window.location.search).get("mode")?.toUpperCase() ||
  import.meta.env.VITE_GRAPHQL_MODE?.toUpperCase() ||
  "MOCK";

const GRAPHQL_HTTP_URL =
  import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql";

/**
 * Creates an ApolloClient configured for the selected mode.
 */
export function createApolloClient() {
  const start = performance.now();
  console.groupCollapsed("🔧 [Apollo Factory] GraphQL Client Bootstrap");
  console.info(`🧩 Mode        : ${GRAPHQL_MODE}`);
  console.info(`🌐 Endpoint    : ${GRAPHQL_HTTP_URL}`);

  let client;

  if (GRAPHQL_MODE === "REAL") {
    console.info("🚀 Using REAL mode → HTTPLink stack via @egov/apollo");
    client = makeApolloClient({
      url: GRAPHQL_HTTP_URL,
    });
  } else {
    console.info("🧪 Using MOCK mode → SchemaLink (In-Memory GraphQL)");
    const schema = buildMockSchema();
    client = makeApolloClient({
      url: "mock://local-schema", // not used, but placeholder
      getAuthHeader: undefined,
    });
    // Swap link to SchemaLink
    (client as any).setLink(new SchemaLink({ schema }));
  }

  console.info(
    `✅ Apollo Client ready in ${(performance.now() - start).toFixed(2)} ms`
  );
  console.groupEnd();

  return client;
}
