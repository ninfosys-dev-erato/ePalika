#!/usr/bin/env bash
set -euo pipefail

if command -v tput >/dev/null 2>&1; then
  BOLD=$(tput bold); RESET=$(tput sgr0)
else
  BOLD=""; RESET=""
fi

echo "${BOLD}🏛️  ePalika Tenant Provisioning${RESET}"
echo "------------------------------------"

for tool in curl jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Required tool '$tool' not found in PATH"
    exit 1
  fi
done

if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

# ===== Inputs =====
read -rp "Tenant slug (e.g. palika_bagmati): " TENANT_SLUG
TENANT_SLUG=$(echo "$TENANT_SLUG" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
if [ -z "$TENANT_SLUG" ]; then
  echo "❌ Tenant slug is required"
  exit 1
fi

DEFAULT_DISPLAY_NAME=$(echo "$TENANT_SLUG" | tr '_-' ' ' | awk '{for (i=1;i<=NF;i++) {$i=toupper(substr($i,1,1)) substr($i,2)}}1')
read -rp "Tenant display name [${DEFAULT_DISPLAY_NAME}]: " TENANT_DISPLAY
TENANT_DISPLAY=${TENANT_DISPLAY:-$DEFAULT_DISPLAY_NAME}

read -rp "OAuth client redirect URI [http://localhost:8000/*]: " CLIENT_REDIRECT_URI
CLIENT_REDIRECT_URI=${CLIENT_REDIRECT_URI:-http://localhost:8000/*}

read -rp "OAuth client web origin [http://localhost:8000]: " CLIENT_WEB_ORIGIN
CLIENT_WEB_ORIGIN=${CLIENT_WEB_ORIGIN:-http://localhost:8000}

read -rp "Initial OpenFGA admin subject (e.g. user:admin) [user:admin]: " TENANT_ADMIN_SUBJECT
TENANT_ADMIN_SUBJECT=${TENANT_ADMIN_SUBJECT:-user:admin}

KEYCLOAK_BASE_URL=${KEYCLOAK_BASE_URL:-http://localhost:8083}
KEYCLOAK_ADMIN_USER=${KEYCLOAK_ADMIN_USER:-admin}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-admin}

CLIENT_ID=${CLIENT_ID:-palika_api}
CLIENT_SECRET=""

OPENFGA_API_URL=${OPENFGA_API_URL:-http://localhost:8081}
FGA_STORE_ID=${FGA_STORE_ID:-}
FGA_MODEL_ID=${FGA_MODEL_ID:-}

# ===== Auth =====
echo ""
echo "🔐 Authenticating with Keycloak..."
TOKEN=$(curl -s \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN_USER}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  "${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token" | jq -r '.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to obtain Keycloak admin token"
  exit 1
fi

# ===== Realm ensure =====
REALM_CHECK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}")

if [ "$REALM_CHECK_STATUS" = "200" ]; then
  echo "⚠️  Realm '${TENANT_SLUG}' already exists — skipping creation"
else
  echo "🏗️  Creating Keycloak realm '${TENANT_SLUG}'..."
  REALM_PAYLOAD=$(jq -n \
    --arg realm "$TENANT_SLUG" \
    --arg display "$TENANT_DISPLAY" \
    '{
        realm: $realm,
        displayName: $display,
        enabled: true,
        internationalizationEnabled: true,
        defaultLocale: "en",
        registrationAllowed: false,
        loginWithEmailAllowed: true,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true
     }')

  CREATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X POST "${KEYCLOAK_BASE_URL}/admin/realms" \
    -d "$REALM_PAYLOAD")

  if [ "$CREATE_STATUS" != "201" ]; then
    echo "❌ Failed to create realm (status $CREATE_STATUS)"
    exit 1
  fi
fi

# ===== Roles ensure =====
declare -a ROLES=(
  "darta_clerk:Create and manage incoming correspondence drafts"
  "darta_reviewer:Review and route Darta records"
  "darta_registrar:Finalize, archive, and close Darta records"
  "chalani_dispatcher:Draft and dispatch outgoing correspondence"
  "chalani_approver:Approve Chalani letters and manage queues"
  "numbering_officer:Allocate Darta/Chalani number ranges"
  "identity_admin:Administer identity and grants"
)

echo "🧩 Ensuring realm roles are present..."
for role_def in "${ROLES[@]}"; do
  role_name=${role_def%%:*}
  role_desc=${role_def#*:}
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/roles/${role_name}")
  if [ "$STATUS" = "200" ]; then
    echo "   • ${role_name} (exists)"
    continue
  fi

  ROLE_PAYLOAD=$(jq -n --arg name "$role_name" --arg desc "$role_desc" '{name: $name, description: $desc}')
  CREATE_ROLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/roles" \
    -d "$ROLE_PAYLOAD")

  if [ "$CREATE_ROLE_STATUS" != "201" ]; then
    echo "❌ Failed to create role '${role_name}' (status ${CREATE_ROLE_STATUS})"
    exit 1
  fi
  echo "   • ${role_name} (created)"
done

# ===== Client ensure =====
echo "🔑 Ensuring client '${CLIENT_ID}' exists..."
CLIENT_LOOKUP=$(curl -s \
  -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients?clientId=${CLIENT_ID}")
CLIENT_INTERNAL_ID=$(echo "$CLIENT_LOOKUP" | jq -r '.[0].id // empty')

if [ -z "$CLIENT_INTERNAL_ID" ]; then
  CLIENT_PAYLOAD=$(jq -n \
    --arg clientId "$CLIENT_ID" \
    --arg name "ePalika API Client" \
    --arg desc "Confidential client for ePalika GraphQL/API access" \
    --arg redirect "$CLIENT_REDIRECT_URI" \
    --arg origin "$CLIENT_WEB_ORIGIN" \
    '{
      clientId: $clientId,
      name: $name,
      description: $desc,
      protocol: "openid-connect",
      publicClient: false,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: true,
      redirectUris: [$redirect],
      webOrigins: [$origin],
      defaultClientScopes: [
        "web-origins",
        "profile",
        "roles",
        "email"
      ],
      optionalClientScopes: [
        "address",
        "phone"
      ],
      attributes: {
        "access.token.lifespan": "3600"
      }
    }')

  CREATE_CLIENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients" \
    -d "$CLIENT_PAYLOAD")

  if [ "$CREATE_CLIENT_STATUS" != "201" ] && [ "$CREATE_CLIENT_STATUS" != "204" ]; then
    echo "❌ Failed to create client '${CLIENT_ID}' (status ${CREATE_CLIENT_STATUS})"
    exit 1
  fi

  CLIENT_LOOKUP=$(curl -s \
    -H "Authorization: Bearer ${TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients?clientId=${CLIENT_ID}")
  CLIENT_INTERNAL_ID=$(echo "$CLIENT_LOOKUP" | jq -r '.[0].id // empty')

  if [ -z "$CLIENT_INTERNAL_ID" ]; then
    echo "❌ Unable to locate client identifier after creation"
    exit 1
  fi
  echo "   • ${CLIENT_ID} (created)"
else
  echo "   • ${CLIENT_ID} (exists)"
fi

# Fetch / create secret
SECRET_JSON=$(curl -s \
  -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients/${CLIENT_INTERNAL_ID}/client-secret")
CLIENT_SECRET=$(echo "$SECRET_JSON" | jq -r '.value // empty')
if [ -z "$CLIENT_SECRET" ]; then
  SECRET_JSON=$(curl -s \
    -H "Authorization: Bearer ${TOKEN}" \
    -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients/${CLIENT_INTERNAL_ID}/client-secret")
  CLIENT_SECRET=$(echo "$SECRET_JSON" | jq -r '.value // empty')
fi
if [ -z "$CLIENT_SECRET" ]; then
  echo "❌ Failed to retrieve client secret for '${CLIENT_ID}'"
  exit 1
fi

# ===== Client Scope with protocol mappers for extra claims =====
SCOPE_NAME=${SCOPE_NAME:-epalika-default}
echo "🧱 Ensuring client scope '${SCOPE_NAME}' with custom claims exists..."

# Lookup scope
SCOPE_LIST=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/client-scopes")
SCOPE_ID=$(echo "$SCOPE_LIST" | jq -r --arg name "$SCOPE_NAME" '.[] | select(.name==$name) | .id // empty')

if [ -z "$SCOPE_ID" ]; then
  SCOPE_PAYLOAD=$(jq -n --arg name "$SCOPE_NAME" '{
    name: $name, description: "ePalika default JWT claims (user_id, user_name, tenant, roles)",
    protocol: "openid-connect"
  }')
  CREATE_SCOPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/client-scopes" \
    -d "$SCOPE_PAYLOAD")
  if [ "$CREATE_SCOPE_STATUS" != "201" ] && [ "$CREATE_SCOPE_STATUS" != "204" ]; then
    echo "❌ Failed to create client scope '${SCOPE_NAME}' (status ${CREATE_SCOPE_STATUS})"
    exit 1
  fi
  # Re-fetch ID
  SCOPE_LIST=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/client-scopes")
  SCOPE_ID=$(echo "$SCOPE_LIST" | jq -r --arg name "$SCOPE_NAME" '.[] | select(.name==$name) | .id // empty')
  echo "   • ${SCOPE_NAME} (created)"
else
  echo "   • ${SCOPE_NAME} (exists)"
fi

# Helper: ensure a protocol mapper exists on a client scope by name
ensure_mapper () {
  local mapper_name="$1"
  local payload_json="$2"
  local existing=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/client-scopes/${SCOPE_ID}/protocol-mappers/models" \
    | jq -r --arg name "$mapper_name" '.[] | select(.name==$name) | .id // empty')
  if [ -n "$existing" ]; then
    echo "   • mapper '${mapper_name}' (exists)"
  else
    local st=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/client-scopes/${SCOPE_ID}/protocol-mappers/models" \
      -d "$payload_json")
    if [ "$st" != "201" ] && [ "$st" != "204" ]; then
      echo "❌ Failed to create mapper '${mapper_name}' (status ${st})"
      exit 1
    fi
    echo "   • mapper '${mapper_name}' (created)"
  fi
}

echo "🧬 Adding protocol mappers (user_id, user_name, tenant, roles)..."

# 1) user_id via Hardcoded Claim Mapper (copies 'sub' to 'user_id')
# Note: Keycloak's 'sub' claim already contains the user ID, we just alias it
USER_ID_MAPPER=$(jq -n '{
  name: "user_id",
  protocol: "openid-connect",
  protocolMapper: "oidc-hardcoded-claim-mapper",
  config: {
    "claim.name": "user_id",
    "claim.value": "${sub}",
    "jsonType.label": "String",
    "access.token.claim": "true",
    "id.token.claim": "true",
    "userinfo.token.claim": "true"
  }
}')
# Since hardcoded mapper doesn't support substitution, use usermodel-property instead
USER_ID_MAPPER=$(jq -n '{
  name: "user_id",
  protocol: "openid-connect",
  protocolMapper: "oidc-usermodel-property-mapper",
  config: {
    "user.attribute": "id",
    "claim.name": "user_id",
    "jsonType.label": "String",
    "access.token.claim": "true",
    "id.token.claim": "true",
    "userinfo.token.claim": "true"
  }
}')
ensure_mapper "user_id" "$USER_ID_MAPPER"

# 2) user_name from preferred_username (Property Mapper)
USER_NAME_MAPPER=$(jq -n '{
  name: "user_name",
  protocol: "openid-connect",
  protocolMapper: "oidc-usermodel-property-mapper",
  config: {
    "user.attribute": "username",
    "claim.name": "user_name",
    "jsonType.label": "String",
    "access.token.claim": "true",
    "id.token.claim": "true",
    "userinfo.token.claim": "true"
  }
}')
ensure_mapper "user_name" "$USER_NAME_MAPPER"

# 3) tenant from user attribute "tenant" (multivalued Attribute Mapper)
TENANT_MAPPER=$(jq -n '{
  name: "tenant",
  protocol: "openid-connect",
  protocolMapper: "oidc-usermodel-attribute-mapper",
  config: {
    "user.attribute": "tenant",
    "claim.name": "tenant",
    "jsonType.label": "String",
    "multivalued": "true",
    "access.token.claim": "true",
    "id.token.claim": "true",
    "userinfo.token.claim": "true"
  }
}')
ensure_mapper "tenant" "$TENANT_MAPPER"

# 4) roles array (realm + client roles) via Realm Role Mapper
ROLES_MAPPER=$(jq -n '{
  name: "roles",
  protocol: "openid-connect",
  protocolMapper: "oidc-usermodel-realm-role-mapper",
  config: {
    "claim.name": "roles",
    "jsonType.label": "String",
    "access.token.claim": "true",
    "id.token.claim": "true",
    "userinfo.token.claim": "true",
    "multivalued": "true"
  }
}')
ensure_mapper "roles" "$ROLES_MAPPER"

# ===== Attach scope to client as default =====
echo "🔗 Attaching client scope '${SCOPE_NAME}' to client '${CLIENT_ID}' (default)..."
DEFAULT_SCOPES=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients/${CLIENT_INTERNAL_ID}/default-client-scopes")
ALREADY_ATTACHED=$(echo "$DEFAULT_SCOPES" | jq -r --arg id "$SCOPE_ID" '.[] | select(.id==$id) | .id // empty')

if [ -z "$ALREADY_ATTACHED" ]; then
  ATTACH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X PUT "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/clients/${CLIENT_INTERNAL_ID}/default-client-scopes/${SCOPE_ID}")
  if [ "$ATTACH_STATUS" != "204" ]; then
    echo "❌ Failed to attach client scope (status ${ATTACH_STATUS})"
    exit 1
  fi
  echo "   • attached as default"
else
  echo "   • already attached"
fi

# ===== OpenFGA (optional) =====
if [ -z "$FGA_STORE_ID" ] || [ -z "$FGA_MODEL_ID" ]; then
  echo "⚠️  Skipping OpenFGA propagation (FGA_STORE_ID or FGA_MODEL_ID missing)"
else
  echo "📡 Propagating authorization tuples to OpenFGA..."
  FGA_PAYLOAD=$(jq -n \
    --arg tenant "$TENANT_SLUG" \
    --arg admin "$TENANT_ADMIN_SUBJECT" \
    '{
      writes: {
        tuple_keys: [
          { object: ("tenant:" + $tenant), relation: "admin", user: $admin },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:darta_clerk#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:darta_reviewer#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:darta_registrar#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:chalani_dispatcher#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:chalani_approver#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:numbering_officer#member" },
          { object: ("tenant:" + $tenant), relation: "member", user: "role:identity_admin#member" },

          { object: "graphql_operation:darta.read", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:darta.intake", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:darta.review", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:darta.digitization", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:darta.actions", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:chalani.read", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:chalani.draft", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:chalani.review", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:chalani.dispatch", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:chalani.manageQueues", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:numbering.read", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:numbering.allocate", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:identity.read", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:identity.directoryAdmin", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:identity.grantAdmin", relation: "tenant", user: ("tenant:" + $tenant) },
          { object: "graphql_operation:identity.roleAdmin", relation: "tenant", user: ("tenant:" + $tenant) },

          { object: ("numbering_resource:darta." + $tenant), relation: "tenant", user: ("tenant:" + $tenant) },
          { object: ("numbering_resource:chalani." + $tenant), relation: "tenant", user: ("tenant:" + $tenant) }
        ]
      }
    }')

  FGA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization-Model-Id: ${FGA_MODEL_ID}" \
    -X POST "${OPENFGA_API_URL}/stores/${FGA_STORE_ID}/write" \
    -d "$FGA_PAYLOAD")

  if [ "$FGA_STATUS" != "200" ] && [ "$FGA_STATUS" != "204" ]; then
    echo "❌ Failed to write OpenFGA tuples (status ${FGA_STATUS})"
    exit 1
  fi
fi

# ===== Output =====
echo ""
echo "🎉 Tenant '${TENANT_SLUG}' provisioned successfully!"
echo "   Realm URL: ${KEYCLOAK_BASE_URL}/realms/${TENANT_SLUG}"
echo "   Display:   ${TENANT_DISPLAY}"
echo "   Client:    ${CLIENT_ID}"
echo "   Redirect:  ${CLIENT_REDIRECT_URI}"
echo "   WebOrigin: ${CLIENT_WEB_ORIGIN}"
if [ -n "$CLIENT_SECRET" ]; then
  echo "   Client secret: ${CLIENT_SECRET}"
fi
echo "   Client Scope: ${SCOPE_NAME} (attached as default)"
echo "   Claims added: user_id (String), user_name (String), tenant (String[]), roles (String[])"
if [ -n "$FGA_STORE_ID" ] && [ -n "$FGA_MODEL_ID" ]; then
  echo "   OpenFGA tenant object: tenant:${TENANT_SLUG}"
fi

echo ""
echo "Next steps:"
echo "  1) For each user, set attribute 'tenant' (can be multivalued)."
echo "  2) Assign realm/client roles to users or groups."
echo "  3) Decode a fresh access token and verify claims:"
echo "     - user_id, user_name, tenant[], roles[]"
echo "  4) Your gateway template can now use:"
echo "       X-User-ID:    {{ print .Extra.user_id }}"
echo "       X-User-Name:  {{ .Extra.user_name }}"
echo "       X-Tenant:     {{ if .Extra.tenant }}{{ index .Extra.tenant 0 }}{{ else }}default{{ end }}"
echo "       X-Roles:      {{- range \$i, \$r := .Extra.roles -}}{{- if \$i }},{{ end -}}{{ \$r }}{{- end -}}"
