import React, { useEffect, useState } from "react";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@egov/apollo";
import { resolveRuntimeFlags } from "../config/mode";

export function ApolloProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] =
    useState<null | ApolloClient<NormalizedCacheObject>>(null);
  const flags = resolveRuntimeFlags();

  useEffect(() => {
    createApolloClient().then((c) => {
      console.info("🌐 [Runtime/GraphQL] Mode:", flags.graphql);
      setClient(c);
    });
  }, [flags.graphql]);

  if (!client) return null; // or a loading spinner

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
