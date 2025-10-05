# Darta-Chalani Implementation Progress

## ✅ Phase 1: Foundation & Architecture (COMPLETED)

### 1.1 Architecture Design ✅
- [x] Comprehensive planning document ([DARTA_CHALANI_STRUCTURE.md](./DARTA_CHALANI_STRUCTURE.md))
- [x] Federated micro-frontend architecture
- [x] Domain-driven design with 5 core domains
- [x] ~350 files mapped in directory structure
- [x] Performance budgets defined (strict mobile-first)

### 1.2 GraphQL Schema Package ✅
**Location:** `packages/api-schema/`

- [x] Complete schema with 7 domains (Darta, Chalani, Numbering, Audit, FY, Actors, Common)
- [x] TypeScript types generated (18KB)
- [x] MSW mock service worker
- [x] Realistic fixtures (50+ Dartas, 40+ Chalanis, Nepali data)
- [x] Mock handlers (idempotent numbering, state management)
- [x] Package README with usage guide

**Key Files:**
- `src/schema/schema.graphql` - Main schema (600+ lines)
- `src/generated/graphql.ts` - Generated types
- `src/mocks/` - MSW handlers and fixtures

### 1.3 Performance Budget Tooling ✅
**Location:** `packages/perf-budget/`

- [x] Strict budget configuration
- [x] Vite plugin for build-time enforcement
- [x] Bundle size analyzer (gzipped)
- [x] CLI tools (analyze/validate)
- [x] CI/CD integration (auto error mode)
- [x] Colored terminal reports

**Budgets (all gzipped):**
- Initial JS (shell): ≤ 160 KB ✅
- CSS: ≤ 35 KB ✅
- Vendor chunks: ≤ 100 KB each ✅
- Route chunks: ≤ 50 KB each ✅
- FCP < 1.2s, TTI < 1.8s ✅

## ✅ Phase 2: UI Foundation & State Management (COMPLETED)

### 2.1 Mobile-First UI Package ✅
**Location:** `packages/ui/`

**Completed:**
- [x] Design tokens (colors, spacing, typography, motion, breakpoints)
- [x] Nepal Government branding (red #dc2626, blue #003893)
- [x] Touch targets (44px minimum for accessibility)
- [x] Nepali font support (Noto Sans Devanagari)
- [x] **Button component** with variants (primary, secondary, tertiary, ghost)
- [x] **Input component** with variants (default, outlined, filled)
  - [x] Label, error, and helper text support
  - [x] All input types (text, number, tel, email, etc.)
  - [x] Validation states with error messages
  - [x] Touch-optimized (44px min height)
- [x] **Select component** (native dropdown)
  - [x] Custom chevron icon
  - [x] Touch-optimized for mobile
  - [x] Nepali label support
- [x] **Card component** (reusable container)
  - [x] Multiple variants (default, outlined, elevated)
  - [x] Interactive mode with animations
  - [x] Header and footer slots
  - [x] Flexible padding options
- [x] BottomSheet pattern with swipe-to-dismiss
- [x] Framer Motion animations (60fps)
- [x] Camera & Document Upload patterns (lazy camera, touch-first upload)
- [x] Receipt pattern with PDF generator

**Key Files:**
- `src/tokens/` - Design system tokens
- `src/primitives/Button/` - Touch-optimized button
- `src/primitives/Input/` - Form input component
- `src/primitives/Select/` - Dropdown select component
- `src/primitives/Card/` - Container component
- `src/patterns/BottomSheet/` - TikTok-style modal

### 2.2 State Management Core ✅
**Location:** `packages/state-core/`

**Completed:**
- [x] Zustand stores (darta, chalani, ui)
- [x] IndexedDB persistence via idb-keyval
- [x] Immer middleware for immutable updates
- [x] Draft state persistence (survives refresh)
- [x] Toast notifications with auto-dismiss
- [x] Theme persistence
- [x] Shared state across MFEs (singleton pattern)

**Key Files:**
- `src/stores/darta.store.ts` - Darta CRUD + drafts
- `src/stores/chalani.store.ts` - Chalani workflow
- `src/stores/ui.store.ts` - Global UI state

## ✅ Phase 2.5: Development Experience (COMPLETED)

### 2.3 Single Dev Server Setup ✅
**What:** Enterprise pattern for unified development

**Completed:**
- [x] Concurrently orchestration (`pnpm dev` starts all)
- [x] Vite dev proxy for MFEs (WebSocket HMR)
- [x] Colored terminal output (SHELL=blue, DARTA=magenta)
- [x] Single URL development (localhost:5200)
- [x] Auto-reload across federation boundaries

**Key Files:**
- Root `package.json` - Dev scripts with concurrently
- `apps/shell/vite.config.ts` - Dev proxy configuration

### 2.4 Module Federation Integration ✅
**What:** Production-ready MFE architecture

**Completed:**
- [x] Shell app as federation host
- [x] MFE-Darta as remote (exposes components)
- [x] Shared dependencies (React, Zustand, Apollo)
- [x] Lazy loading with React.lazy()
- [x] Environment-aware URLs (dev vs prod)

**Key Files:**
- `apps/shell/src/routes/darta.tsx` - Remote component loader
- `apps/shell/src/app/routes/router.tsx` - TanStack Router setup

## 🚧 Phase 3: Core Features (IN PROGRESS)

### 3.1 Darta MFE (Partially Complete) 🔄
**Location:** `apps/mfe-darta/`

**Completed:**
- [x] MFE structure with Module Federation
- [x] DartaIntake component (form with Nepali labels)
- [x] DartaList component (animated cards)
- [x] Draft auto-save functionality
- [x] Toast notifications on submit
- [x] Touch-optimized inputs (44px)
- [x] Framer Motion animations
- [x] Routes: `/darta` (list) and `/darta/new` (intake)
- [x] **GraphQL Operations** (`packages/api-schema/src/operations/darta.graphql`)
  - [x] `Dartas` query with pagination
  - [x] `Darta` single query
  - [x] `CreateDarta` mutation
  - [x] `RouteDarta` mutation
- [x] **Generated TypeScript Hooks** (`packages/api-schema/src/generated/index.ts`)
  - [x] `useDartasQuery` - Fetch list with pagination
  - [x] `useCreateDartaMutation` - Create new darta
  - [x] All types and enums auto-generated
- [x] **DartaIntake GraphQL Integration**
  - [x] Form submission via `useCreateDartaMutation`
  - [x] Loading state ("सुरक्षित गर्दै..." text)
  - [x] Success toast with darta number
  - [x] Error handling with toast
  - [x] Draft clearing on success
- [x] **Camera & Document Upload Field**
  - [x] Lazy-loaded camera overlay with photo capture
  - [x] Document upload component with gallery + remove actions
  - [x] Draft persistence for attachments across reloads
  - [x] GraphQL submission wired with primary + annex IDs
  - [x] Native QR/Barcode detection with fallback messaging
- [x] **Digital Receipt Generation**
  - [x] Downloadable PDF receipt (A4, Nepali locale)
  - [x] Inline receipt preview with touch-first UI
  - [x] Mock service returns captured primary/annex metadata
- [x] **Triage Inbox Route**
  - [x] Filtered inbox with pending दर्ता सूची
  - [x] Route mutation wired with org-unit selection
  - [x] Notes + quick chips for department targeting
- [x] **DartaList GraphQL Integration**
  - [x] Data fetching via `useDartasQuery`
  - [x] Loading and error states
  - [x] Pagination ready (50 items per page)

**Next Steps:**
- [x] Camera scanner integration (lazy-loaded capture UI)
- [x] Document upload with photo capture
- [x] Receipt generation (PDF/print)
- [ ] Additional routes:
  - [x] `/triage` - Inbox, assign, route
  - [ ] `/review` - Workspace, decision, timeline
  - [ ] `/exceptions` - Backdate, void, corrections

### 3.2 Chalani MFE 📋
**Location:** `apps/mfe-chalani/`

**Completed:**
- [x] ChalaniCompose screen (drafted letter workflow)
  - [x] Offline draft persistence with Zustand store
  - [x] Attachment handling with image compression pipeline reuse

**Routes:**
- [x] `/compose` - Editor, templates, signatories
- [ ] `/approvals` - Pending, detail, delegation
- [ ] `/dispatch` - Channel, labels, tracking
- [ ] `/acknowledgement` - QR scan, closure

### 3.3 Registry MFE 📋
**Location:** `apps/mfe-registry/`

**Routes:**
- [ ] `/counters` - Number allocation, finalize
- [ ] `/registers` - Daily Darta/Chalani, exports

### 3.4 Audit MFE 📋
**Location:** `apps/mfe-audit/`

**Routes:**
- [ ] `/overview` - Dashboard, drill-down
- [ ] `/exceptions` - Weekly review, logs

### 3.5 Fiscal Year MFE 📋
**Location:** `apps/mfe-fy/`

**Routes:**
- [ ] `/planning` - Calendar, freeze windows
- [ ] `/rollover` - Runbook, validation, attestation

## 📋 Phase 4: Advanced Features (PLANNED)

### 4.1 Domain Packages 📋
- [ ] `domain-darta` - Entities, services, validators
- [ ] `domain-chalani` - Workflow logic
- [ ] `domain-numbering` - Counter client
- [ ] `domain-audit` - Compliance tracking
- [ ] `domain-fy` - Rollover orchestration

### 4.2 PWA & Offline 📋
- [ ] Service worker setup
- [ ] Offline sync strategy
- [ ] Background sync
- [ ] Cache-first networking
- [ ] Conflict resolution

### 4.3 OpenFGA Integration 📋
- [ ] Permission model
- [ ] Relation-based auth
- [ ] Scope enforcement (municipality/ward)
- [ ] Delegation support

## 📊 Current Stats

### Packages Created (10 total)
- ✅ `@egov/api-schema` (complete with types + mocks)
- ✅ `@egov/perf-budget` (complete with Vite plugin)
- ✅ `@egov/ui` (design tokens + components)
- ✅ `@egov/state-core` (Zustand stores)
- ✅ `@egov/apollo` (GraphQL client)
- ✅ `@egov/auth` (Keycloak integration)
- ✅ `@egov/query` (TanStack Query)
- ✅ `@egov/design-system` (Carbon wrapper)
- 📋 5 domain packages (planned)

### MFEs Status (6 total)
- ✅ `@egov/shell` (main app - complete)
- 🔄 `@egov/mfe-darta` (2 routes done, 3 more planned)
- 📋 `mfe-chalani` (4 routes planned)
- 📋 `mfe-registry` (2 routes planned)
- 📋 `mfe-audit` (2 routes planned)
- 📋 `mfe-fy` (3 routes planned)

### Files Created (~150+ files)
- **Architecture**: 8 comprehensive docs
- **GraphQL**: 1 schema + types + 4 handlers + 4 fixtures
- **Performance**: Budget config + analyzer + plugin
- **UI Mobile**: 15+ component files + tokens
- **State**: 3 stores + middleware
- **MFE-Darta**: 10+ feature files
- **Shell**: Routes + providers + config
- **Total**: 150+ production files

## 🎯 Next Immediate Steps

### Priority 1: More UI Components (Input, Select, Card)
1. **Input Component**
   - Text, number, tel, email variants
   - Nepali placeholder support
   - Validation states

2. **Select/Dropdown**
   - Touch-optimized options
   - Search capability
   - Multi-select support

3. **Card Component**
   - Reusable card layout
   - Various elevations
   - Click/tap animations

### Priority 3: Camera Scanner
1. **Scanner Component** (lazy loaded)
   - [x] Photo capture overlay
   - [x] QR code scanning (native `BarcodeDetector` with graceful fallback)
   - [x] Barcode scanning (common symbologies via `BarcodeDetector`)

2. **Document Upload**
   - [x] Gallery picker
   - [x] Image preview + removal
   - [x] Compression pipeline (client-side resize)

### Priority 4: Second MFE (Chalani)
1. **MFE Structure**
   - Similar to mfe-darta
   - Exposes ChalaniCompose, ChalaniList

2. **Basic Features**
   - Compose form
   - Approval workflow
   - Dispatch tracking

## 📝 Notes

- All packages use **strict TypeScript**
- **Mobile-first** design (360px baseline)
- **Offline-first** architecture
- **Performance budgets enforced** at build time
- **MSW mocks** enable full dev workflow without backend
- **Domain-driven** granular file structure

---

**Last Updated:** 2025-10-04
**Progress:** ~50% (Foundation ✅, State ✅, UI Components ✅, GraphQL Integration ✅, First MFE 65% complete, Dev experience ✅)

### Build Status ✅
- **TypeCheck**: 0 errors
- **Build**: All passing (shell: 1.95s, mfe-darta: 1.53s)
- **Bundle**: Under budget (main: 4.38 KB / 160 KB = 97% headroom)
- **Dev Command**: `pnpm dev` (single command orchestration)
- **GraphQL**: Codegen working, mutations integrated, queries integrated
- **UI Components**: Input, Select, Card components created and integrated
