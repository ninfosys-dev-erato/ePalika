import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import { RuntimeProvider } from "@egov/runtime";
import { StandaloneRouterProvider } from "./routing/routeTree";

if (import.meta.env.DEV) {
  // Ensure you have `sass` installed; this import is dev-only for speed
  import("@egov/design-system/styles.scss");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RuntimeProvider>
      <StandaloneRouterProvider />
    </RuntimeProvider>
  </React.StrictMode>
);
