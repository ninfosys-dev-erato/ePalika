import React from "react";
import { CarbonProviders, FlexGrid, Row, Column } from "@egov/ui";
import { useUIStore } from "@egov/state-core";
import styles from "./GateLayout.module.scss";

interface GateLayoutProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function GateLayout({
  title,
  description,
  children,
  className,
}: GateLayoutProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <CarbonProviders theme={theme}>
      <FlexGrid
        fullWidth
        className={`${styles["gate-layout"]} ${className || ""}`}
      >
        <Row>
          <Column sm={4} md={16} lg={16} xlg={16}>
            <div className={styles["gate-layout__container"]}>
              {title && (
                <h1 className={styles["gate-layout__title"]}>{title}</h1>
              )}
              {description && (
                <p className={styles["gate-layout__description"]}>
                  {description}
                </p>
              )}
              {children}
            </div>
          </Column>
        </Row>
      </FlexGrid>
    </CarbonProviders>
  );
}
