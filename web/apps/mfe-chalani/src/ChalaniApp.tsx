import * as React from "react";
import { Outlet } from "./routing/routeTree";

/**
 * Pure UI surface (no router/provider here).
 * Shell will mount this, and in standalone we wrap it with providers+router.
 */
export default function ChalaniApp() {
  return <Outlet />;
}
