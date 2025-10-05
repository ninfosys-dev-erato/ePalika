import type { GraphQLAdapter, CreateClientOptions } from "../types";

export class SimulatedGraphQLAdapter implements GraphQLAdapter {
  async createClient(opts: Required<CreateClientOptions>) {
    const { ApolloClient, InMemoryCache } = await import("@apollo/client");
    const { SchemaLink } = await import("@apollo/client/link/schema");
    const { buildSimulatedSchema } = await import("../schema/simulated");

    const schema = await buildSimulatedSchema();
    const link = new SchemaLink({
      schema,
      context: async () => ({ headers: opts.getAuthHeader?.() || {} }),
    });

    return new ApolloClient({
      link,
      cache: new InMemoryCache(),
      connectToDevTools: !!opts.devTools,
      defaultOptions: {
        query: { fetchPolicy: "cache-first" },
        watchQuery: { fetchPolicy: "cache-first" },
      },
    });
  }
}
