import * as React from "react";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";

// Screens (implementations can be simple stubs to start)
// import { DispatchQueue } from "../features/dispatch/DispatchQueue";
import { ChalaniCompose } from "../features/compose/ChalaniCompose";
// import { Drafts } from "../features/drafts/Drafts";
// import { Sent } from "../features/sent/Sent";
// import { ChalaniDetail } from "../features/detail/ChalaniDetail";

function AppLayout() {
  return (
    <div className="chalani-app-layout">
      {/* Add topbar/breadcrumbs if you want */}
      <div className="chalani-body">
        <Outlet />
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  //component: DispatchQueue,
  component: () => <div>Welcome to ePalika Chalani Module</div>,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "compose",
  component: ChalaniCompose,
});

const draftsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "drafts",
  // component: Drafts,
  component: () => <div>Drafts</div>,
});

const sentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "sent",
  component: () => <div>Sent</div>,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "detail/$chalaniId",
  // component: ChalaniDetail,
  component: () => <div>Chalani Detail</div>,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => <div>Not Found</div>,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  composeRoute,
  draftsRoute,
  sentRoute,
  detailRoute,
  notFoundRoute,
]);

/** Standalone router factory so we can set basepath from env */
export function createStandaloneRouter() {
  const basepath = import.meta.env.VITE_BASE_PATH || "/";
  return createRouter({ routeTree, basepath });
}

// tanstack expects global declaration for type safety (optional)
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createStandaloneRouter>;
  }
}

export function StandaloneRouterProvider() {
  const router = React.useMemo(() => createStandaloneRouter(), []);
  return <RouterProvider router={router} />;
}

// Re-export for rootRoute <Outlet />
export { Outlet } from "@tanstack/react-router";
