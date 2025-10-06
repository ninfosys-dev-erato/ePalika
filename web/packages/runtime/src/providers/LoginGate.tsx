import React from "react";
import { CarbonProviders, Button } from "@egov/ui";
import { useUIStore } from "@egov/state-core";
import { ArrowRight } from "@egov/icons";

export function LoginGate(props: { onLogin: () => void }) {
  const theme = useUIStore((s) => s.theme);
  return (
    <CarbonProviders theme={theme}>
      <div style={{ padding: 32, maxWidth: 560 }}>
        <h2>Session Required</h2>
        <p>You need to sign in to continue.</p>
        <Button
          renderIcon={ArrowRight}
          iconDescription="Sign in"
          onClick={props.onLogin}
        >
          Sign in
        </Button>
      </div>
    </CarbonProviders>
  );
}
