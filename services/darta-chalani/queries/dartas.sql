-- ============================================================================
-- DARTAS - Incoming correspondence (main queries)
-- ============================================================================

-- name: CreateDarta :one
INSERT INTO dartas (
    fiscal_year_id,
    scope,
    ward_id,
    subject,
    applicant_id,
    intake_channel,
    received_date,
    entry_date,
    is_backdated,
    backdate_reason,
    backdate_approver_id,
    primary_document_id,
    status,
    priority,
    created_by,
    tenant_id,
    idempotency_key,
    metadata
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
) RETURNING *;

-- name: GetDarta :one
SELECT d.*, a.* 
FROM dartas d
JOIN applicants a ON d.applicant_id = a.id
WHERE d.id = $1;

-- name: GetDartaSimple :one
SELECT * FROM dartas WHERE id = $1;

-- name: GetDartaByNumber :one
SELECT d.*, a.*
FROM dartas d
JOIN applicants a ON d.applicant_id = a.id
WHERE d.darta_number = $1 
  AND d.fiscal_year_id = $2
  AND d.scope = $3
  AND (d.ward_id = sqlc.narg('ward_id') OR (d.ward_id IS NULL AND sqlc.narg('ward_id')::VARCHAR IS NULL));

-- name: GetDartaByIdempotencyKey :one
SELECT * FROM dartas
WHERE idempotency_key = $1 AND tenant_id = $2;

-- name: UpdateDartaStatus :one
UPDATE dartas
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateDartaNumber :one
UPDATE dartas
SET 
    darta_number = $2,
    formatted_darta_number = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateDartaClassification :one
UPDATE dartas
SET 
    classification_code = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateDartaAssignment :one
UPDATE dartas
SET 
    assigned_to_unit_id = sqlc.narg('assigned_to_unit_id'),
    current_assignee_id = sqlc.narg('current_assignee_id'),
    sla_deadline = sqlc.narg('sla_deadline'),
    priority = COALESCE(sqlc.narg('priority'), priority),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateDartaMetadata :one
UPDATE dartas
SET 
    metadata = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: VoidDarta :one
UPDATE dartas
SET 
    status = 'VOIDED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CloseDarta :one
UPDATE dartas
SET 
    status = 'CLOSED',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Complex queries with filtering
-- name: ListDartas :many
SELECT d.*, a.*
FROM dartas d
JOIN applicants a ON d.applicant_id = a.id
WHERE
    (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR d.fiscal_year_id = sqlc.narg('fiscal_year_id'))
    AND (sqlc.narg('scope')::VARCHAR IS NULL OR d.scope = sqlc.narg('scope'))
    AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR d.ward_id = sqlc.narg('ward_id'))
    AND (sqlc.narg('status')::VARCHAR IS NULL OR d.status = sqlc.narg('status'))
    AND (sqlc.narg('priority')::VARCHAR IS NULL OR d.priority = sqlc.narg('priority'))
    AND (sqlc.narg('intake_channel')::VARCHAR IS NULL OR d.intake_channel = sqlc.narg('intake_channel'))
    AND (sqlc.narg('assigned_to_unit_id')::VARCHAR IS NULL OR d.assigned_to_unit_id = sqlc.narg('assigned_to_unit_id'))
    AND (sqlc.narg('current_assignee_id')::VARCHAR IS NULL OR d.current_assignee_id = sqlc.narg('current_assignee_id'))
    AND (sqlc.narg('created_by')::VARCHAR IS NULL OR d.created_by = sqlc.narg('created_by'))
    AND (sqlc.narg('is_overdue')::BOOLEAN IS NULL OR d.is_overdue = sqlc.narg('is_overdue'))
    AND (sqlc.narg('from_date')::TIMESTAMPTZ IS NULL OR d.received_date >= sqlc.narg('from_date'))
    AND (sqlc.narg('to_date')::TIMESTAMPTZ IS NULL OR d.received_date <= sqlc.narg('to_date'))
    AND (sqlc.narg('search')::TEXT IS NULL OR d.subject ILIKE '%' || sqlc.narg('search') || '%')
    AND d.tenant_id = sqlc.arg('tenant_id')
ORDER BY 
    CASE WHEN sqlc.arg('sort_by')::TEXT = 'received_date' THEN d.received_date END DESC,
    CASE WHEN sqlc.arg('sort_by')::TEXT = 'darta_number' THEN d.darta_number END DESC,
    d.created_at DESC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountDartas :one
SELECT COUNT(*)
FROM dartas d
WHERE
    (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR d.fiscal_year_id = sqlc.narg('fiscal_year_id'))
    AND (sqlc.narg('scope')::VARCHAR IS NULL OR d.scope = sqlc.narg('scope'))
    AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR d.ward_id = sqlc.narg('ward_id'))
    AND (sqlc.narg('status')::VARCHAR IS NULL OR d.status = sqlc.narg('status'))
    AND (sqlc.narg('priority')::VARCHAR IS NULL OR d.priority = sqlc.narg('priority'))
    AND (sqlc.narg('assigned_to_unit_id')::VARCHAR IS NULL OR d.assigned_to_unit_id = sqlc.narg('assigned_to_unit_id'))
    AND (sqlc.narg('current_assignee_id')::VARCHAR IS NULL OR d.current_assignee_id = sqlc.narg('current_assignee_id'))
    AND (sqlc.narg('is_overdue')::BOOLEAN IS NULL OR d.is_overdue = sqlc.narg('is_overdue'))
    AND (sqlc.narg('from_date')::TIMESTAMPTZ IS NULL OR d.received_date >= sqlc.narg('from_date'))
    AND (sqlc.narg('to_date')::TIMESTAMPTZ IS NULL OR d.received_date <= sqlc.narg('to_date'))
    AND (sqlc.narg('search')::TEXT IS NULL OR d.subject ILIKE '%' || sqlc.narg('search') || '%')
    AND d.tenant_id = sqlc.arg('tenant_id');

-- name: GetMyDartas :many
SELECT d.*, a.*
FROM dartas d
JOIN applicants a ON d.applicant_id = a.id
WHERE d.current_assignee_id = $1
  AND (sqlc.narg('status')::VARCHAR IS NULL OR d.status = sqlc.narg('status'))
  AND d.tenant_id = $2
ORDER BY 
    CASE WHEN d.is_overdue THEN 0 ELSE 1 END,
    d.priority DESC,
    d.received_date DESC
LIMIT $3 OFFSET $4;

-- name: CountMyDartas :one
SELECT COUNT(*)
FROM dartas
WHERE current_assignee_id = $1
  AND (sqlc.narg('status')::VARCHAR IS NULL OR status = sqlc.narg('status'))
  AND tenant_id = $2;

-- Statistics queries
-- name: GetDartaStatsByStatus :many
SELECT status, COUNT(*) as count
FROM dartas
WHERE tenant_id = $1
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'))
  AND (sqlc.narg('scope')::VARCHAR IS NULL OR scope = sqlc.narg('scope'))
  AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR ward_id = sqlc.narg('ward_id'))
GROUP BY status;

-- name: GetDartaStatsByChannel :many
SELECT intake_channel, COUNT(*) as count
FROM dartas
WHERE tenant_id = $1
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'))
  AND (sqlc.narg('scope')::VARCHAR IS NULL OR scope = sqlc.narg('scope'))
  AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR ward_id = sqlc.narg('ward_id'))
GROUP BY intake_channel;

-- name: GetOverdueCount :one
SELECT COUNT(*)
FROM dartas
WHERE is_overdue = true
  AND tenant_id = $1
  AND (sqlc.narg('fiscal_year_id')::VARCHAR IS NULL OR fiscal_year_id = sqlc.narg('fiscal_year_id'))
  AND (sqlc.narg('scope')::VARCHAR IS NULL OR scope = sqlc.narg('scope'))
  AND (sqlc.narg('ward_id')::VARCHAR IS NULL OR ward_id = sqlc.narg('ward_id'));

-- name: GetNextDartaNumber :one
SELECT COALESCE(MAX(darta_number), 0) + 1 as next_number
FROM dartas
WHERE fiscal_year_id = $1
  AND scope = $2
  AND (ward_id = sqlc.narg('ward_id') OR (ward_id IS NULL AND sqlc.narg('ward_id')::VARCHAR IS NULL))
  AND tenant_id = $3;
