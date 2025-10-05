import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@egov/api-schema";
import { resolvers } from "@egov/mock-db";

export function buildMockSchema() {
  return makeExecutableSchema({ typeDefs, resolvers });
}
