-- ============================================================================
-- ATTACHMENTS - File attachments
-- ============================================================================

-- name: CreateAttachment :one
INSERT INTO attachments (
    filename,
    original_filename,
    mime_type,
    size_bytes,
    storage_path,
    checksum,
    uploaded_by,
    metadata,
    tenant_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetAttachment :one
SELECT * FROM attachments
WHERE id = $1;

-- name: GetAttachmentByChecksum :one
SELECT * FROM attachments
WHERE checksum = $1 AND tenant_id = $2
ORDER BY created_at DESC
LIMIT 1;

-- name: ListAttachmentsByUploader :many
SELECT * FROM attachments
WHERE uploaded_by = $1 AND tenant_id = $2
ORDER BY uploaded_at DESC
LIMIT $3 OFFSET $4;

-- name: ListAttachments :many
SELECT * FROM attachments
WHERE tenant_id = $1
ORDER BY uploaded_at DESC
LIMIT $2 OFFSET $3;

-- name: CountAttachments :one
SELECT COUNT(*) FROM attachments
WHERE tenant_id = $1;

-- name: DeleteAttachment :exec
DELETE FROM attachments WHERE id = $1;

-- name: GetAttachmentsByIDs :many
SELECT * FROM attachments
WHERE id = ANY($1::uuid[]);
