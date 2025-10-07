#!/usr/bin/env bash
set -euo pipefail

# ==========================================
# Keycloak Tenant Deletion (Enterprise-grade)
# ==========================================

if command -v tput >/dev/null 2>&1; then
  BOLD=$(tput bold); DIM=$(tput dim); RED=$(tput setaf 1); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RESET=$(tput sgr0)
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi

echo "${BOLD}🏛️  Keycloak Tenant Deletion${RESET}"
echo "--------------------------------"

# ---- Dependencies ----
for tool in curl jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Required tool '$tool' not found in PATH"
    exit 1
  fi
done

# ---- Defaults (override via .env or env) ----
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

KEYCLOAK_BASE_URL=${KEYCLOAK_BASE_URL:-http://localhost:8083}
KEYCLOAK_ADMIN_USER=${KEYCLOAK_ADMIN_USER:-admin}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-admin}

# OpenFGA (optional cleanup)
OPENFGA_API_URL=${OPENFGA_API_URL:-}
FGA_STORE_ID=${FGA_STORE_ID:-}
# FGA model id only needed for writes; deletes in batches also require it for consistency
FGA_MODEL_ID=${FGA_MODEL_ID:-}

# ---- CLI args ----
TENANT_SLUG=""
BACKUP_PATH=""
YES="false"
DRY_RUN="false"
FGA_CLEANUP="false"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  -r, --realm <slug>         Tenant realm/slug to delete (required)
  -y, --yes                  Do not prompt for confirmation
  -n, --dry-run              Show what would happen, do not perform deletion
  -b, --backup <file.json>   Save a partial export of the realm to the given path before deletion
  --fga-cleanup              Attempt targeted OpenFGA tuple cleanup for this tenant
  -h, --help                 Show this help

Environment:
  KEYCLOAK_BASE_URL          (default: ${KEYCLOAK_BASE_URL})
  KEYCLOAK_ADMIN_USER        (default: ${KEYCLOAK_ADMIN_USER})
  KEYCLOAK_ADMIN_PASSWORD    (default: **hidden**)
  OPENFGA_API_URL            (optional; enables FGA cleanup)
  FGA_STORE_ID               (optional; enables FGA cleanup)
  FGA_MODEL_ID               (optional; used for FGA delete/write operations)

Examples:
  $(basename "$0") -r palika_bagmati -b backup/palika_bagmati.json
  $(basename "$0") --realm palika_bagmati --yes --fga-cleanup
  $(basename "$0") -r palika_bagmati --dry-run
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--realm) TENANT_SLUG="$2"; shift 2;;
    -y|--yes) YES="true"; shift;;
    -n|--dry-run) DRY_RUN="true"; shift;;
    -b|--backup) BACKUP_PATH="$2"; shift 2;;
    --fga-cleanup) FGA_CLEANUP="true"; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [ -z "$TENANT_SLUG" ]; then
  echo "❌ --realm <slug> is required"
  usage
  exit 1
fi

if [ "$TENANT_SLUG" = "master" ]; then
  echo "❌ Refusing to delete the 'master' realm."
  exit 1
fi

# ---- Auth to Keycloak ----
echo "🔐 Authenticating with Keycloak at ${KEYCLOAK_BASE_URL}..."
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

# ---- Check realm existence ----
REALM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}")

if [ "$REALM_STATUS" != "200" ]; then
  echo "⚠️  Realm '${TENANT_SLUG}' was not found (HTTP ${REALM_STATUS}). Nothing to delete."
  exit 0
fi

# ---- Summary ----
echo ""
echo "${BOLD}Plan:${RESET}"
echo "  Realm:        ${TENANT_SLUG}"
if [ -n "$BACKUP_PATH" ]; then
  echo "  Backup file:  ${BACKUP_PATH}"
fi
echo "  FGA cleanup:  ${FGA_CLEANUP}"
echo "  Dry-run:      ${DRY_RUN}"

if [ "$YES" != "true" ]; then
  echo ""
  read -r -p "${YELLOW}⚠️  This will DELETE the realm '${TENANT_SLUG}'. Proceed? (yes/no) ${RESET}" CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# ---- Backup (optional) ----
if [ -n "$BACKUP_PATH" ]; then
  echo "🧰 Exporting partial realm backup to ${BACKUP_PATH} ..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "   ${DIM}(dry-run) Would POST /admin/realms/${TENANT_SLUG}/partial-export with clients+groups/roles${RESET}"
  else
    mkdir -p "$(dirname "$BACKUP_PATH")"
    # Partial export: include clients and groups/roles (users not included by default; optional)
    # You can also add users: exportUsers=true, but payload shape differs across versions.
    EXPORT_PAYLOAD='{"exportClients":true,"exportGroupsAndRoles":true}'
    EXPORT_JSON=$(curl -s \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}/partial-export" \
      -d "$EXPORT_PAYLOAD")
    if [ -z "$EXPORT_JSON" ] || [ "$EXPORT_JSON" = "null" ]; then
      echo "❌ Export returned empty response"
      exit 1
    fi
    echo "$EXPORT_JSON" | jq '.' > "$BACKUP_PATH"
    echo "   ${GREEN}Backup saved.${RESET}"
  fi
fi

# ---- OpenFGA cleanup (optional) ----
if [ "$FGA_CLEANUP" = "true" ]; then
  if [ -z "${OPENFGA_API_URL}" ] || [ -z "${FGA_STORE_ID}" ]; then
    echo "⚠️  FGA cleanup requested but OPENFGA_API_URL or FGA_STORE_ID not set. Skipping."
  else
    echo "🧹 OpenFGA cleanup for tenant:${TENANT_SLUG} ..."
    if [ "$DRY_RUN" = "true" ]; then
      echo "   ${DIM}(dry-run) Would read & delete tuples with object=tenant:${TENANT_SLUG}${RESET}"
      echo "   ${DIM}(dry-run) Would delete tuples for numbering_resource:darta.${TENANT_SLUG} and chalani.${TENANT_SLUG}${RESET}"
    else
      # Helper to delete all tuples for a given object
      fga_delete_by_object() {
        local object="$1"
        echo "   • Sweeping tuples for object='${object}'"
        local continuation_token=""
        local page=1
        while : ; do
          # Read tuples page
          READ_URL="${OPENFGA_API_URL}/stores/${FGA_STORE_ID}/read"
          RESP=$(curl -s -G \
            --data-urlencode "object=${object}" \
            --data-urlencode "page_size=200" \
            ${continuation_token:+--data-urlencode "continuation_token=${continuation_token}"} \
            "$READ_URL")

          # Extract tuples and next token
          TUPLES=$(echo "$RESP" | jq -c '.tuples[]? // empty')
          continuation_token=$(echo "$RESP" | jq -r '.continuation_token // empty')

          if [ -z "$TUPLES" ]; then
            # no more tuples on this page
            :
          else
            # Build delete payload
            DELETE_KEYS=$(echo "$RESP" | jq -c --arg obj "$object" '
              { tuple_keys: [ .tuples[] | { object: .key.object, relation: .key.relation, user: .key.user } ] }')

            # Submit delete
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              -H "Content-Type: application/json" \
              ${FGA_MODEL_ID:+"-H"} ${FGA_MODEL_ID:+"Authorization-Model-Id: ${FGA_MODEL_ID}"} \
              -X POST "${OPENFGA_API_URL}/stores/${FGA_STORE_ID}/delete" \
              -d "$DELETE_KEYS")

            if [ "$STATUS" != "200" ] && [ "$STATUS" != "204" ]; then
              echo "     ${RED}Failed to delete tuples for ${object} (HTTP ${STATUS})${RESET}"
              break
            else
              COUNT=$(echo "$DELETE_KEYS" | jq '.tuple_keys | length')
              echo "     Deleted ${COUNT} tuples (page ${page})"
            fi
          fi

          if [ -z "$continuation_token" ] || [ "$continuation_token" = "null" ]; then
            break
          fi
          page=$((page+1))
        done
      }

      # Delete tenant object tuples and common related resources
      fga_delete_by_object "tenant:${TENANT_SLUG}" || true
      fga_delete_by_object "numbering_resource:darta.${TENANT_SLUG}" || true
      fga_delete_by_object "numbering_resource:chalani.${TENANT_SLUG}" || true

      echo "   ${GREEN}OpenFGA cleanup done.${RESET}"
    fi
  fi
fi

# ---- Delete realm ----
echo "🗑️  Deleting Keycloak realm '${TENANT_SLUG}' ..."
if [ "$DRY_RUN" = "true" ]; then
  echo "   ${DIM}(dry-run) Would DELETE ${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}${RESET}"
else
  DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X DELETE "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}")
  if [ "$DEL_STATUS" != "204" ]; then
    echo "❌ Failed to delete realm (HTTP ${DEL_STATUS})"
    exit 1
  fi
  echo "   ${GREEN}Realm deletion request accepted (204).${RESET}"

  # Verify gone
  sleep 1
  CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${TENANT_SLUG}")
  if [ "$CHECK" = "404" ]; then
    echo "   ${GREEN}Verified: realm no longer exists.${RESET}"
  else
    echo "   ${YELLOW}Note: verification returned HTTP ${CHECK}. The realm may still be deleting asynchronously.${RESET}"
  fi
fi

echo ""
echo "${BOLD}✅ Completed.${RESET}"
if [ -n "$BACKUP_PATH" ]; then
  echo "Backup file: ${BACKUP_PATH}"
fi
if [ "$DRY_RUN" = "true" ]; then
  echo "(dry-run) No changes were made."
fi
