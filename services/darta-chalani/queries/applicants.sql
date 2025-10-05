-- ============================================================================
-- APPLICANTS - People/Organizations submitting darta
-- ============================================================================

-- name: CreateApplicant :one
INSERT INTO applicants (
    type,
    full_name,
    organization,
    email,
    phone,
    address,
    identification_number
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetApplicant :one
SELECT * FROM applicants
WHERE id = $1;

-- name: GetApplicantByEmailOrPhone :one
SELECT * FROM applicants
WHERE email = $1 OR phone = $2
ORDER BY created_at DESC
LIMIT 1;

-- name: FindApplicantByIdentification :one
SELECT * FROM applicants
WHERE identification_number = $1
LIMIT 1;

-- name: UpdateApplicant :one
UPDATE applicants
SET
    type = COALESCE(sqlc.narg('type'), type),
    full_name = COALESCE(sqlc.narg('full_name'), full_name),
    organization = COALESCE(sqlc.narg('organization'), organization),
    email = COALESCE(sqlc.narg('email'), email),
    phone = COALESCE(sqlc.narg('phone'), phone),
    address = COALESCE(sqlc.narg('address'), address),
    identification_number = COALESCE(sqlc.narg('identification_number'), identification_number)
WHERE id = $1
RETURNING *;

-- name: ListApplicants :many
SELECT * FROM applicants
WHERE
    (sqlc.narg('type')::VARCHAR IS NULL OR type = sqlc.narg('type'))
    AND (sqlc.narg('search')::TEXT IS NULL OR 
         full_name ILIKE '%' || sqlc.narg('search') || '%' OR
         organization ILIKE '%' || sqlc.narg('search') || '%')
ORDER BY created_at DESC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountApplicants :one
SELECT COUNT(*) FROM applicants
WHERE
    (sqlc.narg('type')::VARCHAR IS NULL OR type = sqlc.narg('type'))
    AND (sqlc.narg('search')::TEXT IS NULL OR 
         full_name ILIKE '%' || sqlc.narg('search') || '%' OR
         organization ILIKE '%' || sqlc.narg('search') || '%');

-- name: DeleteApplicant :exec
DELETE FROM applicants WHERE id = $1;
