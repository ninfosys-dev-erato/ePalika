# @egov/graphql-schema

GraphQL schema, types, and mock service worker for Darta-Chalani system.

## 📦 What's Included

- **GraphQL Schema** - Complete type definitions for Darta, Chalani, Numbering, Users
- **Generated Types** - Type-safe TypeScript types and React hooks
- **MSW Mocks** - Mock Service Worker handlers for development
- **Fixtures** - Realistic test data with Nepali content

## 🚀 Usage

### Import Types

```typescript
import { Darta, Chalani, Counter } from '@egov/graphql-schema'
```

### Import Generated Hooks (coming soon with operations)

```typescript
import { useDartaQuery, useCreateDartaMutation } from '@egov/graphql-schema/generated'
```

### Start Mock Service Worker

```typescript
import { startMockServiceWorker } from '@egov/graphql-schema/mocks'

// In your app entry point
await startMockServiceWorker()
```

## 📝 Schema Overview

### Core Types

- **Darta** - Inbound registry entries
- **Chalani** - Outbound dispatch letters
- **Counter** - Number allocation service
- **User** - Actor/user management
- **Applicant** - External applicants
- **Recipient** - Chalani recipients

### Enums

- `Scope` - MUNICIPALITY | WARD
- `IntakeChannel` - COUNTER | POSTAL | EMAIL | EDARTA_PORTAL
- `DispatchChannel` - POSTAL | COURIER | EMAIL | HAND_DELIVERY
- `CaseStatus` - DRAFT | PENDING_TRIAGE | PENDING_REVIEW | APPROVED | DISPATCHED | ACKNOWLEDGED | CLOSED
- `Priority` - LOW | MEDIUM | HIGH | URGENT

## 🛠️ Development

### Generate Types

```bash
pnpm codegen
```

### Watch Mode

```bash
pnpm codegen:watch
```

## 📁 Structure

```
src/
├── schema/
│   └── schema.graphql          # Main schema
├── mocks/
│   ├── index.ts               # MSW setup
│   ├── handlers/              # GraphQL resolvers
│   │   ├── darta.ts
│   │   ├── chalani.ts
│   │   └── numbering.ts
│   └── fixtures/              # Mock data
│       ├── users.fixtures.ts
│       ├── units.fixtures.ts
│       ├── darta.fixtures.ts
│       └── chalani.fixtures.ts
├── generated/                 # Auto-generated
│   ├── graphql.ts            # TypeScript types
│   └── hooks.ts              # React hooks
└── index.ts                  # Package entry
```

## 🧪 Mock Data

The package includes realistic mock data:

- **50+ Darta entries** with Nepali subjects
- **40+ Chalani letters** with proper workflow
- **User roles** - Clerk, Officer, Head, CAO, Ward staff
- **Organizational units** - Departments, Sections, Wards
- **Idempotent numbering** - Simulates counter service

## 🔄 State Management

Mock handlers maintain in-memory state:

- Counters increment atomically
- Idempotency keys prevent duplicates
- Status transitions follow workflow rules
- Relationships are maintained (Darta → Chalani)

## 🎯 Next Steps

1. Add GraphQL operations (queries/mutations) for code generation
2. Integrate with Apollo Client in shell app
3. Add subscription support for real-time updates
4. Implement offline sync logic
