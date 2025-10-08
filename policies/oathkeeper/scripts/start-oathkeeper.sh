#!/bin/sh
set -euo pipefail

REALM="${KEYCLOAK_REALM:-palika_hari}"
CONFIG_TEMPLATE="/oathkeeper/config.yaml"
CONFIG_RENDERED="/tmp/config-runtime.yaml"
TARGET_FILE="/etc/secrets/keycloak_${REALM}.jwks.json"
JWKS_URL="http://keycloak:8083/realms/${REALM}/protocol/openid-connect/certs"

echo "🏛️  Oathkeeper Init for realm: $REALM"
echo "-----------------------------------"

# Ensure writable secrets dir
mkdir -p /etc/secrets
chmod 755 /etc/secrets

echo "🧩 Rendering config with envsubst..."
envsubst < "$CONFIG_TEMPLATE" > "$CONFIG_RENDERED"
echo "✅ Config rendered -> $CONFIG_RENDERED"

echo "🌐 Fetching JWKS from $JWKS_URL ..."
if ! curl -sf "$JWKS_URL" | jq '{keys: [.keys[] | select(.use == "sig")]}' > "$TARGET_FILE"; then
  echo "❌ Failed to fetch JWKS"
  exit 1
fi

if [ ! -s "$TARGET_FILE" ]; then
  echo "❌ JWKS file empty"
  exit 1
fi

chown ory:ory "$TARGET_FILE"
chmod 644 "$TARGET_FILE"

COUNT=$(jq '.keys | length' "$TARGET_FILE" || echo 0)
echo "✅ JWKS written ($COUNT signing keys)"

# Periodic background refresh
(
  while true; do
    sleep 900
    echo "🔄 Refreshing JWKS for $REALM..."
    curl -sf "$JWKS_URL" | jq '{keys: [.keys[] | select(.use == "sig")]}' > "$TARGET_FILE" \
      && echo "✅ JWKS refreshed" \
      || echo "⚠️ JWKS refresh failed"
  done
) &

echo "🚀 Launching Oathkeeper..."
exec oathkeeper serve --config "$CONFIG_RENDERED"
