-- name: CreateDarta :one
INSERT INTO dartas (
    id,
    title,
    description,
    submitted_by,
    status,
    remarks,
    tenant_id
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
) RETURNING *;

-- name: GetDarta :one
SELECT * FROM dartas WHERE id = $1;

-- name: ListDartas :many
SELECT *
FROM dartas
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountDartas :one
SELECT COUNT(*) FROM dartas;

-- name: UpdateDartaStatus :one
UPDATE dartas
SET status = $2,
    remarks = COALESCE($3, remarks),
    updated_at = NOW()
WHERE id = $1
RETURNING *;
