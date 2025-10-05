-- ============================================================================
-- CHALANIS - Outgoing correspondence
-- ============================================================================

-- name: CreateChalani :one
INSERT INTO chalanis (
    fiscal_year_id,
    scope,
    ward_id,
    subject,
    body,
    template_id,
    linked_darta_id,
    recipient_id,
    status,
    created_by,
    tenant_id,
    idempotency_key,
    metadata
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetChalani :one
SELECT c.*, r.*
FROM chalanis c
JOIN recipients r ON c.recipient_id = r.id
WHERE c.id = $1;

-- name: GetChalaniSimple :one
SELECT * FROM chalanis WHERE id = $1;

-- name: GetChalaniByNumber :one
SELECT c.*, r.*
FROM chalanis c
JOIN recipients r ON c.recipient_id = r.id
WHERE c.chalani_number = $1 
  AND c.fiscal_year_id = $2
  AND c.scope = $3
  AND (c.ward_id = sqlc.narg('ward_id') OR (c.ward_id IS NULL AND sqlc.narg('ward_id')::VARCHAR IS NULL));

-- name: GetChalaniByIdempotencyKey :one
SELECT * FROM chalanis
WHERE idempotency_key = $1 AND tenant_id = $2;

-- name: UpdateChalaniStatus :one
UPDATE chalanis
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateChalaniNumber :one
UPDATE chalanis
SET 
    chalani_number = $2,
    formatted_chalani_number = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateChalaniApprovalStatus :one
UPDATE chalanis
SET 
    is_fully_approved = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateChalaniDispatch :one
UPDATE chalanis
SET 
    dispatch_channel = $2,
    dispatched_at = $3,
    dispatched_by = $4,
    tracking_id = sqlc.narg('tracking_id'),
    courier_name = sqlc.narg('courier_name'),
    status = 'DISPATCHED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateChalaniAcknowledgement :one
UPDATE chalanis
SET 
    is_acknowledged = true,
    acknowledged_at = $2,
    acknowledged_by = $3,
    acknowledgement_proof_id = sqlc.narg('acknowledgement_proof_id'),
    status = 'ACKNOWLEDGED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkChalaniDelivered :one
UPDATE chalanis
SET 
    delivered_at = $2,
    delivered_proof_id = sqlc.narg('delivered_proof_id'),
    status = 'DELIVERED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: VoidChalani :one
UPDATE chalanis
SET 
    status = 'VOIDED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CloseChalani :one
UPDATE chalanis
SET 
    status = 'CLOSED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- List with filtering
-- name: ListChalanis :many
SELECT c.*, r.*
FROM chalanis c
JOIN recipients r ON c.recipient_id = r.id
WHERE
    (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR c.fiscal_year_id = sqlc.narg('fiscal_year_id'))
    AND (sqlc.narg('scope')::VARCHAR IS NULL OR c.scope = sqlc.narg('scope'))
    AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR c.ward_id = sqlc.narg('ward_id'))
    AND (sqlc.narg('status')::VARCHAR IS NULL OR c.status = sqlc.narg('status'))
    AND (sqlc.narg('dispatch_channel')::VARCHAR IS NULL OR c.dispatch_channel = sqlc.narg('dispatch_channel'))
    AND (sqlc.narg('linked_darta_id')::UUID IS NULL OR c.linked_darta_id = sqlc.narg('linked_darta_id'))
    AND (sqlc.narg('created_by')::VARCHAR IS NULL OR c.created_by = sqlc.narg('created_by'))
    AND (sqlc.narg('from_date')::TIMESTAMPTZ IS NULL OR c.created_at >= sqlc.narg('from_date'))
    AND (sqlc.narg('to_date')::TIMESTAMPTZ IS NULL OR c.created_at <= sqlc.narg('to_date'))
    AND (sqlc.narg('search')::TEXT IS NULL OR c.subject ILIKE '%' || sqlc.narg('search') || '%')
    AND c.tenant_id = sqlc.arg('tenant_id')
ORDER BY c.created_at DESC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountChalanis :one
SELECT COUNT(*)
FROM chalanis c
WHERE
    (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR c.fiscal_year_id = sqlc.narg('fiscal_year_id'))
    AND (sqlc.narg('status')::VARCHAR IS NULL OR c.status = sqlc.narg('status'))
    AND (sqlc.narg('linked_darta_id')::UUID IS NULL OR c.linked_darta_id = sqlc.narg('linked_darta_id'))
    AND (sqlc.narg('from_date')::TIMESTAMPTZ IS NULL OR c.created_at >= sqlc.narg('from_date'))
    AND (sqlc.narg('to_date')::TIMESTAMPTZ IS NULL OR c.created_at <= sqlc.narg('to_date'))
    AND c.tenant_id = sqlc.arg('tenant_id');

-- name: GetMyChalani :many
SELECT c.*, r.*
FROM chalanis c
JOIN recipients r ON c.recipient_id = r.id
WHERE c.created_by = $1
  AND (sqlc.narg('status')::VARCHAR IS NULL OR c.status = sqlc.narg('status'))
  AND c.tenant_id = $2
ORDER BY c.created_at DESC
LIMIT $3 OFFSET $4;

-- Statistics
-- name: GetChalaniStatsByStatus :many
SELECT status, COUNT(*) as count
FROM chalanis
WHERE tenant_id = $1
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'))
GROUP BY status;

-- name: GetChalaniStatsByChannel :many
SELECT dispatch_channel, COUNT(*) as count
FROM chalanis
WHERE tenant_id = $1
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'))
  AND dispatch_channel IS NOT NULL
GROUP BY dispatch_channel;

-- name: GetAcknowledgementRate :one
SELECT 
    COUNT(*)::FLOAT as total,
    SUM(CASE WHEN is_acknowledged THEN 1 ELSE 0 END)::FLOAT as acknowledged
FROM chalanis
WHERE tenant_id = $1
  AND status IN ('DISPATCHED', 'ACKNOWLEDGED', 'DELIVERED')
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'));

-- name: GetNextChalaniNumber :one
SELECT COALESCE(MAX(chalani_number), 0) + 1 as next_number
FROM chalanis
WHERE fiscal_year_id = $1
  AND scope = $2
  AND (ward_id = sqlc.narg('ward_id') OR (ward_id IS NULL AND sqlc.narg('ward_id')::VARCHAR IS NULL))
  AND tenant_id = $3;
