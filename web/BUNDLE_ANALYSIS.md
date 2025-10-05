# Bundle Size Analysis

**Build Date:** 2025-10-04
**Target:** Shell App (Main Entry Point)

## Performance Budget Status

### ✅ PASSING
- **Initial CSS**: 21.04 KB (Budget: 35 KB) - **40% headroom**
- **Initial JS (Main)**: 3.45 KB (Budget: 160 KB) - **98% headroom**

### ⚠️ ATTENTION NEEDED
- **vendor-utils**: 50.23 KB - Contains Zustand, Immer, idb-keyval
- **vendor-react-dom**: 82.70 KB - React DOM rendering engine

## Detailed Bundle Breakdown

### Federation Chunks (Lazy Loaded)
```
__federation_shared_react-dom.js          0.09 KB
__federation_shared_react.js              0.09 KB
__federation_shared_@apollo/client.js     0.71 KB
__federation_shared_@tanstack/react-query.js  0.75 KB
__federation_shared_@tanstack/react-router.js 1.36 KB
```
**Total Federation Overhead**: ~3 KB (acceptable)

### Vendor Chunks (Code Split)
```
vendor-query.js                2.94 KB  ✅ TanStack Query runtime
vendor-react-core.js           5.15 KB  ✅ React core (hooks, context)
vendor-auth.js                 8.23 KB  ✅ Keycloak auth client
vendor-graphql.js             11.31 KB  ✅ Apollo + GraphQL runtime
vendor-utils.js               50.23 KB  ⚠️ Zustand, Immer, misc utils
vendor-react-dom.js           82.70 KB  ⚠️ React DOM renderer
```

### Initial Bundle (Entry Point)
```
index.js                       3.45 KB  ✅ App bootstrap + providers
index.css                     21.04 KB  ✅ Carbon Design + global styles
```

## Total Initial Load (Critical Path)

**Scenario 1: First Visit (Cold Cache)**
- HTML: ~1 KB
- CSS: 21.04 KB
- Main JS: 3.45 KB
- React Core: 5.15 KB
- React DOM: 82.70 KB
- **TOTAL**: ~113 KB gzipped

**Scenario 2: Authenticated User (Warm Cache)**
- Only index.js changes between deploys
- Vendor chunks cached (React, Apollo, etc.)
- **Incremental**: ~3.45 KB per deploy

## Optimization Recommendations

### 1. React-DOM Size (82.70 KB)
**Issue**: React DOM is the largest single chunk.

**Options**:
- ✅ Already code-split from react-core
- ⚠️ Cannot reduce size (it's React's core renderer)
- ✅ Cache aggressively (rarely changes)
- 🎯 Consider Preact (25 KB alternative) if needed

**Verdict**: Accept size, rely on caching

### 2. Vendor-Utils Growth (50.23 KB)
**Issue**: Zustand (5 KB) + Immer (15 KB) + misc utils

**Options**:
- ✅ Split Zustand into separate `vendor-state` chunk
- ⚠️ Immer is needed for immutable updates
- 🎯 Lazy load non-critical stores

**Action**: Create vendor-state chunk

### 3. Apollo/GraphQL (11.31 KB)
**Status**: ✅ Acceptable for enterprise GraphQL client

### 4. MSW in Production
**Status**: ✅ Already lazy loaded (dev only)
**Verification**: Check dist/ for MSW code

## Next Steps

1. ✅ State management package complete
2. ⏳ Create vendor-state chunk for Zustand/Immer
3. ⏳ Validate MSW tree-shaken in production
4. ⏳ Re-enable perf-budget plugin (fix ESM)
5. ⏳ Create first MFE (Darta intake)

## Performance Budget Compliance

| Metric | Budget | Actual | Status |
|--------|--------|--------|--------|
| Initial JS (Main) | 160 KB | 3.45 KB | ✅ PASS |
| Initial CSS | 35 KB | 21.04 KB | ✅ PASS |
| React Core | - | 5.15 KB | ✅ Good |
| React DOM | - | 82.70 KB | ⚠️ Large but expected |
| State Management | - | ~20 KB | ⚠️ In vendor-utils |
| Apollo/GraphQL | - | 11.31 KB | ✅ Good |

**Overall**: ✅ **PASSING** - Main bundle well under budget
