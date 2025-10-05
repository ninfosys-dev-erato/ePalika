-- +goose Up
-- ============================================================================
-- DARTA-CHALANI MICROSERVICE - INITIAL SCHEMA
-- This service manages incoming (darta) and outgoing (chalani) correspondence
-- External references (users, org units, wards, fiscal years) are from identity service
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- APPLICANTS - People/Organizations submitting darta
-- ============================================================================
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    identification_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (type IN ('CITIZEN', 'ORGANIZATION', 'GOVERNMENT_OFFICE', 'OTHER'))
);

CREATE INDEX idx_applicants_type ON applicants(type);
CREATE INDEX idx_applicants_full_name ON applicants(full_name);
CREATE INDEX idx_applicants_email ON applicants(email) WHERE email IS NOT NULL;

-- ============================================================================
-- RECIPIENTS - People/Organizations receiving chalani
-- ============================================================================
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (type IN ('CITIZEN', 'ORGANIZATION', 'GOVERNMENT_OFFICE', 'OTHER'))
);

CREATE INDEX idx_recipients_type ON recipients(type);
CREATE INDEX idx_recipients_name ON recipients(name);

-- ============================================================================
-- ATTACHMENTS - File attachments for both darta and chalani
-- ============================================================================
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'default',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_checksum ON attachments(checksum);
CREATE INDEX idx_attachments_tenant ON attachments(tenant_id);

-- ============================================================================
-- DARTAS - Incoming correspondence records
-- ============================================================================
CREATE TABLE dartas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    darta_number INT,
    formatted_darta_number VARCHAR(50),
    
    -- External references (from identity service)
    fiscal_year_id VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    ward_id VARCHAR(100),
    
    -- Core fields
    subject TEXT NOT NULL,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE RESTRICT,
    
    -- Intake
    intake_channel VARCHAR(50) NOT NULL,
    received_date TIMESTAMPTZ NOT NULL,
    entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_backdated BOOLEAN NOT NULL DEFAULT false,
    backdate_reason TEXT,
    backdate_approver_id VARCHAR(100),
    
    -- Documents
    primary_document_id UUID NOT NULL REFERENCES attachments(id) ON DELETE RESTRICT,
    
    -- Status and priority
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    classification_code VARCHAR(100),
    
    -- Assignment (external references)
    assigned_to_unit_id VARCHAR(100),
    current_assignee_id VARCHAR(100),
    sla_deadline TIMESTAMPTZ,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN sla_deadline IS NOT NULL AND sla_deadline < NOW() 
                 AND status NOT IN ('CLOSED', 'VOIDED', 'SUPERSEDED')
            THEN true ELSE false
        END
    ) STORED,
    
    -- Audit
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Multi-tenancy and metadata
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'default',
    idempotency_key VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    UNIQUE(fiscal_year_id, scope, ward_id, darta_number),
    CHECK (scope IN ('MUNICIPALITY', 'WARD')),
    CHECK (ward_id IS NOT NULL OR scope = 'MUNICIPALITY'),
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'CLASSIFICATION', 'NUMBER_RESERVED', 'REGISTERED', 
                      'VOIDED', 'SCANNED', 'METADATA_ENRICHED', 'DIGITALLY_ARCHIVED', 'ASSIGNED',
                      'IN_REVIEW_BY_SECTION', 'NEEDS_CLARIFICATION', 'ACCEPTED', 'ACTION_TAKEN',
                      'RESPONSE_ISSUED', 'ACK_REQUESTED', 'ACK_RECEIVED', 'SUPERSEDED', 'CLOSED')),
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CHECK (intake_channel IN ('COUNTER', 'POSTAL', 'EMAIL', 'EDARTA_PORTAL', 'COURIER'))
);

CREATE INDEX idx_dartas_fiscal_year ON dartas(fiscal_year_id);
CREATE INDEX idx_dartas_scope_ward ON dartas(scope, ward_id);
CREATE INDEX idx_dartas_status ON dartas(status);
CREATE INDEX idx_dartas_darta_number ON dartas(darta_number);
CREATE INDEX idx_dartas_received_date ON dartas(received_date DESC);
CREATE INDEX idx_dartas_assigned_to ON dartas(assigned_to_unit_id, current_assignee_id);
CREATE INDEX idx_dartas_tenant ON dartas(tenant_id);
CREATE INDEX idx_dartas_created_by ON dartas(created_by);
CREATE INDEX idx_dartas_applicant ON dartas(applicant_id);
CREATE INDEX idx_dartas_subject_search ON dartas USING gin(to_tsvector('simple', subject));
CREATE INDEX idx_dartas_active ON dartas(status, priority, created_at DESC)
    WHERE status NOT IN ('CLOSED', 'VOIDED', 'SUPERSEDED');
CREATE UNIQUE INDEX idx_dartas_idempotency_key ON dartas(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- DARTA ANNEXES - Additional attachments for dartas (many-to-many)
-- ============================================================================
CREATE TABLE darta_annexes (
    darta_id UUID NOT NULL REFERENCES dartas(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE RESTRICT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (darta_id, attachment_id)
);

CREATE INDEX idx_darta_annexes_darta ON darta_annexes(darta_id);

-- ============================================================================
-- DARTA RELATIONSHIPS - Related dartas (many-to-many, self-referential)
-- ============================================================================
CREATE TABLE darta_relationships (
    darta_id UUID NOT NULL REFERENCES dartas(id) ON DELETE CASCADE,
    related_darta_id UUID NOT NULL REFERENCES dartas(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'RELATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (darta_id, related_darta_id),
    CHECK (darta_id != related_darta_id)
);

CREATE INDEX idx_darta_relationships_related ON darta_relationships(related_darta_id);

-- ============================================================================
-- CHALANIS - Outgoing correspondence records
-- ============================================================================
CREATE TABLE chalanis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalani_number INT,
    formatted_chalani_number VARCHAR(50),
    
    -- External references
    fiscal_year_id VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    ward_id VARCHAR(100),
    
    -- Core fields
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_id VARCHAR(100),
    linked_darta_id UUID REFERENCES dartas(id) ON DELETE SET NULL,
    recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
    
    -- Status and approval
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    is_fully_approved BOOLEAN NOT NULL DEFAULT false,
    
    -- Dispatch
    dispatch_channel VARCHAR(50),
    dispatched_at TIMESTAMPTZ,
    dispatched_by VARCHAR(100),
    tracking_id VARCHAR(100),
    courier_name VARCHAR(200),
    
    -- Acknowledgment
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    acknowledgement_proof_id UUID REFERENCES attachments(id),
    
    -- Delivery
    delivered_at TIMESTAMPTZ,
    delivered_proof_id UUID REFERENCES attachments(id),
    
    -- Lifecycle
    superseded_by_id UUID REFERENCES chalanis(id),
    supersedes_id UUID REFERENCES chalanis(id),
    
    -- Audit
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Multi-tenancy and metadata
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'default',
    idempotency_key VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    UNIQUE(fiscal_year_id, scope, ward_id, chalani_number),
    CHECK (scope IN ('MUNICIPALITY', 'WARD')),
    CHECK (ward_id IS NOT NULL OR scope = 'MUNICIPALITY'),
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'NUMBER_RESERVED',
                      'REGISTERED', 'SIGNED', 'SEALED', 'DISPATCHED', 'IN_TRANSIT', 'ACKNOWLEDGED',
                      'RETURNED_UNDELIVERED', 'DELIVERED', 'VOIDED', 'SUPERSEDED', 'CLOSED')),
    CHECK (dispatch_channel IS NULL OR dispatch_channel IN ('POSTAL', 'COURIER', 'EMAIL', 'HAND_DELIVERY', 'EDARTA_PORTAL'))
);

CREATE INDEX idx_chalanis_fiscal_year ON chalanis(fiscal_year_id);
CREATE INDEX idx_chalanis_scope_ward ON chalanis(scope, ward_id);
CREATE INDEX idx_chalanis_status ON chalanis(status);
CREATE INDEX idx_chalanis_chalani_number ON chalanis(chalani_number);
CREATE INDEX idx_chalanis_linked_darta ON chalanis(linked_darta_id);
CREATE INDEX idx_chalanis_recipient ON chalanis(recipient_id);
CREATE INDEX idx_chalanis_tenant ON chalanis(tenant_id);
CREATE INDEX idx_chalanis_created_by ON chalanis(created_by);
CREATE INDEX idx_chalanis_subject_search ON chalanis USING gin(to_tsvector('simple', subject));
CREATE UNIQUE INDEX idx_chalanis_idempotency_key ON chalanis(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- CHALANI ATTACHMENTS - Many-to-many relationship
-- ============================================================================
CREATE TABLE chalani_attachments (
    chalani_id UUID NOT NULL REFERENCES chalanis(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE RESTRICT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chalani_id, attachment_id)
);

CREATE INDEX idx_chalani_attachments_chalani ON chalani_attachments(chalani_id);

-- ============================================================================
-- CHALANI SIGNATORIES - Required signatories for approval
-- ============================================================================
CREATE TABLE chalani_signatories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalani_id UUID NOT NULL REFERENCES chalanis(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    role_id VARCHAR(100) NOT NULL,
    order_num INT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chalani_id, user_id)
);

CREATE INDEX idx_chalani_signatories_chalani ON chalani_signatories(chalani_id);
CREATE INDEX idx_chalani_signatories_user ON chalani_signatories(user_id);

-- ============================================================================
-- CHALANI APPROVALS - Approval decisions
-- ============================================================================
CREATE TABLE chalani_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalani_id UUID NOT NULL REFERENCES chalanis(id) ON DELETE CASCADE,
    signatory_id UUID NOT NULL REFERENCES chalani_signatories(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL,
    notes TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (decision IN ('APPROVED', 'REJECTED', 'DELEGATED'))
);

CREATE INDEX idx_chalani_approvals_chalani ON chalani_approvals(chalani_id);
CREATE INDEX idx_chalani_approvals_signatory ON chalani_approvals(signatory_id);

-- ============================================================================
-- AUDIT TRAIL - Comprehensive audit log for both darta and chalani
-- ============================================================================
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    notes TEXT,
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'default',
    CHECK (entity_type IN ('DARTA', 'CHALANI', 'ATTACHMENT', 'APPLICANT', 'RECIPIENT'))
);

CREATE INDEX idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_trail_performed_by ON audit_trail(performed_by);
CREATE INDEX idx_audit_trail_performed_at ON audit_trail(performed_at DESC);
CREATE INDEX idx_audit_trail_tenant ON audit_trail(tenant_id);

-- ============================================================================
-- CHALANI TEMPLATES - Reusable templates
-- ============================================================================
CREATE TABLE chalani_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    required_signatory_role_ids TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chalani_templates_category ON chalani_templates(category);
CREATE INDEX idx_chalani_templates_is_active ON chalani_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dartas_updated_at BEFORE UPDATE ON dartas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chalanis_updated_at BEFORE UPDATE ON chalanis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chalani_templates_updated_at BEFORE UPDATE ON chalani_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
DROP TRIGGER IF EXISTS update_chalani_templates_updated_at ON chalani_templates;
DROP TRIGGER IF EXISTS update_chalanis_updated_at ON chalanis;
DROP TRIGGER IF EXISTS update_dartas_updated_at ON dartas;
DROP TRIGGER IF EXISTS update_recipients_updated_at ON recipients;
DROP TRIGGER IF EXISTS update_applicants_updated_at ON applicants;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS chalani_templates;
DROP TABLE IF EXISTS audit_trail;
DROP TABLE IF EXISTS chalani_approvals;
DROP TABLE IF EXISTS chalani_signatories;
DROP TABLE IF EXISTS chalani_attachments;
DROP TABLE IF EXISTS chalanis;
DROP TABLE IF EXISTS darta_relationships;
DROP TABLE IF EXISTS darta_annexes;
DROP TABLE IF EXISTS dartas;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS applicants;
DROP EXTENSION IF EXISTS "uuid-ossp";
