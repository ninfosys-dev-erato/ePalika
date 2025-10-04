# @egov/perf-budget

Performance budget enforcement for the Darta-Chalani system.

## 📊 Strict Budgets

All sizes are **gzipped**:

- **Initial JS (shell)**: ≤ 160 KB
- **CSS**: ≤ 35 KB
- **Vendor chunks**: ≤ 100 KB each
- **Route chunks**: ≤ 50 KB each
- **Async chunks**: ≤ 30 KB each

### Web Vitals Targets

- **FCP** (First Contentful Paint): < 1.2s
- **TTI** (Time to Interactive): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **Route-to-route** (cached): < 150ms
- **GraphQL p95** (edge-proxied): < 200ms

## 🚀 Usage

### Vite Plugin

```typescript
// vite.config.ts
import { perfBudgetPlugin } from '@egov/perf-budget/vite-plugin'

export default defineConfig({
  plugins: [
    perfBudgetPlugin({
      distPath: 'dist',
      mode: 'error', // 'error' | 'warn' | 'off'
      verbose: true,
    }),
  ],
})
```

### CLI Analysis

```bash
# Analyze bundle sizes
pnpm analyze

# Validate against budgets
pnpm validate
```

### Programmatic API

```typescript
import { analyzeBundles, formatBundleReport } from '@egov/perf-budget'

const report = await analyzeBundles('./dist')
console.log(formatBundleReport(report))

if (!report.passed) {
  throw new Error('Budget exceeded!')
}
```

## 📝 Budget Configuration

Edit [`src/config/budgets.ts`](./src/config/budgets.ts) to customize:

```typescript
export const PERFORMANCE_BUDGETS = {
  initialJS: 160 * 1024,  // 160 KB
  initialCSS: 35 * 1024,  // 35 KB
  vendor: 100 * 1024,     // 100 KB
  route: 50 * 1024,       // 50 KB
  async: 30 * 1024,       // 30 KB
}
```

## 🎯 Output Example

```
📊 Bundle Size Analysis
────────────────────────────────────────────────────────────────────────────────

Total Size: 450 KB (180 KB gzipped)
Bundles: 5
Violations: 0
Warnings: 1

⚠️  Warnings (>80% of budget):

  assets/index-abc123.js
    Size: 145 KB / 160 KB (90.6%)

✅ All bundles within budget!
────────────────────────────────────────────────────────────────────────────────
```

## 🔧 CI/CD Integration

The plugin automatically switches to **error mode** in CI:

```bash
# In CI (fails build if budget exceeded)
CI=true pnpm build

# Local development (warns only)
pnpm build
```

## 📦 What's Analyzed

- **JS bundles** - Entry, vendors, routes, async chunks
- **CSS bundles** - Main stylesheet, component styles
- **Assets** - Images, fonts
- **Federation** - Remote entry points

## 🎨 Features

- ✅ Gzipped size analysis
- ✅ Per-bundle budgets
- ✅ Warning thresholds (80%)
- ✅ Colored terminal output
- ✅ CI/CD integration
- ✅ Glob pattern matching
- ✅ Detailed violation reports
