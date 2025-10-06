import React from "react";
import { GateLayout, Button } from "@egov/ui";
import { ArrowRight } from "@egov/icons";
import styles from "./LoginGate.module.scss";

export function LoginGate({ onLogin }: { onLogin: () => void }) {
  return (
    <GateLayout
      title="Session Required"
      description="You need to sign in to continue."
    >
      <Button
        kind="primary"
        size="lg"
        renderIcon={ArrowRight}
        iconDescription="Sign in"
        onClick={onLogin}
        className={styles["login-gate__button"]}
      >
        Sign in
      </Button>
    </GateLayout>
  );
}
