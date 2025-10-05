package domain

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
)

// Helper functions for type conversions
func timeToPgTimestamptz(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{
		Time:  t,
		Valid: true,
	}
}

func timePtrToPgTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{Valid: false}
	}
	return pgtype.Timestamptz{
		Time:  *t,
		Valid: true,
	}
}

func uuidToPgUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: u,
		Valid: true,
	}
}

func stringPtrIfNotEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// DartaService handles Darta business logic
type DartaService struct {
	queries db.Querier
}

// NewDartaService creates a new Darta service
func NewDartaService(queries db.Querier) *DartaService {
	return &DartaService{
		queries: queries,
	}
}

// CreateDartaInput contains input for creating a darta
type CreateDartaInput struct {
	FiscalYearID       string
	Scope              string
	WardID             *string
	Subject            string
	ApplicantID        uuid.UUID
	IntakeChannel      string
	ReceivedDate       time.Time
	PrimaryDocumentID  uuid.UUID
	AnnexIDs           []uuid.UUID
	Priority           string
	IsBackdated        bool
	BackdateReason     *string
	BackdateApproverID *string
	IdempotencyKey     string
	Metadata           map[string]interface{}
}

// CreateDarta creates a new darta record
func (s *DartaService) CreateDarta(ctx context.Context, input CreateDartaInput) (*db.Darta, error) {
	userCtx := GetUserContext(ctx)
	
	// Validate input
	if err := s.validateCreateDartaInput(input); err != nil {
		return nil, err
	}
	
	// Check idempotency
	if input.IdempotencyKey != "" {
		idempotencyKeyPtr := stringPtrIfNotEmpty(input.IdempotencyKey)
		existing, err := s.queries.GetDartaByIdempotencyKey(ctx, db.GetDartaByIdempotencyKeyParams{
			IdempotencyKey: idempotencyKeyPtr,
			TenantID:       userCtx.TenantID,
		})
		if err == nil && existing.ID != uuid.Nil {
			return &existing, nil // Return existing darta
		}
	}
	
	// Verify applicant exists
	_, err := s.queries.GetApplicant(ctx, input.ApplicantID)
	if err != nil {
		return nil, fmt.Errorf("applicant not found: %w", err)
	}
	
	// Verify primary document exists
	_, err = s.queries.GetAttachment(ctx, input.PrimaryDocumentID)
	if err != nil {
		return nil, fmt.Errorf("primary document not found: %w", err)
	}
	
	// Prepare metadata
	var metadataJSON json.RawMessage
	if input.Metadata != nil {
		metadataJSON, err = json.Marshal(input.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}
	
	// Create darta
	darta, err := s.queries.CreateDarta(ctx, db.CreateDartaParams{
		FiscalYearID:       input.FiscalYearID,
		Scope:              input.Scope,
		WardID:             input.WardID,
		Subject:            input.Subject,
		ApplicantID:        input.ApplicantID,
		IntakeChannel:      input.IntakeChannel,
		ReceivedDate:       timeToPgTimestamptz(input.ReceivedDate),
		EntryDate:          timeToPgTimestamptz(time.Now()),
		IsBackdated:        input.IsBackdated,
		BackdateReason:     input.BackdateReason,
		BackdateApproverID: input.BackdateApproverID,
		PrimaryDocumentID:  input.PrimaryDocumentID,
		Status:             "DRAFT",
		Priority:           input.Priority,
		CreatedBy:          userCtx.UserID,
		TenantID:           userCtx.TenantID,
		IdempotencyKey:     stringPtrIfNotEmpty(input.IdempotencyKey),
		Metadata:           metadataJSON,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create darta: %w", err)
	}
	
	// Add annexes
	for _, annexID := range input.AnnexIDs {
		err := s.queries.AddDartaAnnex(ctx, db.AddDartaAnnexParams{
			DartaID:      uuidToPgUUID(darta.ID),
			AttachmentID: uuidToPgUUID(annexID),
		})
		if err != nil {
			// Log error but continue
			fmt.Printf("failed to add annex %s: %v\n", annexID, err)
		}
	}
	
	// Create audit entry
	_ = s.createAuditEntry(ctx, "DARTA", darta.ID, "CREATED", userCtx, nil)
	
	return &darta, nil
}

// GetDarta retrieves a darta by ID
func (s *DartaService) GetDarta(ctx context.Context, id uuid.UUID) (*db.GetDartaRow, error) {
	darta, err := s.queries.GetDarta(ctx, id)
	if err != nil {
		return nil, ErrDartaNotFound
	}
	return &darta, nil
}

// UpdateDartaStatus updates the status of a darta
func (s *DartaService) UpdateDartaStatus(ctx context.Context, id uuid.UUID, newStatus string) (*db.Darta, error) {
	userCtx := GetUserContext(ctx)
	
	// Get current darta
	current, err := s.queries.GetDartaSimple(ctx, id)
	if err != nil {
		return nil, ErrDartaNotFound
	}
	
	// Validate status transition
	if !s.isValidStatusTransition(current.Status, newStatus) {
		return nil, ErrInvalidDartaStatus
	}
	
	// Update status
	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:     id,
		Status: newStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update status: %w", err)
	}
	
	// Create audit entry
	changes := map[string]interface{}{
		"status": map[string]string{"from": current.Status, "to": newStatus},
	}
	_ = s.createAuditEntry(ctx, "DARTA", id, "STATUS_CHANGED", userCtx, changes)
	
	return &updated, nil
}

// ReserveDartaNumber reserves a darta number
func (s *DartaService) ReserveDartaNumber(ctx context.Context, id uuid.UUID) (*db.Darta, error) {
	userCtx := GetUserContext(ctx)
	
	// Get current darta
	current, err := s.queries.GetDartaSimple(ctx, id)
	if err != nil {
		return nil, ErrDartaNotFound
	}
	
	// Check if already has number
	if current.DartaNumber != nil {
		return &current, nil
	}
	
	// Get next number
	nextNum, err := s.queries.GetNextDartaNumber(ctx, db.GetNextDartaNumberParams{
		FiscalYearID: current.FiscalYearID,
		Scope:        current.Scope,
		WardID:       current.WardID,
		TenantID:     current.TenantID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get next number: %w", err)
	}
	
	// Format number
	formatted := s.formatDartaNumber(current.FiscalYearID, current.Scope, current.WardID, int(nextNum))
	
	// Update darta
	updated, err := s.queries.UpdateDartaNumber(ctx, db.UpdateDartaNumberParams{
		ID:                    id,
		DartaNumber:           &nextNum,
		FormattedDartaNumber:  &formatted,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update number: %w", err)
	}
	
	// Update status to NUMBER_RESERVED
	_, _ = s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:     id,
		Status: "NUMBER_RESERVED",
	})
	
	// Create audit entry
	changes := map[string]interface{}{
		"darta_number": nextNum,
		"formatted":    formatted,
	}
	_ = s.createAuditEntry(ctx, "DARTA", id, "NUMBER_RESERVED", userCtx, changes)
	
	return &updated, nil
}

// AssignDarta assigns darta to a unit/user
func (s *DartaService) AssignDarta(ctx context.Context, id uuid.UUID, unitID, assigneeID *string, priority *string, slaHours *int32) (*db.Darta, error) {
	userCtx := GetUserContext(ctx)
	
	var slaDeadline *time.Time
	if slaHours != nil && *slaHours > 0 {
		deadline := time.Now().Add(time.Duration(*slaHours) * time.Hour)
		slaDeadline = &deadline
	}
	
	updated, err := s.queries.UpdateDartaAssignment(ctx, db.UpdateDartaAssignmentParams{
		ID:                 id,
		AssignedToUnitID:   unitID,
		CurrentAssigneeID:  assigneeID,
		SlaDeadline:        timePtrToPgTimestamptz(slaDeadline),
		Priority:           priority,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to assign darta: %w", err)
	}
	
	// Update status to ASSIGNED
	_, _ = s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:     id,
		Status: "ASSIGNED",
	})
	
	// Create audit entry
	changes := map[string]interface{}{
		"assigned_to_unit": unitID,
		"assigned_to_user": assigneeID,
		"sla_hours":        slaHours,
	}
	_ = s.createAuditEntry(ctx, "DARTA", id, "ASSIGNED", userCtx, changes)
	
	return &updated, nil
}

// Helper methods

func (s *DartaService) validateCreateDartaInput(input CreateDartaInput) error {
	if strings.TrimSpace(input.Subject) == "" {
		return NewValidationError("subject", "required")
	}
	if input.ApplicantID == uuid.Nil {
		return NewValidationError("applicant_id", "required")
	}
	if input.PrimaryDocumentID == uuid.Nil {
		return NewValidationError("primary_document_id", "required")
	}
	if input.Scope != "MUNICIPALITY" && input.Scope != "WARD" {
		return NewValidationError("scope", "must be MUNICIPALITY or WARD")
	}
	if input.Scope == "WARD" && (input.WardID == nil || *input.WardID == "") {
		return NewValidationError("ward_id", "required when scope is WARD")
	}
	return nil
}

func (s *DartaService) isValidStatusTransition(from, to string) bool {
	// Define valid state transitions
	validTransitions := map[string][]string{
		"DRAFT":                   {"PENDING_REVIEW", "VOIDED"},
		"PENDING_REVIEW":          {"CLASSIFICATION", "DRAFT", "VOIDED"},
		"CLASSIFICATION":          {"NUMBER_RESERVED", "PENDING_REVIEW"},
		"NUMBER_RESERVED":         {"REGISTERED", "VOIDED"},
		"REGISTERED":              {"SCANNED", "ASSIGNED", "VOIDED"},
		"SCANNED":                 {"METADATA_ENRICHED"},
		"METADATA_ENRICHED":       {"DIGITALLY_ARCHIVED"},
		"DIGITALLY_ARCHIVED":      {"ASSIGNED"},
		"ASSIGNED":                {"IN_REVIEW_BY_SECTION", "VOIDED"},
		"IN_REVIEW_BY_SECTION":    {"NEEDS_CLARIFICATION", "ACCEPTED", "ASSIGNED"},
		"NEEDS_CLARIFICATION":     {"IN_REVIEW_BY_SECTION"},
		"ACCEPTED":                {"ACTION_TAKEN"},
		"ACTION_TAKEN":            {"RESPONSE_ISSUED", "CLOSED"},
		"RESPONSE_ISSUED":         {"ACK_REQUESTED", "CLOSED"},
		"ACK_REQUESTED":           {"ACK_RECEIVED", "CLOSED"},
		"ACK_RECEIVED":            {"CLOSED"},
	}
	
	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}
	
	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}

func (s *DartaService) formatDartaNumber(fiscalYear, scope string, wardID *string, number int) string {
	// Format: FY-SCOPE-NUMBER or FY-WARD-NUMBER
	// Example: 2081-82/MUN/D-00123 or 2081-82/W05/D-00123
	var scopePart string
	if scope == "MUNICIPALITY" {
		scopePart = "MUN"
	} else if wardID != nil {
		scopePart = fmt.Sprintf("W%s", *wardID)
	}
	return fmt.Sprintf("%s/%s/D-%05d", fiscalYear, scopePart, number)
}

func (s *DartaService) createAuditEntry(ctx context.Context, entityType string, entityID uuid.UUID, action string, userCtx *UserContext, changes map[string]interface{}) error {
	var changesJSON json.RawMessage
	if changes != nil {
		var err error
		changesJSON, err = json.Marshal(changes)
		if err != nil {
			return err
		}
	}
	
	_, err := s.queries.CreateAuditEntry(ctx, db.CreateAuditEntryParams{
		EntityType:  entityType,
		EntityID:    uuidToPgUUID(entityID),
		Action:      action,
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		IpAddress:   &userCtx.IPAddress,
		UserAgent:   &userCtx.UserAgent,
		TenantID:    userCtx.TenantID,
	})
	return err
}
