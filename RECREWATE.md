# ePalika JWT Authentication Implementation Guide

This document explains how to recreate the JWT authentication setup for the ePalika gateway system.

## System Overview

The ePalika authentication system uses:
- **Keycloak** (Identity Provider - OIDC/JWT tokens)
- **ORY Oathkeeper** (Policy Enforcement Point - API Gateway)
- **OpenFGA** (Relationship-based authorization)
- **Custom PDP** (Policy Decision Point - Go service)
- **Upstream Services** (e.g., darta-chalani)

## Architecture Flow

```
Client ’ [JWT Token] ’ Oathkeeper ’ PDP ’ OpenFGA ’ Decision ’ Upstream
```

1. Client obtains JWT token from Keycloak
2. Oathkeeper validates JWT and extracts claims
3. PDP receives authorization request with user context
4. PDP queries OpenFGA for relationship-based permissions
5. If allowed, request is proxied to upstream service

## Step-by-Step Implementation

### 1. Environment Setup

First, ensure your environment has the correct OpenFGA store and model IDs:

```bash
# Create .env file with OpenFGA configuration
cat > .env << 'EOF'
FGA_STORE=01K685PX9Y4PHVXPBHD51Q4B0H
FGA_MODEL_ID=01K685VM1JGR2DJSBJ5JBY3HWH
EOF
```

### 2. Keycloak Configuration

#### Create Realm and Client

```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8083/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin&grant_type=password&client_id=admin-cli" | jq -r '.access_token')

# Create epalika realm
curl -X POST http://localhost:8083/admin/realms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "epalika",
    "enabled": true,
    "displayName": "ePalika",
    "accessTokenLifespan": 300,
    "accessTokenLifespanForImplicitFlow": 900,
    "ssoSessionIdleTimeout": 1800,
    "ssoSessionMaxLifespan": 36000,
    "offlineSessionIdleTimeout": 2592000,
    "accessCodeLifespan": 60,
    "accessCodeLifespanUserAction": 300,
    "accessCodeLifespanLogin": 1800
  }'

# Create gateway client
curl -X POST http://localhost:8083/admin/realms/epalika/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "gateway",
    "name": "API Gateway",
    "description": "OAuth client for the API gateway",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "gateway-secret",
    "publicClient": false,
    "bearerOnly": false,
    "standardFlowEnabled": true,
    "implicitFlowEnabled": false,
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": true,
    "redirectUris": ["http://localhost:4455/*"],
    "webOrigins": ["http://localhost:4455"],
    "protocol": "openid-connect"
  }'
```

#### Create Test Users

```bash
# Create alice user
curl -X POST http://localhost:8083/admin/realms/epalika/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "firstName": "Alice", 
    "lastName": "Test",
    "email": "alice@epalika.test",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "alice123",
      "temporary": false
    }],
    "attributes": {
      "tenant": ["palika_bagmati"]
    }
  }'

# Create bob user
curl -X POST http://localhost:8083/admin/realms/epalika/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "firstName": "Bob",
    "lastName": "Test", 
    "email": "bob@epalika.test",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password", 
      "value": "bob123",
      "temporary": false
    }],
    "attributes": {
      "tenant": ["palika_bagmati"]
    }
  }'
```

### 3. Oathkeeper Configuration

#### Update Oathkeeper Config (`policies/oathkeeper/config.yaml`)

Add JWT authenticator to your Oathkeeper configuration:

```yaml
authenticators:
  anonymous:
    enabled: true
    config:
      subject: guest
  jwt:
    enabled: true
    config:
      jwks_urls:
        - http://keycloak:8080/realms/epalika/protocol/openid-connect/certs
      scope_strategy: wildcard
      required_scope: []
      target_audience: []
      trusted_issuers:
        - http://localhost:8083/realms/epalika
        - http://keycloak:8080/realms/epalika
```

#### Update Access Rules (`policies/oathkeeper/base/rules.json`)

Configure the rule to use JWT authentication and extract claims:

```json
[
  {
    "id": "doc-read-remotejson",
    "version": "v0.40.9",
    "upstream": {
      "url": "http://darta-chalani:9000"
    },
    "match": {
      "url": "http://<127.0.0.1|localhost>:4455/documents/<.*>",
      "methods": ["GET"]
    },
    "authenticators": [
      { "handler": "jwt" }
    ],
    "authorizer": {
      "handler": "remote_json",
      "config": {
        "remote": "http://pdp:8080/authorize",
        "payload": "{\"subject\": \"user:{{ print .Extra.preferred_username }}\", \"resource\": \"doc:palika_bagmati/{{ index .MatchContext.RegexpCaptureGroups 0 }}\", \"action\": \"can_read\", \"claims\": {\"tenant\": \"palika_bagmati\"}, \"context\": {\"time\": \"2025-09-28T14:13:00Z\"}}",
        "forward_response_headers_to_upstream": ["x-authz-decision"],
        "retry": { "give_up_after": "1s", "max_delay": "100ms" }
      }
    },
    "mutators": [
      {
        "handler": "header",
        "config": {
          "headers": {
            "X-User": "{{ print .Subject }}"
          }
        }
      }
    ]
  }
]
```

### 4. Development Helper Scripts

#### Token Acquisition Script (`scripts/get-token.sh`)

```bash
#!/bin/bash

# Get JWT token from Keycloak for epalika realm
# Usage: ./get-token.sh <username> [password]

USERNAME=${1:-alice}
PASSWORD=${2:-${USERNAME}123}
CLIENT_ID="gateway"
CLIENT_SECRET="gateway-secret"
KEYCLOAK_URL="http://localhost:8083"
REALM="epalika"

echo "Getting token for user: $USERNAME" >&2

TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${USERNAME}&password=${PASSWORD}&grant_type=password&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}" | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Error: Failed to get token for $USERNAME" >&2
  exit 1
fi

echo "$TOKEN"
```

#### Gateway Testing Script (`scripts/test-gateway.sh`)

```bash
#!/bin/bash

# Test gateway with JWT authentication
# Usage: ./test-gateway.sh <username> [document_id]

USERNAME=${1:-alice}
DOC_ID=${2:-123}
GATEWAY_URL="http://localhost:4455"

echo "Testing gateway access for user: $USERNAME, document: $DOC_ID"

# Get token
TOKEN=$(./scripts/get-token.sh "$USERNAME" 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Failed to get token for $USERNAME"
  exit 1
fi

# Test gateway
echo "Making request to ${GATEWAY_URL}/documents/${DOC_ID}"
curl -i -H "Authorization: Bearer $TOKEN" "${GATEWAY_URL}/documents/${DOC_ID}"
```

#### Makefile for Common Operations

```makefile
.PHONY: up down logs restart test-alice test-bob clean-tokens

# Docker operations
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

# Testing
test-alice:
	./scripts/test-gateway.sh alice 123

test-bob:
	./scripts/test-gateway.sh bob 123

# Token utilities  
clean-tokens:
	echo "Tokens are short-lived (5min), no cleanup needed"

# Development
dev-setup:
	@echo "ePalika Development Environment"
	@echo "Services running on:"
	@echo "  Gateway (Oathkeeper): http://localhost:4455"
	@echo "  Keycloak Admin: http://localhost:8083 (admin/admin)"
	@echo "  OpenFGA: http://localhost:8081"
	@echo "  PDP: http://localhost:8080"
	@echo "  Upstream: http://localhost:9000"
	@echo ""
	@echo "Usage:"
	@echo "  make test-alice  # Test Alice access (should work)"
	@echo "  make test-bob    # Test Bob access (should be denied when template is fixed)"
	@echo "  ./scripts/get-token.sh alice  # Get JWT token for Alice"
```

### 5. Restart Services and Test

```bash
# Restart Oathkeeper to pick up new config
docker restart epalika-oathkeeper-1

# Restart PDP to pick up environment variables
docker-compose restart pdp

# Test the complete flow
make test-alice
```

## Testing the Implementation

### Manual Testing

```bash
# Get a token for Alice
TOKEN=$(./scripts/get-token.sh alice)

# Test gateway access
curl -H "Authorization: Bearer $TOKEN" http://localhost:4455/documents/123

# Expected: 200 OK with proxied response from upstream
```

### Verify JWT Token Contents

```bash
# Decode JWT payload to see claims
echo "$TOKEN" | cut -d'.' -f2 | base64 -d | jq .
```

### Test Different Users

```bash
# Alice should have access (per OpenFGA model)
make test-alice

# Bob should be denied (per OpenFGA model)
make test-bob
```

## Key URLs and Services

- **Gateway (Oathkeeper)**: http://localhost:4455
- **Keycloak Admin Console**: http://localhost:8083 (admin/admin)
- **OpenFGA API**: http://localhost:8081
- **PDP Service**: http://localhost:8080
- **Upstream Service**: http://localhost:9000

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check JWT token is valid and not expired
2. **403 Forbidden**: Check OpenFGA permissions for the user
3. **500 Internal Server Error**: Check PDP logs for FGA connection issues

### Debug Commands

```bash
# Check Oathkeeper logs
docker logs epalika-oathkeeper-1 --tail 20

# Check PDP logs
docker logs epalika-pdp-1 --tail 20

# Test OpenFGA directly
curl -X POST "http://localhost:8081/stores/$FGA_STORE/check" \
  -H 'Content-Type: application/json' \
  -d '{"authorization_model_id":"$FGA_MODEL_ID","tuple_key":{"user":"user:alice","relation":"can_read","object":"doc:palika_bagmati/123"}}'

# Test PDP directly
curl -X POST http://localhost:8080/authorize \
  -H 'Content-Type: application/json' \
  -d '{"subject":"user:alice","resource":"doc:palika_bagmati/123","action":"can_read","claims":{"tenant":"palika_bagmati"},"context":{"time":"2025-09-28T14:13:00Z"}}'
```

## Security Considerations

1. **Token Expiration**: Tokens expire in 5 minutes (configurable in Keycloak)
2. **HTTPS**: In production, use HTTPS for all communication
3. **Secrets**: Store client secrets securely (not in code)
4. **JWKS**: Oathkeeper fetches public keys from Keycloak for JWT validation
5. **Issuer Validation**: Only tokens from trusted Keycloak issuers are accepted

## Next Steps

1. **Dynamic Payload**: Fix Oathkeeper template to extract username from JWT
2. **Multi-tenant**: Add tenant claim validation
3. **OPA Integration**: Add time-based and context-aware policies
4. **Monitoring**: Add structured logging and metrics
5. **Production**: Configure for production deployment with proper secrets management