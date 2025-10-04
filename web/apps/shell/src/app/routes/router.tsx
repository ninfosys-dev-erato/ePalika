import { createRootRoute, createRoute, createRouter, RouterProvider, Link, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

function prefetchDarta() {
  // Preload data (and later: remoteEntry) when user intends to navigate
  const fn = (window as any).__prefetch_darta__
  if (typeof fn === 'function') fn()
}

const Root = createRootRoute({
  component: () => (
    <div className="app">
      <nav>
        <Link to="/" preload="intent">Home</Link>
        <Link to="/darta" preload="intent" onMouseEnter={prefetchDarta} onFocus={prefetchDarta}>Darta</Link>
      </nav>
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </div>
  ),
})

const Home = createRoute({
  getParentRoute: () => Root,
  path: '/',
  component: () => <div>Welcome — shell is live.</div>,
})

const Darta = createRoute({
  getParentRoute: () => Root,
  path: '/darta',
  // When loaders are enabled, we can also preload here.
  // loader: async ({ context }) => { await (window as any).__prefetch_darta__?.() },
  component: () => <div>Darta module (stub)</div>,
})

const routeTree = Root.addChildren([Home, Darta])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

export function AppRouter() { return <RouterProvider router={router} /> }
