export type RuntimeFlags = {
  /** Auth mode, aligned with @egov/auth adapters */
  auth: "LIVE" | "SIMULATED";
  /** GraphQL mode, aligned with @egov/graphql-client */
  graphql: "LIVE" | "SIMULATED";
};

export type KeycloakEnv = {
  url: string;
  realm: string;
  clientId: string;
  silentCheckSsoRedirectUri: string;
  autoLogin?: boolean;
};

export type GraphQLEnv = {
  url: string; // gateway http(s) endpoint when remote
};

export type RuntimeEnv = {
  keycloak?: KeycloakEnv;
  graphql?: GraphQLEnv;
};
