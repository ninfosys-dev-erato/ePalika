import React from "react";
import { CarbonProviders, Button } from "@egov/ui";
import { useUIStore } from "@egov/state-core";

export function LoginGate(props: { onLogin: () => void }) {
  const theme = useUIStore((s) => s.theme);
  return (
    <CarbonProviders theme={theme}>
      <div style={{ padding: 32, maxWidth: 560 }}>
        <h2>Session Required</h2>
        <p>You need to sign in to continue.</p>
        <Button onClick={props.onLogin}>Sign in</Button>
      </div>
    </CarbonProviders>
  );
}
