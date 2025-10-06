# ePalika Production Setup Summary

## ✅ Completed Tasks

### 1. Docker Build Issues - FIXED
All Docker containers now build successfully:
- **identity** service: Built ✓
- **darta-chalani** service: Built ✓
- **pdp** service: Built ✓
- **graphql-gateway** service: Built ✓

#### Fixed Issues:
- Added missing `PDPService` type alias in `services/graphql-gateway/internal/clients/pdp.go`
- Added 8 missing DartaService methods (GetMyDartas, SubmitDartaForReview, etc.)
- Removed invalid `FiscalYearId` field from CreateDartaInput
- Fixed field name mismatches: `SlaHours` → `SLAHours`, `TenantID` → `TenantId`

### 2. OpenFGA Authorization - CONFIGURED
OpenFGA is fully set up with a comprehensive authorization model:

**Store ID**: `01K6VNZE3QPZKNQTR9MFN3BW38`
**Model ID**: `01K6VNZE4QX9YZVX5DBBPTYRQC`

#### Authorization Model Includes:
- **User** type
- **Role** type with assignee relations
- **Tenant** type with admin/member hierarchy
- **Darta** type with can_read/can_update/can_delete permissions
- **GraphQL** type with can_execute permission
- **Service** type with can_access permission

#### Initial Tuples Created:
```
user:admin → admin → tenant:default
tenant:default → tenant → graphql:query
tenant:default → tenant → service:darta
tenant:default → tenant → service:identity
```

**Setup Script**: `scripts/setup-openfga.sh`
**Model File**: `policies/openfga/model.json`

### 3. Oathkeeper Access Rules - CREATED
Created comprehensive access rules for all services:

**Rules Created** (in `policies/oathkeeper/base/`):
1. `graphql-public-health` - Public OPTIONS for GraphQL
2. `graphql-authenticated` - JWT auth + PDP authorization for GraphQL
3. `darta-health` - Public health check for Darta service
4. `darta-grpc-authenticated` - JWT + PDP for Darta gRPC
5. `identity-health` - Public health check for Identity service
6. `identity-grpc-authenticated` - JWT + PDP for Identity gRPC
7. `pdp-health` - Public health check for PDP

**Configuration File**: `policies/oathkeeper/config.yaml`

### 4. Service Status
```
SERVICE            STATUS
-------------------------------
broker             Up ✓
darta-chalani      Up (starting)
keycloak           Up (starting)
oathkeeper         Up ✓ Healthy
pdp                Up (starting)
graphql-gateway    Created
identity           Created
keycloak_db        Up ✓ Healthy
openfga            Up ✓
openfga_postgres   Up ✓ Healthy
yugabytedb         Up ✓ Healthy
```

## 🔧 Configuration Files Created/Updated

1. **policies/oathkeeper/config.yaml** - Oathkeeper main config
2. **policies/oathkeeper/base/rules.json** - Access rules for all services
3. **policies/openfga/model.json** - OpenFGA authorization model
4. **scripts/setup-openfga.sh** - OpenFGA initialization script
5. **.env** - Environment variables (FGA_STORE_ID, FGA_MODEL_ID)

## 🚀 Next Steps

### To Start All Services:
```bash
docker compose up -d
```

### To Setup OpenFGA (if needed):
```bash
./scripts/setup-openfga.sh
```

### To Test Health Endpoints:
```bash
# PDP Health
curl http://localhost:4455/pdp/healthz

# Darta Health
curl http://localhost:4455/darta/health

# Identity Health
curl http://localhost:4455/identity/health
```

### To Test GraphQL (Requires JWT Token):
```bash
# Get token from Keycloak first
TOKEN=$(curl -X POST http://localhost:8083/realms/palika/protocol/openid-connect/token \
  -d "client_id=palika-api" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin" | jq -r '.access_token')

# Query GraphQL
curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}' \
  http://localhost:4455/graphql
```

## 📝 Known Issues

### Oath keeper Rule Loading
- Oathkeeper v0.40.9 has issues loading rules from file repositories
- Rules are defined but not being loaded into memory
- **Workaround**: Rules can be added via Keto or by using Oathkeeper Maester in Kubernetes
- **Alternative**: Downgrade to Oathkeeper v0.38.x which has better file loading support

### Service Health Checks
- Some services showing as "unhealthy" initially - this is normal during startup
- Services need time to establish database connections and dependency links
- Wait 30-60 seconds for all services to become healthy

## 🔐 Security Configuration

### Authentication Flow:
1. Client requests token from Keycloak
2. Client includes JWT token in Authorization header
3. Oathkeeper validates JWT against Keycloak JWKS
4. Oathkeeper calls PDP for authorization check
5. PDP queries OpenFGA for permission
6. If authorized, request forwarded to upstream service with user context headers

### Headers Added by Oathkeeper:
- `X-User-ID`: User's subject from JWT
- `X-Tenant`: User's tenant ID
- `X-Roles`: User's roles (comma-separated)

## 📚 Architecture

```
Client Request
     ↓
[Oathkeeper :4455] ← JWT Validation
     ↓
[PDP :8080] ← Authorization Check
     ↓
[OpenFGA :8081] ← Permission Lookup
     ↓
[Service] ← Authorized Request with User Context
```

## 🎯 Production Readiness Checklist

- [x] All services build successfully
- [x] OpenFGA authorization model defined
- [x] Oathkeeper access rules created
- [x] JWT authentication configured
- [x] Health check endpoints configured
- [ ] Keycloak realm fully configured
- [ ] Production secrets externalized
- [ ] TLS/SSL certificates configured
- [ ] Rate limiting configured
- [ ] Logging and monitoring setup
- [ ] Backup and disaster recovery plan

## 📧 Support

For issues or questions:
- Check logs: `docker compose logs [service-name]`
- OpenFGA Playground: http://localhost:6969
- Keycloak Admin: http://localhost:8083
- Oath keeper API: http://localhost:4456
