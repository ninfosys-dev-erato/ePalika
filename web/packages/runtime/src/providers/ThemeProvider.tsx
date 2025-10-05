import React from "react";
import { CarbonProviders } from "@egov/ui";
import { useUIStore } from "@egov/state-core";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  return <CarbonProviders theme={theme}>{children}</CarbonProviders>;
}
