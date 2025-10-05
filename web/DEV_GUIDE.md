# Development Guide - ePalika Darta-Chalani System

**Enterprise-grade, Mobile-first, Micro-Frontend Architecture**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommend 20.x)
- pnpm 8+
- Docker & Docker Compose (for Keycloak/OpenFGA)

### First Time Setup

```bash
# 1. Clone the repository
cd web/

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp apps/shell/.env.example apps/shell/.env

# 4. Start Keycloak (optional, for auth testing)
# From the repository root:
cd dev/keycloak-dev
docker-compose up -d

# 5. Build all packages
pnpm build

# 6. Start development servers
# Terminal 1 - Shell app
cd apps/shell
pnpm dev
# → http://localhost:5200

# Terminal 2 - Darta MFE
cd apps/mfe-darta
pnpm dev
# → http://localhost:5201
```

### Development Workflow

```bash
# Run type checking across all packages
pnpm typecheck

# Build all packages
pnpm build

# Build specific package
pnpm --filter @egov/shell build

# Run GraphQL codegen
cd packages/graphql-schema
pnpm codegen
```

## 🏗️ Architecture Overview

### Workspace Structure

```
web/
├── apps/
│   ├── shell/              # Main shell app (port 5200)
│   └── mfe-darta/          # Darta intake MFE (port 5201)
├── packages/
│   ├── apollo/             # Apollo Client config
│   ├── auth/               # Keycloak integration
│   ├── design-system/      # Carbon Design wrapper
│   ├── graphql-schema/     # Schema + types + MSW mocks
│   ├── perf-budget/        # Bundle size analyzer
│   ├── query/              # TanStack Query config
│   ├── state-core/         # Zustand stores
│   └── ui/          # Mobile-first components
└── tools/                  # Build tools
```

### Port Allocation

| App | Port | URL |
|-----|------|-----|
| Shell | 5200 | http://localhost:5200 |
| MFE-Darta | 5201 | http://localhost:5201 |
| MFE-Chalani | 5202 | http://localhost:5202 (future) |
| MFE-Registry | 5203 | http://localhost:5203 (future) |
| MFE-Audit | 5204 | http://localhost:5204 (future) |
| MFE-FY | 5205 | http://localhost:5205 (future) |
| Keycloak | 8080 | http://localhost:8080 |
| GraphQL API | 4000 | http://localhost:4000 (future) |

## 🎯 Module Federation

### How It Works

The shell app dynamically loads micro-frontends at runtime using Vite Module Federation:

```typescript
// apps/shell/vite.config.ts
remotes: {
  mfe_darta: 'http://localhost:5201/assets/remoteEntry.js'
}
```

Each MFE exposes specific components:

```typescript
// apps/mfe-darta/vite.config.ts
exposes: {
  './DartaIntake': './src/features/intake/DartaIntake',
  './DartaList': './src/features/list/DartaList',
}
```

Shell consumes them:

```typescript
// apps/shell/src/routes/darta.tsx
const DartaIntake = lazy(() =>
  import('mfe_darta/DartaIntake').then((m) => ({ default: m.DartaIntake }))
)
```

### Shared Dependencies

These libraries are loaded once by the shell and shared across all MFEs:

- ✅ React & React-DOM (singleton)
- ✅ Apollo Client (singleton)
- ✅ TanStack Query (singleton)
- ✅ TanStack Router (singleton)
- ✅ Zustand (singleton)

**Why singleton?** Ensures state management works correctly across MFE boundaries.

## 🗂️ State Management

### Zustand Stores

Located in `packages/state-core/src/stores/`:

1. **darta.store.ts** - Darta CRUD + draft persistence
2. **chalani.store.ts** - Chalani workflow + approvals
3. **ui.store.ts** - Global UI state (theme, toasts, bottom sheets)

### Usage Example

```typescript
import { useDartaStore, useUIStore } from '@egov/state-core'

function MyComponent() {
  const draft = useDartaStore((state) => state.draft)
  const setDraft = useDartaStore((state) => state.setDraft)
  const addToast = useUIStore((state) => state.addToast)

  const handleSave = () => {
    setDraft({ subject: 'नागरिकता सिफारिस' })
    addToast('सुरक्षित गरियो', 'success')
  }
}
```

### Persistence

Stores use `persist` middleware with IndexedDB:

```typescript
persist(
  immer((set) => ({ /* state */ })),
  { name: 'darta-store', partialize: (state) => ({ draft: state.draft }) }
)
```

**Persisted data:**
- Darta drafts
- Chalani drafts
- User preferences (theme)
- Filters

## 📊 GraphQL & Mocking

### Mock Service Worker (MSW)

Development mode uses MSW to mock GraphQL API:

```typescript
// packages/graphql-schema/src/mocks/handlers/darta.ts
export const dartaHandlers = [
  graphql.query('Dartas', ({ variables }) => {
    // Return mock data
    return HttpResponse.json({ data: { dartas: mockDartas } })
  })
]
```

**Mock data includes:**
- 50+ Darta fixtures with Nepali content
- 40+ Chalani fixtures
- Realistic applicant names, subjects, statuses

### GraphQL Code Generation

Schema → TypeScript types:

```bash
cd packages/graphql-schema
pnpm codegen
```

Generates:
- `src/generated/graphql.ts` - Types
- `src/generated/hooks.ts` - React hooks

Usage:

```typescript
import { useDartasQuery } from '@egov/graphql-schema'

const { data, loading } = useDartasQuery({
  variables: { filter: { scope: 'MUNICIPALITY' } }
})
```

## 🎨 UI Components

### Mobile-First Design Tokens

Located in `packages/ui/src/tokens/`:

```typescript
// Touch targets
touchTarget: {
  min: '44px',        // iOS/Android minimum
  comfortable: '48px'
}

// Colors
colors.primary[500] = '#dc2626'  // Nepal red
colors.secondary[500] = '#003893' // Nepal blue

// Font
fontFamily = 'Noto Sans Devanagari'
```

### Available Components

**Primitives:**
- `Button` - Touch-optimized with loading states
- More coming...

**Patterns:**
- `BottomSheet` - Swipe-to-dismiss modal
- More coming...

### Usage

```typescript
import { Button } from '@egov/ui/primitives/Button'

<Button variant="primary" size="large">
  दर्ता गर्नुहोस्
</Button>
```

## 📦 Performance Budgets

### Targets

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Initial JS | 160 KB | 4.38 KB | ✅ 97% headroom |
| Initial CSS | 35 KB | 21.04 KB | ✅ 40% headroom |
| FCP | < 1.2s | TBD | ⏳ Need Lighthouse |
| TTI | < 1.8s | TBD | ⏳ Need Lighthouse |

### Bundle Analysis

```bash
pnpm build
# Check dist/ folders for bundle sizes

# Or use analyzer (when re-enabled):
cd apps/shell
pnpm build --mode analyze
```

### Code Splitting Strategy

**Shell App:**
- `vendor-react-core` - React hooks (5.15 KB)
- `vendor-react-dom` - React renderer (82.70 KB)
- `vendor-state` - Zustand + Immer (4.24 KB)
- `vendor-apollo` - Apollo Client (separate)
- `vendor-graphql` - GraphQL runtime (11.31 KB)

**MFE Chunks:**
- Lazy loaded on route navigation
- Shared dependencies cached

## 🧪 Testing

### Type Checking

```bash
# All packages
pnpm typecheck

# Specific package
pnpm --filter @egov/mfe-darta typecheck
```

### Builds

```bash
# All packages (production)
pnpm build

# Development build
pnpm --filter @egov/shell dev
```

## 🚧 Common Issues

### Module Federation Errors

**Problem:** `Failed to fetch dynamically imported module`

**Solution:**
1. Ensure MFE dev server is running (e.g., port 5201)
2. Check browser console for CORS errors
3. Verify `remotes` URL in shell's `vite.config.ts`

### TypeScript Errors

**Problem:** `Cannot find module '@egov/package'`

**Solution:**
```bash
pnpm install
pnpm build
```

**Problem:** `Output file has not been built from source file`

**Solution:** Some packages need to be built first:
```bash
cd packages/graphql-schema
pnpm codegen
```

### State Not Persisting

**Problem:** Zustand state resets on refresh

**Solution:**
1. Check browser IndexedDB (DevTools → Application → IndexedDB)
2. Verify `persist` middleware in store definition
3. Check `partialize` config (only some fields are persisted)

## 📝 Code Style

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- CSS Modules: `ComponentName.module.css`

### Import Order

```typescript
// 1. React
import { useState } from 'react'

// 2. External libraries
import { motion } from 'framer-motion'

// 3. Internal packages
import { useDartaStore } from '@egov/state-core'

// 4. Relative imports
import { DartaCard } from './DartaCard'
import styles from './DartaList.module.css'
```

### Nepali Content

Use Nepali for user-facing strings:

```typescript
// ✅ Good
<label>विषय *</label>
addToast('दर्ता सफलतापूर्वक सुरक्षित गरियो', 'success')

// ❌ Avoid
<label>Subject *</label>
addToast('Darta saved successfully', 'success')
```

## 🔐 Authentication

### Keycloak Setup

```bash
cd dev/keycloak-dev
docker-compose up -d

# Access Keycloak admin
# URL: http://localhost:8080
# User: admin
# Pass: admin
```

### Environment Variables

```bash
# apps/shell/.env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=epalika
VITE_KEYCLOAK_CLIENT_ID=epalika-web
VITE_AUTH_AUTO_LOGIN=false  # Set to true for dev convenience
```

### Usage

```typescript
import { isAuthenticated, login, logout, getToken } from '@egov/auth'

if (!isAuthenticated()) {
  login()
}

const token = getToken()
```

## 🎯 Next Steps

### Current Sprint
1. ⏳ Test MFE integration in browser
2. ⏳ Add error boundaries for MFE failures
3. ⏳ Implement GraphQL mutations (createDarta)
4. ⏳ Add camera scanner (lazy loaded)
5. ⏳ Create mfe-chalani

### Backlog
- Offline queue for mutations
- PWA manifest + service worker
- Push notifications
- Biometric authentication
- Report generation (PDF)

## 📚 Additional Resources

- [Vite Module Federation Plugin](https://github.com/originjs/vite-plugin-federation)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TanStack Router](https://tanstack.com/router)
- [Carbon Design System](https://carbondesignsystem.com/)
- [MSW Documentation](https://mswjs.io/)

## 🆘 Getting Help

**Issues:** Check [SESSION_SUMMARY.md](SESSION_SUMMARY.md) and [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)

**Build errors:** Run `pnpm install && pnpm build` from workspace root

**Type errors:** Ensure all packages have been built at least once
