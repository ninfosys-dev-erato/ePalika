import React from "react";
import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ApolloProviderWrapper } from "./ApolloProvider";

/**
 * Enterprise composition:
 * - Auth → ensures valid session or shows LoginGate
 * - Theme → Carbon/Tokens; can be overridden by shell if needed
 * - Apollo → GraphQL client factory (mode-aware)
 * - Query → react-query client + persistence
 */
export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
      </ThemeProvider>
    </AuthProvider>
  );
}
