import React from "react";
import {
  CarbonProviders,
  FlexGrid,
  Row,
  Column,
  InlineLoading,
} from "@egov/ui";
import { useUIStore } from "@egov/state-core";
import styles from "./LoadingGate.module.scss";

export function LoadingGate({
  description = "Initializing identity…",
  title = "Please wait",
}: {
  description?: string;
  title?: string;
}) {
  const theme = useUIStore((s) => s.theme);

  return (
    <CarbonProviders theme={theme}>
      <FlexGrid fullWidth className={styles["loading-gate"]}>
        <Row>
          <Column sm={4} md={8} lg={8} xlg={8}>
            <div className={styles["loading-gate__container"]}>
              <h1 className={styles["loading-gate__title"]}>{title}</h1>
              <p className={styles["loading-gate__description"]}>
                {description}
              </p>
              <InlineLoading
                description={description}
                iconDescription="Loading"
                status="active"
              />
            </div>
          </Column>
        </Row>
      </FlexGrid>
    </CarbonProviders>
  );
}
