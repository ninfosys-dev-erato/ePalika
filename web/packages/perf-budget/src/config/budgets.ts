/**
 * Performance Budget Configuration
 * STRICT budgets for mobile-first Darta-Chalani system
 */

export interface BundleBudget {
  /** File path pattern (glob) */
  path: string
  /** Max size in bytes (gzipped) */
  maxSize: number
  /** Warning threshold (80% of max) */
  warnSize?: number
}

export interface PerformanceBudget {
  /** Initial JavaScript bundle (shell) */
  initialJS: number
  /** Initial CSS */
  initialCSS: number
  /** Vendor chunks */
  vendor: number
  /** Route chunks */
  route: number
  /** Async chunks */
  async: number
  /** Images */
  image: number
  /** Fonts */
  font: number
}

/**
 * STRICT Performance Budgets (all gzipped)
 */
export const PERFORMANCE_BUDGETS: PerformanceBudget = {
  // Initial JS (shell) ≤ 160 KB gzipped
  initialJS: 160 * 1024,

  // CSS ≤ 35 KB gzipped
  initialCSS: 35 * 1024,

  // Vendor chunks ≤ 100 KB each
  vendor: 100 * 1024,

  // Route chunks ≤ 50 KB each
  route: 50 * 1024,

  // Async chunks ≤ 30 KB each
  async: 30 * 1024,

  // Images ≤ 100 KB each
  image: 100 * 1024,

  // Fonts ≤ 50 KB each
  font: 50 * 1024,
}

/**
 * Bundle-specific budgets
 */
export const BUNDLE_BUDGETS: BundleBudget[] = [
  // Shell app
  {
    path: 'dist/assets/index-*.js',
    maxSize: PERFORMANCE_BUDGETS.initialJS,
  },
  {
    path: 'dist/assets/index-*.css',
    maxSize: PERFORMANCE_BUDGETS.initialCSS,
  },

  // Vendor chunks
  {
    path: 'dist/assets/vendor-*.js',
    maxSize: PERFORMANCE_BUDGETS.vendor,
  },
  {
    path: 'dist/assets/apollo-*.js',
    maxSize: PERFORMANCE_BUDGETS.vendor,
  },
  {
    path: 'dist/assets/tanstack-*.js',
    maxSize: PERFORMANCE_BUDGETS.vendor,
  },

  // MFE remotes
  {
    path: 'dist/assets/mfe-darta-*.js',
    maxSize: PERFORMANCE_BUDGETS.route,
  },
  {
    path: 'dist/assets/mfe-chalani-*.js',
    maxSize: PERFORMANCE_BUDGETS.route,
  },
  {
    path: 'dist/assets/mfe-registry-*.js',
    maxSize: PERFORMANCE_BUDGETS.route,
  },

  // Images
  {
    path: 'dist/assets/*.{png,jpg,jpeg,webp}',
    maxSize: PERFORMANCE_BUDGETS.image,
  },

  // Fonts
  {
    path: 'dist/assets/*.{woff,woff2}',
    maxSize: PERFORMANCE_BUDGETS.font,
  },
]

/**
 * Web Vitals Targets
 */
export const WEB_VITALS_BUDGETS = {
  // First Contentful Paint
  FCP: 1200, // < 1.2s

  // Time to Interactive
  TTI: 1800, // < 1.8s

  // Largest Contentful Paint
  LCP: 2500, // < 2.5s (good)

  // Cumulative Layout Shift
  CLS: 0.1, // < 0.1 (good)

  // First Input Delay
  FID: 100, // < 100ms (good)

  // Total Blocking Time
  TBT: 200, // < 200ms (good)
}

/**
 * Route transition budgets
 */
export const ROUTE_BUDGETS = {
  // Route-to-route (cached) < 150ms
  cached: 150,

  // Route-to-route (uncached) < 500ms
  uncached: 500,
}

/**
 * GraphQL budgets
 */
export const GRAPHQL_BUDGETS = {
  // p95 < 200ms (edge-proxied)
  p95: 200,

  // p99 < 500ms
  p99: 500,
}

/**
 * Budget enforcement mode
 */
export type BudgetMode = 'error' | 'warn' | 'off'

export const BUDGET_MODE: BudgetMode = process.env.CI === 'true' ? 'error' : 'warn'
