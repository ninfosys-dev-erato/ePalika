-- ============================================================================
-- DARTA ANNEXES - Additional attachments
-- ============================================================================

-- name: AddDartaAnnex :exec
INSERT INTO darta_annexes (darta_id, attachment_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: GetDartaAnnexes :many
SELECT a.*
FROM attachments a
JOIN darta_annexes da ON a.id = da.attachment_id
WHERE da.darta_id = $1
ORDER BY da.added_at ASC;

-- name: RemoveDartaAnnex :exec
DELETE FROM darta_annexes
WHERE darta_id = $1 AND attachment_id = $2;

-- name: RemoveAllDartaAnnexes :exec
DELETE FROM darta_annexes WHERE darta_id = $1;

-- ============================================================================
-- DARTA RELATIONSHIPS - Related dartas
-- ============================================================================

-- name: AddDartaRelationship :exec
INSERT INTO darta_relationships (darta_id, related_darta_id, relationship_type)
VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

-- name: GetRelatedDartas :many
SELECT d.*, a.*
FROM dartas d
JOIN darta_relationships dr ON d.id = dr.related_darta_id
JOIN applicants a ON d.applicant_id = a.id
WHERE dr.darta_id = $1
ORDER BY dr.created_at DESC;

-- name: RemoveDartaRelationship :exec
DELETE FROM darta_relationships
WHERE darta_id = $1 AND related_darta_id = $2;

-- name: RemoveAllDartaRelationships :exec
DELETE FROM darta_relationships WHERE darta_id = $1;
