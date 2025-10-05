# ePalika Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup

- [ ] **Go 1.23+** installed
- [ ] **Docker & Docker Compose** installed and running
- [ ] **PostgreSQL/YugabyteDB** accessible
- [ ] **Keycloak** configured with `palika` realm
- [ ] **Network connectivity** between all services

### 2. Configuration Files

- [ ] `docker-compose.yml` configured with correct service names and ports
- [ ] `policies/oathkeeper/config.yaml` configured
- [ ] `policies/oathkeeper/base/graphql_gateway.json` created
- [ ] Environment variables set for all services

### 3. Database Preparation

- [ ] Database created: `epalika`
- [ ] Database user created with appropriate permissions
- [ ] Connection string tested: `postgresql://user:pass@host:5432/epalika`
- [ ] Migrations ready in `services/darta-chalani/internal/dbutil/migrations/`

### 4. Code Generation

- [ ] Protocol buffers generated: `cd proto && buf generate`
- [ ] GraphQL code generated: `cd services/graphql-gateway && go run github.com/99designs/gqlgen generate`
- [ ] sqlc queries generated: `cd services/darta-chalani && sqlc generate`

---

## Deployment Steps

### Step 1: Start Infrastructure Services

```bash
# Start core infrastructure
docker-compose up -d postgres keycloak pdp

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Check logs if any service is unhealthy
docker-compose logs postgres
docker-compose logs keycloak
docker-compose logs pdp
```

**Verify**:
- PostgreSQL is accepting connections on port 5432
- Keycloak is accessible at http://localhost:8083
- PDP is running on port 8080

### Step 2: Configure Keycloak

```bash
# Access Keycloak admin console
open http://localhost:8083/admin

# Login with admin credentials (from docker-compose.yml)
# Default: admin / admin

# Create or verify realm: palika
# Create client: palika-api
# Configure client:
#   - Client Protocol: openid-connect
#   - Access Type: confidential
#   - Valid Redirect URIs: http://localhost:*
#   - Web Origins: http://localhost:*

# Create test users with roles:
#   - darta_clerk
#   - darta_reviewer
#   - darta_approver
#   - chalani_drafter
#   - admin

# Configure client scopes to include:
#   - tenant (custom claim)
#   - roles (realm roles)
#   - email
#   - profile
```

### Step 3: Run Database Migrations

```bash
cd services/darta-chalani

# Set database connection string
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"

# Install goose if not already installed
go install github.com/pressly/goose/v3/cmd/goose@latest

# Check migration status
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" status

# Run migrations
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" up

# Verify migrations succeeded
goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" version
# Should output: 1
```

**Verify**:
```bash
# Connect to database and check tables
psql "$DATABASE_DSN"

# List tables
\dt

# Expected tables:
# dartas, chalanis, applicants, recipients, attachments,
# darta_attachments, chalani_attachments, darta_routing,
# chalani_approvals, audit_trail, templates, dispatch_tracking

# Exit
\q
```

### Step 4: Start Darta-Chalani gRPC Service

```bash
cd services/darta-chalani

# Set environment variables
export GRPC_PORT=9000
export DATABASE_DSN="postgresql://epalika:epalika@localhost:5432/epalika?sslmode=disable"
export LOG_LEVEL=info

# Build (optional, for production)
go build -o bin/dartasvc cmd/dartasvc/main.go

# Run
go run cmd/dartasvc/main.go

# Or run the built binary
# ./bin/dartasvc
```

**Expected Output**:
```
{"level":"info","msg":"Starting Darta service","port":9000}
{"level":"info","msg":"Database connection established"}
{"level":"info","msg":"gRPC server listening","address":":9000"}
```

**Verify** (in a new terminal):
```bash
# Install grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Check service health
grpcurl -plaintext localhost:9000 grpc.health.v1.Health/Check

# Expected: {"status": "SERVING"}

# List available services
grpcurl -plaintext localhost:9000 list

# Expected output should include:
# darta.v1.DartaService
# grpc.health.v1.Health
```

### Step 5: Start GraphQL Gateway

```bash
cd services/graphql-gateway

# Set environment variables
export PORT=8000
export DARTA_GRPC_ADDR=localhost:9000
export PDP_GRPC_ADDR=localhost:8080
export LOG_LEVEL=info

# Build (optional, for production)
go build -o bin/gateways cmd/gateways/main.go

# Run
go run cmd/gateways/main.go

# Or run the built binary
# ./bin/gateways
```

**Expected Output**:
```
{"level":"info","msg":"Starting GraphQL Gateway","port":8000}
{"level":"info","msg":"Connected to Darta service","address":"localhost:9000"}
{"level":"info","msg":"GraphQL server listening","address":":8000"}
```

**Verify** (in a new terminal):
```bash
# Health check
curl http://localhost:8000/health

# Expected: {"status":"ok"}

# Open GraphQL Playground
open http://localhost:8000/
```

### Step 6: Start Oathkeeper

```bash
# Start Oathkeeper via Docker Compose
docker-compose up -d oathkeeper

# Check logs
docker-compose logs -f oathkeeper

# Wait for startup messages
```

**Expected Output**:
```
{"level":"info","msg":"Loaded access rules","count":4}
{"level":"info","msg":"Starting Oathkeeper proxy","port":4455}
{"level":"info","msg":"Starting Oathkeeper API","port":4456}
```

**Verify**:
```bash
# Health check via Oathkeeper (no auth required)
curl http://localhost:4455/health

# Expected: {"status":"ok"}

# Check Oathkeeper API for loaded rules
curl http://localhost:4456/rules

# Expected: JSON array with 4 rules (graphql-gateway-query, graphql-playground, etc.)
```

---

## Post-Deployment Verification

### Test 1: Unauthenticated Access (Should Fail)

```bash
curl -X POST http://localhost:4455/query \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}' \
  -v

# Expected: HTTP 401 Unauthorized
```

### Test 2: Authenticated Access (Should Succeed)

```bash
# Get access token from Keycloak
export TOKEN=$(curl -s -X POST http://localhost:8083/realms/palika/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=palika-api" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=clerk@example.com" \
  -d "password=password" | jq -r '.access_token')

# Call GraphQL API
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status service timestamp } }"}' | jq

# Expected:
# {
#   "data": {
#     "health": {
#       "status": "SERVING",
#       "service": "DartaService",
#       "timestamp": "2025-10-05T14:30:00Z"
#     }
#   }
# }
```

### Test 3: Create Darta (Full Flow)

```bash
curl -X POST http://localhost:4455/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateDarta($input: CreateDartaInput!) { createDarta(input: $input) { id subject status } }",
    "variables": {
      "input": {
        "fiscalYearID": "fy-2081-82",
        "scope": "MUNICIPALITY",
        "subject": "Test Deployment Darta",
        "applicant": {
          "type": "INDIVIDUAL",
          "fullName": "Test User"
        },
        "intakeChannel": "COUNTER",
        "receivedDate": "2025-10-05T10:00:00Z",
        "priority": "MEDIUM"
      }
    }
  }' | jq

# Expected:
# {
#   "data": {
#     "createDarta": {
#       "id": "uuid-here",
#       "subject": "Test Deployment Darta",
#       "status": "DRAFT"
#     }
#   }
# }
```

### Test 4: Verify Database

```bash
# Connect to database
psql "$DATABASE_DSN"

# Check dartas table
SELECT id, subject, status, created_at FROM dartas ORDER BY created_at DESC LIMIT 5;

# Check audit trail
SELECT entity_type, action, performed_by, performed_at FROM audit_trail ORDER BY performed_at DESC LIMIT 5;

# Exit
\q
```

---

## Troubleshooting

### Issue: "connection refused" when calling gRPC service

**Symptoms**: GraphQL Gateway cannot connect to Darta-Chalani service

**Solution**:
```bash
# Check if Darta-Chalani is running
lsof -i :9000

# Check logs
# Review terminal output of Darta-Chalani service

# Verify DARTA_GRPC_ADDR environment variable
echo $DARTA_GRPC_ADDR

# Should be: localhost:9000 (or darta-chalani:9000 if in Docker)
```

### Issue: "unauthorized" from Oathkeeper

**Symptoms**: HTTP 401 errors when calling GraphQL endpoint

**Solution**:
```bash
# Verify JWT token is valid
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# Check Keycloak is running
curl http://localhost:8083/realms/palika/.well-known/openid-configuration

# Check Oathkeeper logs
docker-compose logs oathkeeper | grep -i error

# Verify Oathkeeper can reach Keycloak
docker-compose exec oathkeeper ping keycloak
```

### Issue: "no rows in result set" errors

**Symptoms**: Database queries failing with empty result errors

**Solution**:
```bash
# Check migrations were applied
goose -dir services/darta-chalani/internal/dbutil/migrations postgres "$DATABASE_DSN" status

# Re-run migrations if needed
goose -dir services/darta-chalani/internal/dbutil/migrations postgres "$DATABASE_DSN" up

# Check table structure
psql "$DATABASE_DSN" -c "\d dartas"
```

### Issue: PDP authorization errors

**Symptoms**: HTTP 403 errors after successful authentication

**Solution**:
```bash
# Check PDP is running
curl http://localhost:8080/healthz

# Check PDP logs
docker-compose logs pdp | tail -50

# Verify PDP configuration
# Review policies/pdp/policy.yaml (if exists)

# For development, you can temporarily bypass PDP:
# Edit policies/oathkeeper/base/graphql_gateway.json
# Change "handler": "remote_json" to "handler": "allow"
# Restart Oathkeeper
```

### Issue: GraphQL errors in response

**Symptoms**: GraphQL returns errors instead of data

**Solution**:
```bash
# Check GraphQL Gateway logs
# Review terminal output

# Verify gRPC service is reachable
grpcurl -plaintext localhost:9000 grpc.health.v1.Health/Check

# Test GraphQL query directly (bypass Oathkeeper)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}'
```

---

## Production Deployment Notes

### 1. Use Production-Ready Database

- Use YugabyteDB or PostgreSQL with replication
- Configure connection pooling (max 25 connections recommended)
- Enable SSL/TLS for database connections
- Set up regular backups

### 2. Use Proper Secret Management

```bash
# Don't use environment variables for secrets in production
# Use:
# - Kubernetes Secrets
# - HashiCorp Vault
# - AWS Secrets Manager
# - Azure Key Vault
```

### 3. Configure Logging

```bash
# Set LOG_LEVEL=info (not debug) in production
# Configure log aggregation:
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - Grafana Loki
# - CloudWatch Logs

# Enable structured JSON logging
export LOG_FORMAT=json
```

### 4. Enable Monitoring

```bash
# Add Prometheus metrics endpoints
# Configure alerting for:
# - Service downtime
# - High error rates (>1%)
# - Slow response times (p95 >500ms)
# - Database connection pool exhaustion
# - Memory usage >80%
```

### 5. Configure Rate Limiting

- Add rate limiting in Oathkeeper or GraphQL Gateway
- Per-user limits: 100 req/min
- Per-IP limits: 1000 req/min
- Implement GraphQL query complexity limits

### 6. HTTPS/TLS

```bash
# Use TLS certificates for all external endpoints
# Configure in Oathkeeper or use reverse proxy (nginx, Traefik)
# Redirect HTTP to HTTPS
# Use HSTS headers
```

### 7. Container Orchestration

For production, use Kubernetes instead of Docker Compose:

```yaml
# Example Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: darta-chalani
spec:
  replicas: 3
  selector:
    matchLabels:
      app: darta-chalani
  template:
    metadata:
      labels:
        app: darta-chalani
    spec:
      containers:
      - name: dartasvc
        image: epalika/darta-chalani:v1.0.0
        ports:
        - containerPort: 9000
        env:
        - name: DATABASE_DSN
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: dsn
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command: ["/bin/grpc_health_probe", "-addr=:9000"]
          initialDelaySeconds: 5
        readinessProbe:
          exec:
            command: ["/bin/grpc_health_probe", "-addr=:9000"]
          initialDelaySeconds: 5
```

---

## Rollback Plan

### If Deployment Fails

1. **Stop new services**:
   ```bash
   # Stop Darta-Chalani
   # Ctrl+C in the terminal running dartasvc

   # Stop GraphQL Gateway
   # Ctrl+C in the terminal running gateways

   # Stop Oathkeeper
   docker-compose stop oathkeeper
   ```

2. **Rollback database migrations**:
   ```bash
   cd services/darta-chalani
   goose -dir internal/dbutil/migrations postgres "$DATABASE_DSN" down
   ```

3. **Restore from backup** (if database was modified):
   ```bash
   # Restore PostgreSQL backup
   psql "$DATABASE_DSN" < backup_file.sql
   ```

4. **Review logs** to identify the issue

5. **Fix and redeploy** once issue is resolved

---

## Success Criteria

✅ All services running and healthy
✅ Health checks passing
✅ Authentication working via Keycloak
✅ Authorization enforced by PDP
✅ GraphQL queries returning data
✅ Database migrations applied
✅ Can create, read, update Darta records
✅ Audit trail being created
✅ Multi-tenant isolation working

---

## Next Steps After Deployment

1. **Load Testing**: Use k6 or similar to test under load
2. **Security Audit**: Penetration testing, vulnerability scanning
3. **User Acceptance Testing**: Have end-users test the system
4. **Monitoring Setup**: Configure Prometheus, Grafana dashboards
5. **Backup Verification**: Test restore procedures
6. **Documentation**: Update operational runbooks
7. **Training**: Train administrators and users

---

For more details, see:
- [README.md](./README.md) - Project overview
- [TESTING.md](./TESTING.md) - Testing guide
- [plan.md](./plan.md) - Implementation plan
- [services/graphql-gateway/ARCHITECTURE.md](./services/graphql-gateway/ARCHITECTURE.md) - Architecture details
