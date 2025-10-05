# ePalika Darta-Chalani Testing Guide

## Prerequisites

- Docker and Docker Compose installed
- Go 1.23+ installed
- `protoc` and Buf CLI installed (for proto generation)
- `sqlc` installed (for SQL code generation)
- Keycloak running with `palika` realm configured

## Setup

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL, Keycloak, PDP
docker-compose up -d postgres keycloak pdp

# Wait for services to be healthy
docker-compose ps
```

### 2. Run Database Migrations

```bash
cd services/darta-chalani

# Install goose if not already installed
go install github.com/pressly/goose/v3/cmd/goose@latest

# Set database connection
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

# Run migrations
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up

# Verify migrations
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" status
```

Expected output:
```
Applied At                  Migration
=======================================
2025-10-05 10:00:00 UTC     00001 initial schema
```

### 3. Generate Proto Code (if needed)

```bash
cd proto

# Using Buf
buf generate

# Verify generated files
ls -la gen/darta/v1/
# Should see: common.pb.go, common_grpc.pb.go, darta.pb.go, darta_grpc.pb.go, chalani.pb.go, chalani_grpc.pb.go
```

### 4. Generate sqlc Code (if needed)

```bash
cd services/darta-chalani

# Install sqlc if not already installed
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Generate
sqlc generate

# Verify generated files
ls -la internal/db/
# Should see: db.go, models.go, querier.go, applicants.sql.go, dartas.sql.go, etc.
```

### 5. Start Darta-Chalani gRPC Service

```bash
cd services/darta-chalani

# Set environment variables
export GRPC_PORT=9000
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"
export LOG_LEVEL=debug

# Run service
go run cmd/dartasvc/main.go
```

Expected output:
```
{"level":"info","msg":"Starting Darta service","port":9000}
{"level":"info","msg":"Database connection established","database":"epalika"}
{"level":"info","msg":"gRPC server listening","address":":9000"}
```

### 6. Start GraphQL Gateway

In a new terminal:

```bash
cd services/graphql-gateway

# Set environment variables
export PORT=8000
export DARTA_GRPC_ADDR=localhost:9000
export PDP_GRPC_ADDR=localhost:8080
export LOG_LEVEL=debug

# Run service
go run cmd/gateways/main.go
```

Expected output:
```
{"level":"info","msg":"Starting GraphQL Gateway","port":8000}
{"level":"info","msg":"Connected to Darta service","address":"localhost:9000"}
{"level":"info","msg":"GraphQL server listening","address":":8000"}
```

### 7. Start Oathkeeper

In a new terminal:

```bash
# Start Oathkeeper via Docker Compose
docker-compose up oathkeeper

# Or run locally if configured
```

Expected output:
```
{"level":"info","msg":"Loaded access rules","count":4}
{"level":"info","msg":"Starting Oathkeeper proxy","port":4455}
{"level":"info","msg":"Starting Oathkeeper API","port":4456}
```

## Testing

### Test 1: Health Check (No Auth)

```bash
# Direct GraphQL Gateway health check (bypassing Oathkeeper)
curl http://localhost:8000/health

# Expected: {"status":"ok"}

# Via Oathkeeper
curl http://localhost:4455/health

# Expected: {"status":"ok"}
```

### Test 2: GraphQL Playground (No Auth)

Open in browser:
```
http://localhost:4455/playground
```

You should see the GraphQL Playground interface.

### Test 3: Obtain JWT Token from Keycloak

```bash
# Replace with your Keycloak configuration
export KEYCLOAK_URL="http://localhost:8083"
export REALM="palika"
export CLIENT_ID="palika-api"
export CLIENT_SECRET="your-client-secret"
export USERNAME="clerk@example.com"
export PASSWORD="password"

# Get access token
TOKEN_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD")

# Extract access token
export ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# Verify token was obtained
echo $ACCESS_TOKEN
```

### Test 4: GraphQL Health Query (With Auth)

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ health { status service timestamp } }"
  }' | jq
```

Expected response:
```json
{
  "data": {
    "health": {
      "status": "SERVING",
      "service": "DartaService",
      "timestamp": "2025-10-05T10:00:00Z"
    }
  }
}
```

### Test 5: Create Darta (Full Flow)

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateDarta($input: CreateDartaInput!) { createDarta(input: $input) { id dartaNumber formattedDartaNumber status subject createdAt } }",
    "variables": {
      "input": {
        "fiscalYearID": "fy-2081-82",
        "scope": "MUNICIPALITY",
        "subject": "Test Darta - Budget Approval Request",
        "applicant": {
          "type": "ORGANIZATION",
          "fullName": "ABC Corporation",
          "email": "abc@example.com",
          "phone": "9841234567",
          "address": "Kathmandu, Nepal"
        },
        "intakeChannel": "EDARTA_PORTAL",
        "receivedDate": "2025-10-05T10:00:00Z",
        "priority": "HIGH"
      }
    }
  }' | jq
```

Expected response:
```json
{
  "data": {
    "createDarta": {
      "id": "uuid-here",
      "dartaNumber": null,
      "formattedDartaNumber": null,
      "status": "DRAFT",
      "subject": "Test Darta - Budget Approval Request",
      "createdAt": "2025-10-05T10:00:00Z"
    }
  }
}
```

### Test 6: Get Darta by ID

```bash
# Replace DARTA_ID with the ID from Test 5
export DARTA_ID="uuid-from-previous-test"

curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"query GetDarta(\$id: ID!) { darta(id: \$id) { id dartaNumber subject status applicant { fullName email } } }\",
    \"variables\": {
      \"id\": \"$DARTA_ID\"
    }
  }" | jq
```

### Test 7: List Dartas with Filters

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ListDartas($filter: DartaFilterInput, $pagination: PaginationInput) { dartas(filter: $filter, pagination: $pagination) { edges { node { id subject status createdAt } } pageInfo { totalCount hasNextPage } } }",
    "variables": {
      "filter": {
        "fiscalYearID": "fy-2081-82",
        "scope": "MUNICIPALITY",
        "status": "DRAFT"
      },
      "pagination": {
        "limit": 10,
        "offset": 0
      }
    }
  }' | jq
```

### Test 8: Submit Darta for Review (State Transition)

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation SubmitDarta(\$dartaId: ID!) { submitDartaForReview(dartaId: \$dartaId) { id status } }\",
    \"variables\": {
      \"dartaId\": \"$DARTA_ID\"
    }
  }" | jq
```

Expected: Status should change from DRAFT → PENDING_REVIEW

### Test 9: Reserve Darta Number

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation ReserveDarta(\$dartaId: ID!) { reserveDartaNumber(dartaId: \$dartaId) { id dartaNumber formattedDartaNumber status } }\",
    \"variables\": {
      \"dartaId\": \"$DARTA_ID\"
    }
  }" | jq
```

Expected: dartaNumber should be assigned (e.g., 1), formattedDartaNumber should be "2081-82/MUN/D-00001"

### Test 10: Idempotency Test

Create the same Darta twice with the same idempotency key:

```bash
# First request
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateDarta($input: CreateDartaInput!) { createDarta(input: $input) { id dartaNumber } }",
    "variables": {
      "input": {
        "fiscalYearID": "fy-2081-82",
        "scope": "MUNICIPALITY",
        "subject": "Idempotency Test",
        "applicant": {
          "type": "INDIVIDUAL",
          "fullName": "John Doe"
        },
        "intakeChannel": "COUNTER",
        "receivedDate": "2025-10-05T11:00:00Z",
        "priority": "MEDIUM",
        "idempotencyKey": "test-idempotency-key-12345"
      }
    }
  }' | jq

# Save the ID from response
export IDEM_DARTA_ID="uuid-from-response"

# Second request with same idempotency key
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateDarta($input: CreateDartaInput!) { createDarta(input: $input) { id dartaNumber } }",
    "variables": {
      "input": {
        "fiscalYearID": "fy-2081-82",
        "scope": "MUNICIPALITY",
        "subject": "Idempotency Test - Different Subject",
        "applicant": {
          "type": "INDIVIDUAL",
          "fullName": "Jane Doe"
        },
        "intakeChannel": "EMAIL",
        "receivedDate": "2025-10-05T12:00:00Z",
        "priority": "LOW",
        "idempotencyKey": "test-idempotency-key-12345"
      }
    }
  }' | jq
```

Expected: Both requests return the SAME Darta ID (deduplication works)

### Test 11: Multi-Tenant Isolation

If you have multiple tenants configured:

```bash
# Get token for Tenant A user
export TOKEN_A=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=user-tenant-a@example.com" \
  -d "password=password" | jq -r '.access_token')

# Create Darta as Tenant A
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{ "query": "mutation { createDarta(input: { ... }) { id } }" }' | jq

# Get token for Tenant B user
export TOKEN_B=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=user-tenant-b@example.com" \
  -d "password=password" | jq -r '.access_token')

# Try to access Tenant A's Darta as Tenant B
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"{ darta(id: \\\"$DARTA_ID\\\") { id } }\"}" | jq
```

Expected: Error or empty result (tenant isolation enforced)

## Debugging

### Check Oathkeeper Logs

```bash
docker-compose logs -f oathkeeper
```

Look for:
- JWT validation errors
- PDP authorization denials
- Header mutation issues

### Check GraphQL Gateway Logs

```bash
# If running via go run, logs appear in terminal
# Check for gRPC connection errors, resolver errors
```

### Check Darta-Chalani Service Logs

```bash
# If running via go run, logs appear in terminal
# Check for database errors, validation errors, state transition failures
```

### Verify Database State

```bash
# Connect to database
psql "$DATABASE_DSN"

# Check dartas table
SELECT id, darta_number, formatted_darta_number, status, subject, tenant_id
FROM dartas
ORDER BY created_at DESC
LIMIT 10;

# Check audit trail
SELECT entity_type, entity_id, action, performed_by, changes, performed_at
FROM audit_trail
ORDER BY performed_at DESC
LIMIT 20;
```

### gRPC Health Check

```bash
# Install grpcurl if not already installed
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Check service health
grpcurl -plaintext localhost:9000 grpc.health.v1.Health/Check

# List available services
grpcurl -plaintext localhost:9000 list

# Expected output:
# darta.v1.DartaService
# grpc.health.v1.Health
```

## Common Issues

### Issue 1: "connection refused" when calling gRPC

**Cause**: Darta-Chalani service not running or wrong port

**Solution**:
```bash
# Check if service is running
lsof -i :9000

# Verify GRPC_PORT environment variable
echo $GRPC_PORT
```

### Issue 2: "unauthorized" when calling GraphQL

**Cause**: JWT token expired or invalid

**Solution**:
```bash
# Obtain fresh token
# Verify token contents
echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 -d | jq
```

### Issue 3: "no rows in result set" errors

**Cause**: Foreign key references to identity service (fiscal years, wards) don't exist

**Solution**:
```bash
# For testing, use any string for fiscal_year_id and ward_id
# These are external references to the identity microservice
```

### Issue 4: Database migration errors

**Cause**: Previous failed migrations or schema conflicts

**Solution**:
```bash
# Check migration status
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" status

# Rollback and re-apply
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" down
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up
```

## Performance Testing

### Load Test with k6

Create `load_test.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

const TOKEN = __ENV.ACCESS_TOKEN;

export default function () {
  const payload = JSON.stringify({
    query: `{ health { status } }`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
  };

  const res = http.post('http://localhost:4455/query', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => r.json('data') !== undefined,
  });
}
```

Run:
```bash
k6 run load_test.js
```

## Next Steps

1. **Add More Test Cases**: Chalani operations, routing, approvals
2. **Integration Tests**: Automated tests with testcontainers
3. **E2E Tests**: Cypress or Playwright for full user flows
4. **Monitoring**: Add Prometheus metrics, Grafana dashboards
5. **Documentation**: OpenAPI/Swagger for REST endpoints (if needed)
