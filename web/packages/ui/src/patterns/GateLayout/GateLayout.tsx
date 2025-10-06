import React from "react";
import { CarbonProviders, FlexGrid, Row, Column } from "@egov/ui";
import { useUIStore } from "@egov/state-core";
import styles from "./GateLayout.module.scss";

interface GateLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function GateLayout({ children, className }: GateLayoutProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <CarbonProviders theme={theme}>
      <FlexGrid
        fullWidth
        className={`${styles["gate-layout"]} ${className || ""}`}
      >
        <Row>
          <Column sm={4} md={8} lg={8} xlg={8}>
            <div className={styles["gate-layout__container"]}>{children}</div>
          </Column>
        </Row>
      </FlexGrid>
    </CarbonProviders>
  );
}
