-- ============================================================================
-- RECIPIENTS - People/Organizations receiving chalani
-- ============================================================================

-- name: CreateRecipient :one
INSERT INTO recipients (
    type,
    name,
    organization,
    email,
    phone,
    address
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetRecipient :one
SELECT * FROM recipients
WHERE id = $1;

-- name: FindRecipientByContact :one
SELECT * FROM recipients
WHERE email = $1 OR phone = $2
ORDER BY created_at DESC
LIMIT 1;

-- name: UpdateRecipient :one
UPDATE recipients
SET
    type = COALESCE(sqlc.narg('type'), type),
    name = COALESCE(sqlc.narg('name'), name),
    organization = COALESCE(sqlc.narg('organization'), organization),
    email = COALESCE(sqlc.narg('email'), email),
    phone = COALESCE(sqlc.narg('phone'), phone),
    address = COALESCE(sqlc.narg('address'), address)
WHERE id = $1
RETURNING *;

-- name: ListRecipients :many
SELECT * FROM recipients
WHERE
    (sqlc.narg('type')::VARCHAR IS NULL OR type = sqlc.narg('type'))
    AND (sqlc.narg('search')::TEXT IS NULL OR 
         name ILIKE '%' || sqlc.narg('search') || '%' OR
         organization ILIKE '%' || sqlc.narg('search') || '%')
ORDER BY created_at DESC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountRecipients :one
SELECT COUNT(*) FROM recipients
WHERE
    (sqlc.narg('type')::VARCHAR IS NULL OR type = sqlc.narg('type'))
    AND (sqlc.narg('search')::TEXT IS NULL OR 
         name ILIKE '%' || sqlc.narg('search') || '%' OR
         organization ILIKE '%' || sqlc.narg('search') || '%');

-- name: DeleteRecipient :exec
DELETE FROM recipients WHERE id = $1;
