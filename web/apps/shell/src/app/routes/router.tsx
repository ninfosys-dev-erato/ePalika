import { createRootRoute, createRoute, createRouter, RouterProvider, Link, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { DartaIntakePage, DartaListPage, DartaTriagePage } from '../../routes/darta'

function prefetchDarta() {
  // Preload MFE remoteEntry when user intends to navigate
  const fn = (window as any).__prefetch_darta__
  if (typeof fn === 'function') fn()
}

const Root = createRootRoute({
  component: () => (
    <div className="app">
      <nav style={{ padding: '1rem', background: '#f4f4f4', display: 'flex', gap: '1rem' }}>
        <Link to="/" preload="intent" style={{ textDecoration: 'none', color: '#dc2626' }}>गृह</Link>
        <Link to="/darta" preload="intent" onMouseEnter={prefetchDarta} onFocus={prefetchDarta} style={{ textDecoration: 'none', color: '#dc2626' }}>दर्ता सूची</Link>
        <Link to="/darta/triage" preload="intent" onMouseEnter={prefetchDarta} onFocus={prefetchDarta} style={{ textDecoration: 'none', color: '#dc2626' }}>त्रायज</Link>
        <Link to="/darta/new" preload="intent" onMouseEnter={prefetchDarta} onFocus={prefetchDarta} style={{ textDecoration: 'none', color: '#dc2626' }}>नयाँ दर्ता</Link>
      </nav>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>लोड हुँदैछ...</div>}>
        <Outlet />
      </Suspense>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div style={{ padding: '2rem', color: '#dc2626' }}>
      <h2>त्रुटि</h2>
      <p>माफ गर्नुहोस्, केही गलत भयो।</p>
      <details style={{ marginTop: '1rem', padding: '1rem', background: '#fee', borderRadius: '4px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>त्रुटि विवरण</summary>
        <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem', overflow: 'auto' }}>
          {error.message || String(error)}
        </pre>
      </details>
      <Link to="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#dc2626' }}>
        गृह पृष्ठमा फर्कनुहोस्
      </Link>
    </div>
  ),
})

const Home = createRoute({
  getParentRoute: () => Root,
  path: '/',
  component: () => (
    <div style={{ padding: '2rem' }}>
      <h1>ePalika दर्ता-चलानी प्रणाली</h1>
      <p>Welcome to the shell application</p>
    </div>
  ),
})

const DartaList = createRoute({
  getParentRoute: () => Root,
  path: '/darta',
  component: DartaListPage,
})

const DartaNew = createRoute({
  getParentRoute: () => Root,
  path: '/darta/new',
  component: DartaIntakePage,
})

const DartaTriage = createRoute({
  getParentRoute: () => Root,
  path: '/darta/triage',
  component: DartaTriagePage,
})

const routeTree = Root.addChildren([Home, DartaList, DartaTriage, DartaNew])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

export function AppRouter() { return <RouterProvider router={router} /> }
