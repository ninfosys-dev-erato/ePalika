export async function buildSimulatedSchema() {
  const { makeExecutableSchema } = await import("@graphql-tools/schema");

  // 1) Prefer your real SDL from @egov/api-schema, if present
  let typeDefs: any | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore allow optional dep at app level
    ({ typeDefs } = await import("@egov/api-schema"));
  } catch {
    typeDefs = /* GraphQL */ `
      type Query {
        _health: String!
      }
    `;
  }

  // 2) Prefer explicit mock resolvers if available
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore optional
    const { resolvers } = await import("@egov/mock-db");
    return makeExecutableSchema({ typeDefs, resolvers });
  } catch {
    // 3) Auto-mock fallback
    const { addMocksToSchema } = await import("@graphql-tools/mock");
    const schema = makeExecutableSchema({ typeDefs });
    return addMocksToSchema({
      schema,
      preserveResolvers: false,
      mocks: {
        String: () => "—",
        Int: () => 1,
        Boolean: () => true,
      },
    });
  }
}
