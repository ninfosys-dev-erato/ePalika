import React from "react";
import { GateLayout, InlineLoading } from "@egov/ui";

export function LoadingGate({
  description = "Initializing identity…",
  title = "Please wait…",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <GateLayout title={title}>
      <InlineLoading
        description={description}
        iconDescription="Loading"
        status="active"
      />
    </GateLayout>
  );
}
