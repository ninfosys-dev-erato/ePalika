# Darta Chalani System - Implementation Progress

**Date Started:** 2025-10-05  
**Current Status:** Phase 2 Complete (Proto + Database Schema)

---

## ✅ Completed Phases

### Phase 1: Protocol Buffer Definitions ✅

**Location:** `proto/darta/v1/`

Created three comprehensive proto files:

#### 1. `common.proto` - Shared Types
- **Enums:** Scope, Priority, IntakeChannel, DispatchChannel
- **Messages:**
  - FiscalYear, Ward, User, Role, OrganizationalUnit
  - Attachment, AuditEntry
  - PageInfo, PaginationInput, DateTimeRange
  - ErrorDetail, OperationMetadata
  - HealthCheckRequest/Response

#### 2. `darta.proto` - Incoming Correspondence
- **Service:** `DartaService` with 27 RPC methods
- **Main Types:** Darta, Applicant, DartaStats
- **Enums:** DartaStatus (19 states), ApplicantType, DartaReviewDecision
- **Operations:**
  - Queries: GetDarta, GetDartaByNumber, ListDartas, GetMyDartas, GetDartaStats
  - Registration: CreateDarta, SubmitForReview, ReviewDarta, Classify, Reserve/Finalize Number
  - Digitization: ScanDarta, EnrichMetadata, FinalizeArchive
  - Assignment: RouteDarta, ReviewBySection, Clarification workflow, Accept
  - Action: MarkAction, IssueResponse, Acknowledgment workflow, Supersede, Close

#### 3. `chalani.proto` - Outgoing Correspondence
- **Service:** `ChalaniService` with 28 RPC methods
- **Main Types:** Chalani, Recipient, Signatory, Approval, ChalaniTemplate
- **Enums:** ChalaniStatus (16 states), RecipientType, ApprovalDecision
- **Operations:**
  - Queries: GetChalani, ListChalanis, GetStats, ListTemplates
  - Creation: CreateChalani, Submit, Review, Approve
  - Registration: ReserveNumber, Finalize, DirectRegister
  - Signing: SignChalani, SealChalani
  - Dispatch: Dispatch, MarkInTransit, Acknowledge, MarkDelivered
  - Lifecycle: Resend, Void, Supersede, Close

**Generated Code:**
- Location: `proto/gen/darta/v1/`
- Files: `*.pb.go` (protobuf messages), `*_grpc.pb.go` (gRPC service stubs)

---

### Phase 2: Database Schema ✅

**Location:** `services/darta-chalani/internal/dbutil/migrations/00001_initial_schema.sql`

Created comprehensive PostgreSQL/YugabyteDB schema (390 lines):

#### Core Tables

**1. applicants** - People/Organizations submitting darta
- Fields: type, full_name, organization, email, phone, address, identification_number
- Types: CITIZEN, ORGANIZATION, GOVERNMENT_OFFICE, OTHER

**2. recipients** - People/Organizations receiving chalani
- Fields: type, name, organization, email, phone, address
- Similar structure to applicants

**3. attachments** - File attachments for both darta and chalani
- Fields: filename, mime_type, size_bytes, storage_path, checksum (SHA-256)
- Metadata: uploaded_by, uploaded_at, metadata JSONB, tenant_id
- Indexed by: uploaded_by, checksum, tenant_id

**4. dartas** - Incoming correspondence (main table)
- **Numbering:** darta_number, formatted_darta_number
- **External refs:** fiscal_year_id, scope, ward_id (from identity service)
- **Core:** subject, applicant_id, primary_document_id
- **Intake:** intake_channel, received_date, entry_date, backdating info
- **Status:** status (19 states), priority, classification_code
- **Assignment:** assigned_to_unit_id, current_assignee_id, sla_deadline
- **Computed:** is_overdue (generated column)
- **Audit:** created_by, created_at, updated_at
- **Multi-tenancy:** tenant_id, idempotency_key, metadata JSONB

**5. darta_annexes** - Additional attachments (many-to-many)

**6. darta_relationships** - Related dartas (self-referential many-to-many)

**7. chalanis** - Outgoing correspondence
- **Numbering:** chalani_number, formatted_chalani_number
- **Core:** subject, body, template_id, linked_darta_id, recipient_id
- **Approval:** status, is_fully_approved
- **Dispatch:** dispatch_channel, dispatched_at/by, tracking_id, courier_name
- **Acknowledgment:** is_acknowledged, acknowledged_at/by, acknowledgement_proof_id
- **Delivery:** delivered_at, delivered_proof_id
- **Lifecycle:** superseded_by_id, supersedes_id
- **Audit & tenancy:** created_by, tenant_id, idempotency_key, metadata

**8. chalani_attachments** - Chalani attachments (many-to-many)

**9. chalani_signatories** - Required signatories for approval
- Fields: chalani_id, user_id, role_id, order_num, is_required

**10. chalani_approvals** - Approval decisions
- Fields: chalani_id, signatory_id, decision, notes, approved_at
- Decisions: APPROVED, REJECTED, DELEGATED

**11. audit_trail** - Comprehensive audit log
- Fields: entity_type, entity_id, action, performed_by, performed_at
- Details: changes JSONB, ip_address, user_agent, notes
- Entity types: DARTA, CHALANI, ATTACHMENT, APPLICANT, RECIPIENT

**12. chalani_templates** - Reusable chalani templates
- Fields: name, category, subject, body, required_signatory_role_ids
- Status: is_active

#### Database Features

**Indexes:**
- Primary key indexes on all tables
- Foreign key indexes for relationships
- Full-text search (GIN) on subject fields
- Partial indexes for active records
- Tenant isolation indexes
- Chronological indexes (created_at, received_date, etc.)

**Constraints:**
- Unique constraints: darta/chalani numbers per fiscal year/scope/ward
- Unique idempotency keys
- CHECK constraints for enum values
- Foreign key constraints with appropriate ON DELETE actions

**Triggers:**
- auto_update_updated_at for applicants, recipients, dartas, chalanis, templates

**Performance Optimizations:**
- Generated column for is_overdue (indexed)
- Partial indexes for common queries (active records, pending records)
- GIN indexes for full-text search
- Proper cascading deletes on junction tables

---

## 🎯 Design Decisions

### Microservice Boundaries
- **Darta-Chalani Service:** Owns correspondence domain logic, applicants, recipients, attachments
- **Identity Service:** Owns users, roles, organizational units, wards, fiscal years
- **Communication:** References via string IDs, fetch details via gRPC when needed

### Multi-Tenancy
- Every table has `tenant_id` for data isolation
- Indexed for query performance
- Default value: 'default'

### Auditability
- All tables have created_at/updated_at timestamps
- Dedicated audit_trail table with JSONB changes
- Tracks: who, when, what, from where (IP/user-agent)

### Idempotency
- Unique idempotency_key in dartas and chalanis
- Prevents duplicate submissions
- NULL values excluded from uniqueness check

### Flexible Data Model
- JSONB metadata columns for extensibility
- No schema changes needed for new custom fields
- Queryable with JSON operators

---

## 📊 Statistics

- **Proto Files:** 3 (900+ lines total)
- **Proto Messages:** 100+ types defined
- **gRPC Services:** 2 (DartaService, ChalaniService)
- **RPC Methods:** 55 total
- **Database Tables:** 12 core tables
- **Database Indexes:** 50+ indexes
- **SQL Lines:** 390 lines in initial migration
- **Supported Workflows:**
  - Darta: 19 status states, 24 mutations
  - Chalani: 16 status states, 19 mutations

---

## 🚀 Next Steps (Phase 3)

### Repository Layer Implementation
1. Set up sqlc for type-safe SQL queries
2. Create query definitions for all tables
3. Generate repository code
4. Implement transaction support
5. Add filtering, pagination, sorting
6. Write unit tests

**Files to create:**
- `services/darta-chalani/sqlc.yaml`
- `services/darta-chalani/queries/*.sql`
- Repository interfaces in `internal/repository/`

---

## 📁 File Structure

```
ePalika/
├── plan.md                          # Comprehensive implementation plan
├── PROGRESS.md                      # This file
├── proto/
│   └── darta/v1/
│       ├── common.proto             # ✅ Shared types
│       ├── darta.proto              # ✅ Darta service
│       ├── chalani.proto            # ✅ Chalani service
│       └── gen/                     # ✅ Generated Go code
├── services/
│   └── darta-chalani/
│       └── internal/
│           └── dbutil/
│               └── migrations/
│                   └── 00001_initial_schema.sql  # ✅ Complete schema
└── policies/
    └── oathkeeper/
        ├── config.yaml              # Existing
        └── base/
            └── rules.json           # To be enhanced
```

---

## 🎉 Achievements

✅ **Type-Safe gRPC APIs** - Complete proto definitions with all CRUD operations  
✅ **Normalized Database Schema** - 12 tables with proper relationships and constraints  
✅ **Multi-Tenant Architecture** - Tenant isolation at database level  
✅ **Comprehensive Audit Trail** - Track all changes with full context  
✅ **Performance Optimized** - Strategic indexes, partial indexes, generated columns  
✅ **Microservice Best Practices** - Clear boundaries, external references via IDs  
✅ **Idempotency Support** - Prevent duplicate operations  
✅ **Full-Text Search** - GIN indexes on subject fields  
✅ **Flexible Schema** - JSONB for metadata extensibility  

**Code Quality:**
- Follows Go protobuf conventions
- Follows PostgreSQL best practices
- Proper migrations with up/down support
- Well-documented with comments

---

*Generated on: 2025-10-05*  
*Next Update: After Phase 3 (Repository Layer)*
