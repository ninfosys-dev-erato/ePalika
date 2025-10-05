import type { GraphQLAdapter, CreateClientOptions } from "../types";
import { makeHttpApolloClient } from "../links/http";

export class LiveGraphQLAdapter implements GraphQLAdapter {
  async createClient(opts: Required<CreateClientOptions>) {
    return makeHttpApolloClient({
      url: opts.url,
      getAuthHeader: opts.getAuthHeader,
      devTools: opts.devTools,
    });
  }
}
