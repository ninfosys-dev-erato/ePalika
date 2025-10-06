package grpc

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	chalaniv1 "git.ninjainfosys.com/ePalika/proto/gen/darta/v1"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/domain"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ChalaniServer implements the ChalaniService gRPC server
type ChalaniServer struct {
	chalaniv1.UnimplementedChalaniServiceServer
	queries db.Querier
}

// NewChalaniServer creates a new ChalaniServer instance
func NewChalaniServer(queries db.Querier) *ChalaniServer {
	return &ChalaniServer{
		queries: queries,
	}
}

// CreateChalani creates a new chalani (outgoing correspondence)
func (s *ChalaniServer) CreateChalani(ctx context.Context, req *chalaniv1.CreateChalaniRequest) (*chalaniv1.CreateChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	// Parse recipient
	recipientID, err := parseRecipientInput(ctx, s.queries, req.Input.Recipient)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid recipient: %v", err)
	}

	// Create chalani
	chalaniID := uuid.New()
	chalani, err := s.queries.CreateChalani(ctx, db.CreateChalaniParams{
		ID:              chalaniID,
		FiscalYearID:    req.Input.FiscalYearId,
		Scope:           req.Input.Scope.String(),
		WardID:          sqlNullString(req.Input.WardId),
		Subject:         req.Input.Subject,
		RecipientID:     recipientID,
		DispatchChannel: req.Input.DispatchChannel.String(),
		Priority:        req.Input.Priority.String(),
		TemplateID:      sqlNullUUID(req.Input.TemplateId),
		Status:          "DRAFT",
		TenantID:        userCtx.TenantID,
		CreatedBy:       userCtx.UserID,
		IdempotencyKey:  sqlNullString(req.Input.IdempotencyKey),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create chalani: %v", err)
	}

	// Create audit trail
	changes := map[string]interface{}{
		"action": "created",
		"status": "DRAFT",
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "CREATED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.CreateChalaniResponse{
		Chalani: toProtoChalani(&chalani),
	}, nil
}

// GetChalani retrieves a chalani by ID
func (s *ChalaniServer) GetChalani(ctx context.Context, req *chalaniv1.GetChalaniRequest) (*chalaniv1.GetChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	chalani, err := s.queries.GetChalaniByID(ctx, db.GetChalaniByIDParams{
		ID:       chalaniID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "chalani not found: %v", err)
	}

	return &chalaniv1.GetChalaniResponse{
		Chalani: toProtoChalani(&chalani),
	}, nil
}

// ListChalanis lists chalanis with filtering and pagination
func (s *ChalaniServer) ListChalanis(ctx context.Context, req *chalaniv1.ListChalanisRequest) (*chalaniv1.ListChalanisResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	limit := int32(20)
	offset := int32(0)
	if req.Pagination != nil {
		if req.Pagination.Limit > 0 {
			limit = req.Pagination.Limit
		}
		offset = req.Pagination.Offset
	}

	chalanis, err := s.queries.ListChalanis(ctx, db.ListChalanisParams{
		FiscalYearID:    sqlNullString(req.Filter.GetFiscalYearId()),
		Scope:           sqlNullString(req.Filter.GetScope().String()),
		WardID:          sqlNullString(req.Filter.GetWardId()),
		Status:          sqlNullString(req.Filter.GetStatus().String()),
		Priority:        sqlNullString(req.Filter.GetPriority().String()),
		DispatchChannel: sqlNullString(req.Filter.GetDispatchChannel().String()),
		TenantID:        userCtx.TenantID,
		Limit:           limit,
		Offset:          offset,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list chalanis: %v", err)
	}

	// Count total
	totalCount := int32(len(chalanis))

	// Convert to proto
	protochalanis := make([]*chalaniv1.Chalani, len(chalanis))
	for i, c := range chalanis {
		protochalanis[i] = toProtoChalani(&c)
	}

	return &chalaniv1.ListChalanisResponse{
		Chalanis: protochalanis,
		PageInfo: &chalaniv1.PageInfo{
			TotalCount:  totalCount,
			HasNextPage: (offset + limit) < totalCount,
		},
	}, nil
}

// SubmitChalaniForApproval submits chalani for approval
func (s *ChalaniServer) SubmitChalaniForApproval(ctx context.Context, req *chalaniv1.SubmitChalaniForApprovalRequest) (*chalaniv1.SubmitChalaniForApprovalResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "PENDING_APPROVAL",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status": map[string]string{"from": "DRAFT", "to": "PENDING_APPROVAL"},
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "SUBMITTED_FOR_APPROVAL",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.SubmitChalaniForApprovalResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// ApproveChalani approves a chalani
func (s *ChalaniServer) ApproveChalani(ctx context.Context, req *chalaniv1.ApproveChalaniRequest) (*chalaniv1.ApproveChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Create approval record
	approvalID := uuid.New()
	_, err = s.queries.CreateChalaniApproval(ctx, db.CreateChalaniApprovalParams{
		ID:         approvalID,
		ChalaniID:  chalaniID,
		ApproverID: userCtx.UserID,
		Decision:   "APPROVED",
		Notes:      sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		TenantID:   userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create approval: %v", err)
	}

	// Update status
	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "APPROVED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":         map[string]string{"to": "APPROVED"},
		"approver":       userCtx.UserID,
		"approval_notes": req.Notes,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "APPROVED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.ApproveChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// RejectChalani rejects a chalani
func (s *ChalaniServer) RejectChalani(ctx context.Context, req *chalaniv1.RejectChalaniRequest) (*chalaniv1.RejectChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Create approval record with rejection
	approvalID := uuid.New()
	_, err = s.queries.CreateChalaniApproval(ctx, db.CreateChalaniApprovalParams{
		ID:         approvalID,
		ChalaniID:  chalaniID,
		ApproverID: userCtx.UserID,
		Decision:   "REJECTED",
		Notes:      sql.NullString{String: req.Reason, Valid: req.Reason != ""},
		TenantID:   userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create approval: %v", err)
	}

	// Update status
	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "REJECTED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":           map[string]string{"to": "REJECTED"},
		"rejector":         userCtx.UserID,
		"rejection_reason": req.Reason,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "REJECTED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.RejectChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// ReserveChalaniNumber reserves a sequential chalani number
func (s *ChalaniServer) ReserveChalaniNumber(ctx context.Context, req *chalaniv1.ReserveChalaniNumberRequest) (*chalaniv1.ReserveChalaniNumberResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Get chalani
	chalani, err := s.queries.GetChalaniByID(ctx, db.GetChalaniByIDParams{
		ID:       chalaniID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "chalani not found: %v", err)
	}

	// Get next number
	nextNumber, err := s.queries.GetNextChalaniNumber(ctx, db.GetNextChalaniNumberParams{
		FiscalYearID: chalani.FiscalYearID,
		Scope:        chalani.Scope,
		TenantID:     userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get next number: %v", err)
	}

	// Format number (e.g., 2081-82/MUN/C-00123)
	formattedNumber := formatChalaniNumber(chalani.FiscalYearID, chalani.Scope, chalani.WardID.String, int(nextNumber))

	// Update chalani with number
	updated, err := s.queries.ReserveChalaniNumber(ctx, db.ReserveChalaniNumberParams{
		ID:                     chalaniID,
		ChalaniNumber:          sql.NullInt64{Int64: nextNumber, Valid: true},
		FormattedChalaniNumber: sql.NullString{String: formattedNumber, Valid: true},
		TenantID:               userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to reserve number: %v", err)
	}

	changes := map[string]interface{}{
		"chalani_number":           nextNumber,
		"formatted_chalani_number": formattedNumber,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "NUMBER_RESERVED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.ReserveChalaniNumberResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// DispatchChalani marks chalani as dispatched
func (s *ChalaniServer) DispatchChalani(ctx context.Context, req *chalaniv1.DispatchChalaniRequest) (*chalaniv1.DispatchChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Update status and dispatch date
	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "DISPATCHED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	// Create dispatch tracking record
	if req.DispatchedAt != nil {
		trackingID := uuid.New()
		_, err = s.queries.CreateDispatchTracking(ctx, db.CreateDispatchTrackingParams{
			ID:           trackingID,
			ChalaniID:    chalaniID,
			DispatchedAt: req.DispatchedAt.AsTime(),
			DispatchedBy: userCtx.UserID,
			CourierName:  sql.NullString{String: req.CourierName, Valid: req.CourierName != ""},
			TrackingCode: sql.NullString{String: req.TrackingCode, Valid: req.TrackingCode != ""},
			TenantID:     userCtx.TenantID,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to create dispatch tracking: %v", err)
		}
	}

	changes := map[string]interface{}{
		"status":        map[string]string{"to": "DISPATCHED"},
		"courier_name":  req.CourierName,
		"tracking_code": req.TrackingCode,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "DISPATCHED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.DispatchChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// Helper function to format chalani number
func formatChalaniNumber(fiscalYear, scope, wardID string, number int) string {
	prefix := "C"
	if scope == "WARD" && wardID != "" {
		return fiscalYear + "/" + wardID + "/" + prefix + "-" + padNumber(number, 5)
	}
	return fiscalYear + "/MUN/" + prefix + "-" + padNumber(number, 5)
}

// Helper functions for recipient parsing
func parseRecipientInput(ctx context.Context, queries db.Querier, input *chalaniv1.RecipientInput) (uuid.UUID, error) {
	if input == nil {
		return uuid.Nil, status.Error(codes.InvalidArgument, "recipient is required")
	}

	// Check if recipient already exists by some unique identifier
	// For now, create new recipient
	recipientID := uuid.New()
	userCtx := domain.GetUserContext(ctx)

	_, err := queries.CreateRecipient(ctx, db.CreateRecipientParams{
		ID:           recipientID,
		Type:         input.Type.String(),
		FullName:     input.FullName,
		Organization: sqlNullString(input.Organization),
		Email:        sqlNullString(input.Email),
		Phone:        sqlNullString(input.Phone),
		Address:      sqlNullString(input.Address),
		TenantID:     userCtx.TenantID,
	})
	if err != nil {
		return uuid.Nil, err
	}

	return recipientID, nil
}

// Additional Chalani RPC methods (continuing with the full implementation)

// RecallChalani recalls a dispatched chalani
func (s *ChalaniServer) RecallChalani(ctx context.Context, req *chalaniv1.RecallChalaniRequest) (*chalaniv1.RecallChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "RECALLED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status": map[string]string{"to": "RECALLED"},
		"reason": req.Reason,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "RECALLED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.RecallChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// MarkChalaniDelivered marks chalani as delivered
func (s *ChalaniServer) MarkChalaniDelivered(ctx context.Context, req *chalaniv1.MarkChalaniDeliveredRequest) (*chalaniv1.MarkChalaniDeliveredResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "DELIVERED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	// Update dispatch tracking with delivery info
	if req.DeliveredAt != nil {
		err = s.queries.UpdateDispatchTrackingDelivery(ctx, db.UpdateDispatchTrackingDeliveryParams{
			ChalaniID:   chalaniID,
			DeliveredAt: sql.NullTime{Time: req.DeliveredAt.AsTime(), Valid: true},
			TenantID:    userCtx.TenantID,
		})
		if err != nil {
			// Log error but don't fail the request
		}
	}

	changes := map[string]interface{}{
		"status":       map[string]string{"to": "DELIVERED"},
		"delivered_at": req.DeliveredAt.AsTime(),
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "DELIVERED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.MarkChalaniDeliveredResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// VoidChalani voids a chalani
func (s *ChalaniServer) VoidChalani(ctx context.Context, req *chalaniv1.VoidChalaniRequest) (*chalaniv1.VoidChalaniResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:        chalaniID,
		Status:    "VOIDED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status": map[string]string{"to": "VOIDED"},
		"reason": req.Reason,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "CHALANI",
		EntityID:    chalaniID,
		Action:      "VOIDED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &chalaniv1.VoidChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// Conversion function from DB model to Proto
func toProtoChalani(c *db.Chalani) *chalaniv1.Chalani {
	chalani := &chalaniv1.Chalani{
		Id:              c.ID.String(),
		FiscalYearId:    c.FiscalYearID,
		Scope:           stringToScope(c.Scope),
		WardId:          nullStringToPtr(c.WardID),
		Subject:         c.Subject,
		Status:          stringToChalaniStatus(c.Status),
		Priority:        stringToPriority(c.Priority),
		DispatchChannel: stringToDispatchChannel(c.DispatchChannel),
		CreatedAt:       timestamppb.New(c.CreatedAt),
		UpdatedAt:       timestamppb.New(c.UpdatedAt),
	}

	if c.ChalaniNumber.Valid {
		chalani.ChalaniNumber = int32(c.ChalaniNumber.Int64)
	}

	if c.FormattedChalaniNumber.Valid {
		chalani.FormattedChalaniNumber = c.FormattedChalaniNumber.String
	}

	if c.DispatchedAt.Valid {
		chalani.DispatchedAt = timestamppb.New(c.DispatchedAt.Time)
	}

	if c.DeliveredAt.Valid {
		chalani.DeliveredAt = timestamppb.New(c.DeliveredAt.Time)
	}

	return chalani
}

// Helper conversion functions
func stringToChalaniStatus(s string) chalaniv1.ChalaniStatus {
	switch s {
	case "DRAFT":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_DRAFT
	case "PENDING_APPROVAL":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_PENDING_APPROVAL
	case "APPROVED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_APPROVED
	case "REJECTED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_REJECTED
	case "DISPATCHED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_DISPATCHED
	case "DELIVERED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_DELIVERED
	case "RECALLED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_RECALLED
	case "VOIDED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_VOIDED
	default:
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_UNSPECIFIED
	}
}

func stringToDispatchChannel(s string) chalaniv1.DispatchChannel {
	switch s {
	case "POSTAL":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_POSTAL
	case "COURIER":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_COURIER
	case "EMAIL":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_EMAIL
	case "HAND_DELIVERY":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_HAND_DELIVERY
	case "ECHALANI_PORTAL":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_ECHALANI_PORTAL
	default:
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_UNSPECIFIED
	}
}
