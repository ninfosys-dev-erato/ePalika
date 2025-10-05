-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

-- name: CreateAuditEntry :one
INSERT INTO audit_trail (
    entity_type,
    entity_id,
    action,
    performed_by,
    changes,
    ip_address,
    user_agent,
    notes,
    tenant_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetAuditTrail :many
SELECT * FROM audit_trail
WHERE entity_type = $1 AND entity_id = $2
ORDER BY performed_at DESC
LIMIT $3 OFFSET $4;

-- name: GetAuditTrailByUser :many
SELECT * FROM audit_trail
WHERE performed_by = $1 AND tenant_id = $2
ORDER BY performed_at DESC
LIMIT $3 OFFSET $4;

-- name: GetAuditTrailByEntity :many
SELECT * FROM audit_trail
WHERE entity_type = $1 
  AND tenant_id = $2
  AND (sqlc.narg('from_date')::TIMESTAMPTZ IS NULL OR performed_at >= sqlc.narg('from_date'))
  AND (sqlc.narg('to_date')::TIMESTAMPTZ IS NULL OR performed_at <= sqlc.narg('to_date'))
ORDER BY performed_at DESC
LIMIT $3 OFFSET $4;

-- name: CountAuditEntries :one
SELECT COUNT(*) FROM audit_trail
WHERE entity_type = $1 AND entity_id = $2;
