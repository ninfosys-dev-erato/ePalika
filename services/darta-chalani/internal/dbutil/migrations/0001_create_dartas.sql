-- +goose Up
CREATE TABLE IF NOT EXISTS dartas (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    tenant_id TEXT DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_dartas_status ON dartas(status);
CREATE INDEX IF NOT EXISTS idx_dartas_created_at ON dartas(created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS dartas;
