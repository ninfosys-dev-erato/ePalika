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
└────────┬────────┘
         │ gRPC
         ▼
┌─────────────────┐
│ Darta-Chalani   │  Business Logic Service (Port 9000)
│ gRPC Service    │  - Domain services
│                 │  - State machines
│                 │  - Repository layer
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│  YugabyteDB /   │  Distributed SQL Database
│  PostgreSQL     │  - Multi-tenant data
│                 │  - Full-text search
│                 │  - Audit trails
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: For running infrastructure services
- **Go 1.23+**: For building and running Go services
- **Node.js 20+**: For frontend development (optional)
- **Make**: For build automation (optional)

### 1. Start Infrastructure

```bash
# Start PostgreSQL, Keycloak, PDP
docker-compose up -d postgres keycloak pdp oathkeeper

# Wait for services to be healthy
docker-compose ps
```

### 2. Run Database Migrations

```bash
cd services/darta-chalani

# Install goose
go install github.com/pressly/goose/v3/cmd/goose@latest

# Set database connection
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

# Run migrations
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up
```

### 3. Start Darta-Chalani Service

```bash
cd services/darta-chalani

export GRPC_PORT=9000
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

go run cmd/dartasvc/main.go
```

### 4. Start GraphQL Gateway

```bash
cd services/graphql-gateway

export PORT=8000
export DARTA_GRPC_ADDR=localhost:9000
export PDP_GRPC_ADDR=localhost:8080

go run cmd/gateways/main.go
```

### 5. Access GraphQL Playground

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
│   └── darta/v1/
│       ├── common.proto            # Shared types, enums, pagination
│       ├── darta.proto             # 27 RPC methods for Darta
│       └── chalani.proto           # 28 RPC methods for Chalani
│
├── services/
│   ├── darta-chalani/              # gRPC microservice
│   │   ├── cmd/dartasvc/           # Main application entry point
│   │   ├── internal/
│   │   │   ├── config/             # Configuration management
│   │   │   ├── db/                 # Generated sqlc code (90+ queries)
│   │   │   ├── domain/             # Business logic layer
│   │   │   │   ├── darta_service.go
│   │   │   │   ├── chalani_service.go
│   │   │   │   ├── context.go      # User context extraction
│   │   │   │   └── errors.go       # Domain errors
│   │   │   ├── grpc/               # gRPC server implementation
│   │   │   │   ├── darta_server.go
│   │   │   │   ├── converters.go
│   │   │   │   └── interceptors.go # Auth, logging, tracing
│   │   │   └── dbutil/
│   │   │       └── migrations/     # Database migrations
│   │   ├── queries/                # SQL queries for sqlc
│   │   │   ├── dartas.sql          # 27 queries
│   │   │   ├── chalanis.sql        # 25 queries
│   │   │   ├── applicants.sql
│   │   │   └── ...
│   │   └── sqlc.yaml               # sqlc configuration
│   │
│   └── graphql-gateway/            # GraphQL API Gateway
│       ├── cmd/gateways/           # Main application entry point
│       ├── graph/                  # GraphQL resolvers
│       │   ├── schema.resolvers.go # All query/mutation implementations
│       │   ├── resolver.go         # Base resolver with gRPC clients
│       │   └── converters.go       # GraphQL ↔ Proto conversions
│       ├── internal/
│       │   └── clients/            # gRPC client wrappers
│       ├── schema/
│       │   └── schema.graphql      # GraphQL schema definition
│       └── gqlgen.yml              # gqlgen configuration
│
├── policies/
│   └── oathkeeper/
│       ├── config.yaml             # Oathkeeper configuration
│       └── base/
│           └── graphql_gateway.json # Access rules
│
├── docker-compose.yml              # Infrastructure services
├── plan.md                         # Detailed implementation plan
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
- [x] Protocol Buffer definitions (55 RPC methods)
- [x] Database schema and migrations (12 tables)
- [x] Repository layer with sqlc (90+ queries)
- [x] Domain services with business logic
- [x] gRPC server implementation (14 RPCs implemented)
- [x] GraphQL Gateway with all resolvers
- [x] Oathkeeper access rules and configuration
- [x] Multi-tenant architecture
- [x] Idempotency support

### In Progress 🔄
- [ ] End-to-end testing
- [ ] PDP authorization integration in GraphQL layer
- [ ] Remaining gRPC stub implementations
- [ ] Chalani service complete implementation

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

**For detailed implementation status and plan, see [plan.md](./plan.md)**
