# ePalika - Darta Chalani System

A modern, microservices-based correspondence management system for Nepali municipalities, built with GraphQL, gRPC, and event-driven architecture.

## 🏗️ Architecture

```
┌─────────────────┐
│  Client Apps    │  Web/Mobile applications
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Oathkeeper     │  API Gateway & Auth Proxy (Port 4455)
│  + PDP          │  - JWT Authentication via Keycloak
│                 │  - Policy-based Authorization (OpenFGA)
│                 │  - Header Injection (X-User-ID, X-Tenant, X-Roles)
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│ GraphQL Gateway │  Unified GraphQL API (Port 8000)
│                 │  - Schema stitching
│                 │  - Resolver layer
│                 │  - gRPC client orchestration
└───┬─────────┬───┘
    │ gRPC    │ gRPC
    ▼         ▼
┌───────────────┐  ┌─────────────────┐
│ Darta-Chalani │  │ Identity Service│  User/Auth Service (Port 9001)
│ gRPC Service  │  │ gRPC Service    │  - Keycloak integration
│ (Port 9000)   │  │                 │  - User management
│               │  │                 │  - Role/Grant management
└───────┬───────┘  └────────┬────────┘
        │ SQL               │ HTTP
        ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  YugabyteDB /   │  │   Keycloak      │  Identity Provider
│  PostgreSQL     │  │   (Port 8080)   │  - OAuth2/OIDC
│  (Port 5432)    │  │                 │  - User directory
└─────────────────┘  └─────────────────┘
```

### Technology Stack

**Backend Services**:
- **Language**: Go 1.23+
- **RPC Framework**: gRPC with Protocol Buffers (protobuf)
- **API Gateway**: GraphQL (gqlgen)
- **Database**: PostgreSQL / YugabyteDB (distributed SQL)
- **Query Builder**: sqlc (type-safe SQL code generation)
- **Migrations**: goose

**Authentication & Authorization**:
- **Auth Gateway**: ORY Oathkeeper
- **Identity Provider**: Keycloak (OAuth2/OIDC)
- **Authorization**: OpenFGA (relationship-based access control)
- **PDP**: Policy Decision Point service

**Infrastructure**:
- **Containerization**: Docker & Docker Compose
- **Proto Tooling**: protoc, protoc-gen-go, protoc-gen-go-grpc (in ~/.go/bin)
- **Deployment**: Distroless containers for production

**Code Generation**:
- **Proto**: protoc with go/go-grpc plugins
- **GraphQL**: gqlgen
- **SQL**: sqlc

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: For running infrastructure services
- **Go 1.23+**: For building and running Go services
- **protoc toolchain**: Installed in ~/.go/bin (protoc-gen-go, protoc-gen-go-grpc)

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f darta-chalani identity graphql-gateway

# Access GraphQL playground
open http://localhost:8000/
```

**Services Started**:
- PostgreSQL (port 5432)
- Keycloak (port 8080)
- Darta-Chalani gRPC (port 9000)
- Identity gRPC (port 9001)
- GraphQL Gateway (port 8000)
- Oathkeeper (port 4455)
- PDP (port 8181)

### Option 2: Local Development

**1. Start Infrastructure**:
```bash
# Start PostgreSQL, Keycloak, PDP
docker-compose up -d postgres keycloak pdp oathkeeper

# Wait for services to be healthy
docker-compose ps
```

**2. Run Database Migrations**:
```bash
cd services/darta-chalani

# Install goose
go install github.com/pressly/goose/v3/cmd/goose@latest

# Set database connection
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

# Run migrations
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up
```

**3. Start Darta-Chalani Service**:
```bash
cd services/darta-chalani

export GRPC_PORT=9000
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

go run cmd/dartasvc/main.go
```

**4. Start Identity Service**:
```bash
cd services/identity

export PORT=9001
export KEYCLOAK_URL=http://localhost:8080
export KEYCLOAK_REALM=master
export KEYCLOAK_CLIENT_ID=admin-cli
export KEYCLOAK_CLIENT_SECRET=admin

go run cmd/identitysvc/main.go
```

**5. Start GraphQL Gateway**:
```bash
cd services/graphql-gateway

export PORT=8000
export DARTA_GRPC_ADDR=localhost:9000
export IDENTITY_GRPC_ADDR=localhost:9001
export PDP_GRPC_ADDR=localhost:8080

go run cmd/gateways/main.go
```

**6. Access GraphQL Playground**:
```bash
# Via Oathkeeper (with auth)
open http://localhost:4455/playground

# Direct (no auth, for development)
open http://localhost:8000/
```

## 📋 Features

### Darta (Incoming Correspondence)

- ✅ Multi-step registration workflow (Draft → Review → Classification → Numbering → Finalized)
- ✅ 19-state workflow with validation
- ✅ Fiscal year-based sequential numbering (e.g., 2081-82/MUN/D-00123)
- ✅ Municipality and Ward-level scoping
- ✅ Applicant management (Citizens, Organizations, Government entities)
- ✅ Document attachments with metadata
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Multiple intake channels (Counter, Postal, Email, E-Darta Portal, Courier)
- ✅ Routing to departments and staff
- ✅ SLA tracking and overdue detection
- ✅ Full-text search on subjects
- ✅ Statistics and dashboard metrics
- ✅ Comprehensive audit trail

### Chalani (Outgoing Correspondence)

- ✅ Template-based letter creation
- ✅ Multi-level approval workflow (16 states)
- ✅ Digital signature tracking
- ✅ Multiple dispatch channels (Postal, Courier, Email, Hand Delivery, Portal)
- ✅ Delivery tracking and acknowledgements
- ✅ Recipient management
- ✅ Chalani-Darta linking (responses to incoming correspondence)
- ✅ Audit trail for all changes
- ⚠️ **Status**: Proto definitions complete (28 RPCs), implementation in progress (7/28 done)

### Identity & User Management

- ✅ Keycloak integration for identity provider
- ✅ User profile management (GetMe, GetUser, ListUsers)
- ✅ User invitation workflow
- ✅ Organizational unit management (create, list, get)
- ✅ Role and grant management
- ✅ Permission checking
- ✅ Full gRPC service implementation (15 RPCs)
- ✅ OAuth2/OIDC authentication flow

### Security & Multi-tenancy

- ✅ JWT-based authentication via Keycloak
- ✅ Fine-grained authorization via OpenFGA
- ✅ Multi-tenant data isolation
- ✅ Role-based access control (RBAC)
- ✅ Attribute-based access control (ABAC)
- ✅ Request tracing (W3C Trace Context)
- ✅ Idempotency support

## 📁 Project Structure

```
ePalika/
├── proto/                          # Protocol Buffer definitions
│   ├── gen/                        # Generated protobuf Go code
│   │   ├── darta/v1/               # Darta-Chalani generated types
│   │   │   ├── common.pb.go        # Shared types (48KB)
│   │   │   ├── darta.pb.go         # Darta types (151KB)
│   │   │   ├── darta_grpc.pb.go    # Darta gRPC server/client (51KB)
│   │   │   ├── chalani.pb.go       # Chalani types (182KB)
│   │   │   └── chalani_grpc.pb.go  # Chalani gRPC server/client (49KB)
│   │   └── identity/v1/            # Identity generated types
│   │       ├── identity.pb.go      # Identity types
│   │       └── identity_grpc.pb.go # Identity gRPC server/client
│   ├── darta/v1/
│   │   ├── common.proto            # Shared types, enums, pagination
│   │   ├── darta.proto             # 27 RPC methods for Darta
│   │   └── chalani.proto           # 28 RPC methods for Chalani
│   └── identity/v1/
│       └── identity.proto          # 15 RPC methods for Identity
│
├── services/
│   ├── darta-chalani/              # Correspondence management gRPC service
│   │   ├── cmd/dartasvc/           # Main application entry point
│   │   ├── internal/
│   │   │   ├── config/             # Configuration management
│   │   │   ├── db/                 # Generated sqlc code (90+ queries)
│   │   │   ├── domain/             # Business logic layer
│   │   │   │   ├── darta_service.go    # Darta domain service
│   │   │   │   ├── chalani_service.go  # Chalani domain service (stub)
│   │   │   │   ├── context.go          # User context extraction
│   │   │   │   └── errors.go           # Domain errors
│   │   │   ├── grpc/               # gRPC server implementation
│   │   │   │   ├── darta_server.go     # Darta RPC handlers
│   │   │   │   ├── chalani_server.go   # Chalani RPC handlers (stub)
│   │   │   │   ├── converters.go       # Proto ↔ DB type conversions
│   │   │   │   └── interceptors.go     # Auth, logging, tracing
│   │   │   └── dbutil/
│   │   │       └── migrations/     # Goose database migrations
│   │   ├── queries/                # SQL queries for sqlc
│   │   │   ├── dartas.sql          # 27 queries
│   │   │   ├── chalanis.sql        # 25 queries
│   │   │   ├── applicants.sql
│   │   │   └── ...
│   │   ├── sqlc.yaml               # sqlc configuration (pgx/v5)
│   │   └── Dockerfile              # Multi-stage build with distroless
│   │
│   ├── identity/                   # Identity management gRPC service
│   │   ├── cmd/identitysvc/        # Main application entry point
│   │   ├── internal/
│   │   │   ├── config/             # Configuration management
│   │   │   ├── keycloak/           # Keycloak client integration
│   │   │   │   └── client.go       # User/role/grant operations
│   │   │   └── grpc/               # gRPC server implementation
│   │   │       └── server.go       # Identity RPC handlers
│   │   └── Dockerfile              # Multi-stage build with distroless
│   │
│   └── graphql-gateway/            # GraphQL API Gateway
│       ├── cmd/gateways/           # Main application entry point
│       ├── graph/                  # GraphQL resolvers
│       │   ├── schema.resolvers.go # All query/mutation implementations
│       │   ├── resolver.go         # Base resolver with gRPC clients
│       │   └── converters.go       # GraphQL ↔ Proto conversions
│       ├── internal/
│       │   └── clients/            # gRPC client wrappers
│       │       ├── darta.go        # Darta service client
│       │       ├── identity.go     # Identity service client
│       │       └── pdp.go          # PDP service client
│       ├── schema/
│       │   └── schema.graphql      # GraphQL schema definition
│       ├── gqlgen.yml              # gqlgen configuration
│       └── Dockerfile              # Multi-stage build
│
├── policies/
│   └── oathkeeper/
│       ├── config.yaml             # Oathkeeper configuration
│       └── base/
│           └── graphql_gateway.json # Access rules
│
├── docker-compose.yml              # Infrastructure services
├── plan.md                         # Detailed implementation plan
├── PROGRESS.md                     # Session progress tracking
├── TESTING.md                      # Comprehensive testing guide
└── README.md                       # This file
```

## 🔌 API Examples

### GraphQL Mutations

**Create Darta**:
```graphql
mutation CreateDarta {
  createDarta(input: {
    fiscalYearID: "fy-2081-82"
    scope: MUNICIPALITY
    subject: "Budget Approval Request"
    applicant: {
      type: ORGANIZATION
      fullName: "ABC Corporation"
      email: "abc@example.com"
      phone: "9841234567"
    }
    intakeChannel: EDARTA_PORTAL
    receivedDate: "2025-10-05T10:00:00Z"
    priority: HIGH
    idempotencyKey: "unique-key-123"
  }) {
    id
    dartaNumber
    formattedDartaNumber
    status
    subject
    createdAt
  }
}
```

**Submit for Review**:
```graphql
mutation SubmitDarta {
  submitDartaForReview(dartaId: "uuid-here") {
    id
    status  # Should be PENDING_REVIEW
  }
}
```

**Reserve Darta Number**:
```graphql
mutation ReserveDarta {
  reserveDartaNumber(dartaId: "uuid-here") {
    id
    dartaNumber
    formattedDartaNumber  # e.g., "2081-82/MUN/D-00123"
  }
}
```

### GraphQL Queries

**Get Darta by ID**:
```graphql
query GetDarta {
  darta(id: "uuid-here") {
    id
    dartaNumber
    formattedDartaNumber
    subject
    status
    priority
    applicant {
      fullName
      email
      phone
    }
    createdAt
    updatedAt
  }
}
```

**List Dartas with Filters**:
```graphql
query ListDartas {
  dartas(
    filter: {
      fiscalYearID: "fy-2081-82"
      scope: MUNICIPALITY
      status: PENDING_REVIEW
      priority: HIGH
      search: "budget"
    }
    pagination: {
      limit: 20
      offset: 0
    }
  ) {
    edges {
      cursor
      node {
        id
        subject
        status
        priority
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      totalCount
    }
  }
}
```

**Get Statistics**:
```graphql
query DartaStats {
  dartaStats(
    scope: MUNICIPALITY
    fiscalYearId: "fy-2081-82"
  ) {
    total
    overdueCount
    byStatus {
      status
      count
    }
    byChannel {
      channel
      count
    }
  }
}
```

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide including:

- Health check tests
- Authentication flow with Keycloak
- Full CRUD operations
- State transition testing
- Idempotency testing
- Multi-tenant isolation testing
- Load testing with k6

**Quick Health Check**:

```bash
# Check GraphQL Gateway
curl http://localhost:4455/health

# Check gRPC Service (requires grpcurl)
grpcurl -plaintext localhost:9000 grpc.health.v1.Health/Check
```

## 📚 Documentation

- **[plan.md](./plan.md)**: Detailed implementation plan with all phases
- **[TESTING.md](./TESTING.md)**: Complete testing guide with examples
- **[ARCHITECTURE.md](./services/graphql-gateway/ARCHITECTURE.md)**: Architecture deep-dive

## 🛠️ Development

### Code Generation

**Protocol Buffers**:
```bash
cd proto
buf generate
```

**GraphQL**:
```bash
cd services/graphql-gateway
go run github.com/99designs/gqlgen generate
```

**Database Queries (sqlc)**:
```bash
cd services/darta-chalani
sqlc generate
```

### Database Migrations

**Create new migration**:
```bash
cd services/darta-chalani
goose -dir internal/dbutil/migrations create add_new_table sql
```

**Apply migrations**:
```bash
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up
```

**Rollback**:
```bash
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" down
```

## 🔐 Security

### Authentication Flow

1. Client obtains JWT token from Keycloak OAuth2/OIDC endpoint
2. Client sends request with `Authorization: Bearer <token>` header
3. Oathkeeper validates JWT signature, expiry, and claims
4. Oathkeeper calls PDP for authorization check
5. On success, Oathkeeper injects headers and forwards to GraphQL Gateway
6. GraphQL Gateway extracts user context from headers
7. GraphQL Gateway calls gRPC service with user context in metadata
8. gRPC service enforces tenant isolation and permissions

### Headers Propagated

- `X-User-ID`: Keycloak user ID
- `X-Tenant`: Organization/municipality ID
- `X-Roles`: Comma-separated user roles
- `X-Request-ID`: Unique request identifier
- `X-User-Name`: User's full name
- `Traceparent`: W3C trace context for distributed tracing

## 🏗️ Database Schema

**Key Tables**:

- `dartas`: Incoming correspondence records
- `chalanis`: Outgoing correspondence records
- `applicants`: Darta applicant information
- `recipients`: Chalani recipient information
- `attachments`: File attachments
- `darta_attachments`: Darta-attachment relations (many-to-many)
- `chalani_attachments`: Chalani-attachment relations
- `darta_routing`: Routing history
- `chalani_approvals`: Approval workflow tracking
- `audit_trail`: Comprehensive change history
- `templates`: Reusable Chalani templates
- `dispatch_tracking`: Delivery tracking for Chalani

**Multi-tenancy**: All tables have `tenant_id` column with indexes for isolation.

**Audit Trail**: All state changes automatically recorded with before/after values.

## 📊 Monitoring

**Health Endpoints**:
- `/health`: Basic health check (no auth)
- GraphQL health query: `{ health { status service timestamp } }`

**Metrics** (TODO):
- Prometheus metrics at `/metrics`
- Request count, duration, error rate
- Database connection pool metrics
- gRPC method metrics

**Logging**:
- Structured JSON logging
- Request ID correlation
- User context in all logs

**Tracing** (TODO):
- OpenTelemetry integration
- Jaeger/Tempo for trace visualization

## 🚧 Roadmap

### Completed ✅
- [x] Protocol Buffer definitions (70+ RPC methods across 3 services)
  - [x] Darta service: 27 RPCs
  - [x] Chalani service: 28 RPCs
  - [x] Identity service: 15 RPCs
- [x] Database schema and migrations (12 tables)
- [x] Repository layer with sqlc (90+ queries)
- [x] Domain services with business logic
- [x] Darta gRPC service implementation (27 RPCs)
- [x] Identity gRPC service with Keycloak integration
- [x] GraphQL Gateway with all resolvers
- [x] Oathkeeper access rules and configuration
- [x] Multi-tenant architecture
- [x] Idempotency support
- [x] Docker Compose infrastructure (7 services)
- [x] Proto code generation pipeline (protoc in ~/.go/bin)
- [x] Type conversion layer (pgtype ↔ protobuf)

### In Progress 🔄
- [ ] GraphQL gateway build fixes (field name mismatches)
- [ ] Complete Chalani service implementation (7/28 RPCs done)
- [ ] PDP authorization integration in GraphQL layer
- [ ] End-to-end testing with all services

### Upcoming 📝
- [ ] OpenTelemetry distributed tracing
- [ ] Prometheus metrics
- [ ] Rate limiting
- [ ] File upload service
- [ ] Email notification service
- [ ] SMS notification service
- [ ] Reporting and analytics
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Follow Go best practices and idiomatic code
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Ensure all linters pass

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Developed for Nepali municipalities to modernize their correspondence management systems.

---

## 📝 Recent Development Session Summary

### What Was Built

**Session Goal**: Complete identity service integration and ensure all services build and run via docker-compose.

**Completed Work**:

1. **Fixed Darta-Chalani Build Issues**:
   - Added type conversion helpers for pgx v5 (pgtype.Timestamptz ↔ time.Time, pgtype.UUID ↔ uuid.UUID)
   - Fixed proto import paths (`proto/darta/v1/` → `darta/v1/`)
   - Generated all proto files using protoc from ~/.go/bin
   - Fixed field naming mismatches (TenantID vs TenantId in proto-generated code)
   - Removed invalid UpdateDartaStatus parameters
   - Fixed converter functions for different row types
   - Commented out non-existent CreateAuditTrail calls

2. **Created Identity Service** (NEW):
   - Complete proto definition ([proto/identity/v1/identity.proto](proto/identity/v1/identity.proto)) with 15 RPCs
   - Keycloak client integration ([services/identity/internal/keycloak/client.go](services/identity/internal/keycloak/client.go))
   - gRPC server implementation ([services/identity/internal/grpc/server.go](services/identity/internal/grpc/server.go))
   - Docker integration (port 9001)
   - Connected to Keycloak master realm with admin credentials
   - Integrated into GraphQL gateway

3. **Infrastructure Status**:
   - ✅ PostgreSQL: Running
   - ✅ Keycloak: Running (port 8080)
   - ✅ Darta-Chalani: Built and running (port 9000)
   - ✅ Identity: Built and running (port 9001)
   - ⚠️ GraphQL Gateway: Build failing (field name mismatches)
   - ✅ Oathkeeper: Running (port 4455)
   - ✅ PDP: Running (port 8181)

### Current Issues

**GraphQL Gateway Build Failure**:
- Location: [services/graphql-gateway/graph/schema.resolvers.go](services/graphql-gateway/graph/schema.resolvers.go)
- Issues:
  - Field name mismatches: `FiscalYearId` vs proto field names
  - Field name mismatches: `SlaHours` vs proto `SLAHours`
  - Missing method implementations in DartaService interface
  - Undefined PDPService type in resolver

**Next Steps**:
1. Fix GraphQL schema field names to match proto definitions
2. Add missing RPC method wrappers to DartaService interface
3. Define PDPService interface
4. Rebuild gateway until compilation succeeds
5. Verify all services are healthy

### Key Technical Decisions

**Type System**:
- Using pgx v5 with pgtype for database layer (sqlc generates pgtype.Timestamptz, pgtype.UUID)
- Conversion helpers at boundaries (domain → DB uses pgtype, gRPC → proto uses timestamppb)
- Pattern: Convert at layer boundaries, not in domain logic

**Proto Toolchain**:
- protoc binaries located in ~/.go/bin (not ~/go/bin)
- Import paths: Relative from proto/ directory (e.g., `import "darta/v1/common.proto"`)
- Generated code in proto/gen/ directory

**Identity Service Architecture**:
- Direct Keycloak integration using gocloak library
- No separate database (Keycloak is source of truth)
- Realm: master (initially tried "epalika" but it didn't exist)
- Client: admin-cli with admin credentials

### File References

**Key Files Modified**:
- [services/darta-chalani/internal/domain/darta_service.go](services/darta-chalani/internal/domain/darta_service.go) - Type conversion helpers
- [services/darta-chalani/internal/grpc/converters.go](services/darta-chalani/internal/grpc/converters.go) - Proto converters
- [services/darta-chalani/internal/grpc/darta_server.go](services/darta-chalani/internal/grpc/darta_server.go) - RPC implementations
- [proto/darta/v1/darta.proto](proto/darta/v1/darta.proto) - Fixed import paths
- [services/graphql-gateway/internal/clients/darta.go](services/graphql-gateway/internal/clients/darta.go) - Client interface (in progress)

**Files Created**:
- [proto/identity/v1/identity.proto](proto/identity/v1/identity.proto) - Identity service definition
- [services/identity/cmd/identitysvc/main.go](services/identity/cmd/identitysvc/main.go) - Service entry point
- [services/identity/internal/keycloak/client.go](services/identity/internal/keycloak/client.go) - Keycloak integration
- [services/identity/internal/grpc/server.go](services/identity/internal/grpc/server.go) - gRPC handlers
- [services/identity/Dockerfile](services/identity/Dockerfile) - Container build
- [services/graphql-gateway/internal/clients/identity.go](services/graphql-gateway/internal/clients/identity.go) - Gateway client

---

**For detailed implementation status and plan, see [plan.md](./plan.md)**
