-- ============================================================================
-- CHALANI ATTACHMENTS
-- ============================================================================

-- name: AddChalaniAttachment :exec
INSERT INTO chalani_attachments (chalani_id, attachment_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: GetChalaniAttachments :many
SELECT a.*
FROM attachments a
JOIN chalani_attachments ca ON a.id = ca.attachment_id
WHERE ca.chalani_id = $1
ORDER BY ca.added_at ASC;

-- name: RemoveChalaniAttachment :exec
DELETE FROM chalani_attachments
WHERE chalani_id = $1 AND attachment_id = $2;

-- ============================================================================
-- CHALANI SIGNATORIES
-- ============================================================================

-- name: AddChalaniSignatory :one
INSERT INTO chalani_signatories (
    chalani_id,
    user_id,
    role_id,
    order_num,
    is_required
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetChalaniSignatories :many
SELECT * FROM chalani_signatories
WHERE chalani_id = $1
ORDER BY order_num ASC;

-- name: GetChalaniSignatory :one
SELECT * FROM chalani_signatories
WHERE id = $1;

-- name: RemoveChalaniSignatory :exec
DELETE FROM chalani_signatories
WHERE id = $1;

-- ============================================================================
-- CHALANI APPROVALS
-- ============================================================================

-- name: CreateChalaniApproval :one
INSERT INTO chalani_approvals (
    chalani_id,
    signatory_id,
    decision,
    notes
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetChalaniApprovals :many
SELECT ca.*, cs.*
FROM chalani_approvals ca
JOIN chalani_signatories cs ON ca.signatory_id = cs.id
WHERE ca.chalani_id = $1
ORDER BY cs.order_num ASC;

-- name: GetChalaniApproval :one
SELECT * FROM chalani_approvals
WHERE id = $1;

-- name: CheckAllSignatoriesApproved :one
SELECT 
    COUNT(*) FILTER (WHERE cs.is_required = true) as required_count,
    COUNT(*) FILTER (WHERE cs.is_required = true AND ca.decision = 'APPROVED') as approved_count
FROM chalani_signatories cs
LEFT JOIN chalani_approvals ca ON cs.id = ca.signatory_id
WHERE cs.chalani_id = $1;

-- ============================================================================
-- CHALANI TEMPLATES
-- ============================================================================

-- name: CreateChalaniTemplate :one
INSERT INTO chalani_templates (
    name,
    category,
    subject,
    body,
    required_signatory_role_ids,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetChalaniTemplate :one
SELECT * FROM chalani_templates
WHERE id = $1;

-- name: ListChalaniTemplates :many
SELECT * FROM chalani_templates
WHERE
    (sqlc.narg('category')::VARCHAR IS NULL OR category = sqlc.narg('category'))
    AND (sqlc.narg('active_only')::BOOLEAN IS NULL OR is_active = sqlc.narg('active_only'))
ORDER BY name ASC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountChalaniTemplates :one
SELECT COUNT(*) FROM chalani_templates
WHERE
    (sqlc.narg('category')::VARCHAR IS NULL OR category = sqlc.narg('category'))
    AND (sqlc.narg('active_only')::BOOLEAN IS NULL OR is_active = sqlc.narg('active_only'));

-- name: UpdateChalaniTemplate :one
UPDATE chalani_templates
SET
    name = COALESCE(sqlc.narg('name'), name),
    category = COALESCE(sqlc.narg('category'), category),
    subject = COALESCE(sqlc.narg('subject'), subject),
    body = COALESCE(sqlc.narg('body'), body),
    required_signatory_role_ids = COALESCE(sqlc.narg('required_signatory_role_ids')::TEXT[], required_signatory_role_ids),
    is_active = COALESCE(sqlc.narg('is_active'), is_active)
WHERE id = $1
RETURNING *;

-- name: DeleteChalaniTemplate :exec
DELETE FROM chalani_templates WHERE id = $1;
