import React from "react";
import styles from "./LoginGate.module.scss";
import { CarbonProviders, FlexGrid, Row, Column, Button } from "@egov/ui";
import { useUIStore } from "@egov/state-core";
import { ArrowRight } from "@egov/icons";

export function LoginGate({ onLogin }: { onLogin: () => void }) {
  const theme = useUIStore((s) => s.theme);

  return (
    <CarbonProviders theme={theme}>
      <FlexGrid fullWidth className={styles["login-gate"]}>
        <Row>
          <Column sm={4} md={16} lg={16} xlg={16}>
            <div className={styles["login-gate__container"]}>
              <h1 className={styles["login-gate__title"]}>Session Required</h1>
              <p className={styles["login-gate__description"]}>
                You need to sign in to continue.
              </p>
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
            </div>
          </Column>
        </Row>
      </FlexGrid>
    </CarbonProviders>
  );
}
