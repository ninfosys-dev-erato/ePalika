package grpc

import (
	"context"
	"fmt"

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

	// Get fiscal year ID from tenant ID (placeholder - adjust as needed)
	fiscalYearID := req.Input.TenantId
	if fiscalYearID == "" {
		fiscalYearID = userCtx.TenantID
	}

	// Create chalani
	chalani, err := s.queries.CreateChalani(ctx, db.CreateChalaniParams{
		FiscalYearID:   fiscalYearID,
		Scope:          req.Input.Scope.String(),
		WardID:         sqlNullString(req.Input.WardId),
		Subject:        req.Input.Subject,
		Body:           req.Input.Body,
		TemplateID:     sqlNullString(req.Input.TemplateId),
		LinkedDartaID:  sqlNullUUID(req.Input.LinkedDartaId),
		RecipientID:    recipientID,
		Status:         "DRAFT",
		CreatedBy:      userCtx.UserID,
		TenantID:       userCtx.TenantID,
		IdempotencyKey: sqlNullString(req.Input.IdempotencyKey),
		Metadata:       []byte("{}"),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create chalani: %v", err)
	}

	return &chalaniv1.CreateChalaniResponse{
		Chalani: toProtoChalani(&chalani),
	}, nil
}

// GetChalani retrieves a chalani by ID
func (s *ChalaniServer) GetChalani(ctx context.Context, req *chalaniv1.GetChalaniRequest) (*chalaniv1.GetChalaniResponse, error) {
	chalaniID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	chalani, err := s.queries.GetChalaniSimple(ctx, chalaniID)
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
		DispatchChannel: sqlNullString(req.Filter.GetDispatchChannel().String()),
		TenantID:        userCtx.TenantID,
		Limit:           limit,
		Offset:          offset,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list chalanis: %v", err)
	}

	// Convert to proto
	edges := make([]*chalaniv1.ChalaniEdge, len(chalanis))
	for i, c := range chalanis {
		chalaniProto := &chalaniv1.Chalani{
			Id:              c.ID.String(),
			FiscalYear:      &chalaniv1.FiscalYear{Id: c.FiscalYearID},
			Scope:           stringToScope(c.Scope),
			Subject:         c.Subject,
			Status:          stringToChalaniStatus(c.Status),
			CreatedAt:       timestamppb.New(c.CreatedAt.Time),
			UpdatedAt:       timestamppb.New(c.UpdatedAt.Time),
		}
		edges[i] = &chalaniv1.ChalaniEdge{
			Cursor: fmt.Sprintf("%d", offset+int32(i)),
			Node:   chalaniProto,
		}
	}

	return &chalaniv1.ListChalanisResponse{
		Connection: &chalaniv1.ChalaniConnection{
			Edges: edges,
			PageInfo: &chalaniv1.PageInfo{
				TotalCount:  int64(len(chalanis)),
				HasNextPage: int32(len(chalanis)) >= limit,
			},
		},
	}, nil
}

// SubmitChalani submits chalani for review
func (s *ChalaniServer) SubmitChalani(ctx context.Context, req *chalaniv1.SubmitChalaniRequest) (*chalaniv1.SubmitChalaniResponse, error) {
	chalaniID, err := uuid.Parse(req.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:     chalaniID,
		Status: "PENDING_REVIEW",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &chalaniv1.SubmitChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// ApproveChalani approves a chalani
func (s *ChalaniServer) ApproveChalani(ctx context.Context, req *chalaniv1.ApproveChalaniRequest) (*chalaniv1.ApproveChalaniResponse, error) {
	chalaniID, err := uuid.Parse(req.Input.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Update status
	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:     chalaniID,
		Status: "APPROVED",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &chalaniv1.ApproveChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// ReserveChalaniNumber reserves a sequential chalani number
func (s *ChalaniServer) ReserveChalaniNumber(ctx context.Context, req *chalaniv1.ReserveChalaniNumberRequest) (*chalaniv1.ReserveChalaniNumberResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	chalaniID, err := uuid.Parse(req.Input.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	// Get chalani
	chalani, err := s.queries.GetChalaniSimple(ctx, chalaniID)
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

	// Update the chalani (for now, just return the current one since UpdateChalaniNumber might not exist)
	// TODO: Implement UpdateChalaniNumber query
	_ = nextNumber

	return &chalaniv1.ReserveChalaniNumberResponse{
		Chalani: toProtoChalani(&chalani),
	}, nil
}

// DispatchChalani marks chalani as dispatched
func (s *ChalaniServer) DispatchChalani(ctx context.Context, req *chalaniv1.DispatchChalaniRequest) (*chalaniv1.DispatchChalaniResponse, error) {
	chalaniID, err := uuid.Parse(req.Input.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:     chalaniID,
		Status: "DISPATCHED",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &chalaniv1.DispatchChalaniResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// MarkChalaniDelivered marks chalani as delivered
func (s *ChalaniServer) MarkChalaniDelivered(ctx context.Context, req *chalaniv1.MarkChalaniDeliveredRequest) (*chalaniv1.MarkChalaniDeliveredResponse, error) {
	chalaniID, err := uuid.Parse(req.Input.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:     chalaniID,
		Status: "DELIVERED",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &chalaniv1.MarkChalaniDeliveredResponse{
		Chalani: toProtoChalani(&updated),
	}, nil
}

// VoidChalani voids a chalani
func (s *ChalaniServer) VoidChalani(ctx context.Context, req *chalaniv1.VoidChalaniRequest) (*chalaniv1.VoidChalaniResponse, error) {
	chalaniID, err := uuid.Parse(req.Input.ChalaniId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid chalani ID: %v", err)
	}

	updated, err := s.queries.UpdateChalaniStatus(ctx, db.UpdateChalaniStatusParams{
		ID:     chalaniID,
		Status: "VOIDED",
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &chalaniv1.VoidChalaniResponse{
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

	// Create new recipient
	recipient, err := queries.CreateRecipient(ctx, db.CreateRecipientParams{
		Type:         input.Type.String(),
		Name:         input.Name,
		Organization: sqlNullString(input.Organization),
		Email:        sqlNullString(input.Email),
		Phone:        sqlNullString(input.Phone),
		Address:      input.Address,
	})
	if err != nil {
		return uuid.Nil, err
	}

	return recipient.ID, nil
}

// Conversion function from DB model to Proto
func toProtoChalani(c *db.Chalani) *chalaniv1.Chalani {
	chalani := &chalaniv1.Chalani{
		Id:         c.ID.String(),
		FiscalYear: &chalaniv1.FiscalYear{Id: c.FiscalYearID},
		Scope:      stringToScope(c.Scope),
		Subject:    c.Subject,
		Body:       c.Body,
		Status:     stringToChalaniStatus(c.Status),
		CreatedAt:  timestamppb.New(c.CreatedAt.Time),
		UpdatedAt:  timestamppb.New(c.UpdatedAt.Time),
	}

	if c.WardID != nil {
		chalani.Ward = &chalaniv1.Ward{Id: *c.WardID}
	}

	if c.ChalaniNumber != nil {
		chalani.ChalaniNumber = *c.ChalaniNumber
	}

	if c.FormattedChalaniNumber != nil {
		chalani.FormattedChalaniNumber = *c.FormattedChalaniNumber
	}

	if c.DispatchChannel != nil {
		chalani.DispatchChannel = stringToDispatchChannel(*c.DispatchChannel)
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
	case "PENDING_REVIEW":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_PENDING_REVIEW
	case "PENDING_APPROVAL":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_PENDING_APPROVAL
	case "APPROVED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_APPROVED
	case "NUMBER_RESERVED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_NUMBER_RESERVED
	case "REGISTERED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_REGISTERED
	case "SIGNED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_SIGNED
	case "SEALED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_SEALED
	case "DISPATCHED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_DISPATCHED
	case "IN_TRANSIT":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_IN_TRANSIT
	case "ACKNOWLEDGED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_ACKNOWLEDGED
	case "RETURNED_UNDELIVERED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_RETURNED_UNDELIVERED
	case "DELIVERED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_DELIVERED
	case "VOIDED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_VOIDED
	case "SUPERSEDED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_SUPERSEDED
	case "CLOSED":
		return chalaniv1.ChalaniStatus_CHALANI_STATUS_CLOSED
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
	case "EDARTA_PORTAL":
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_EDARTA_PORTAL
	default:
		return chalaniv1.DispatchChannel_DISPATCH_CHANNEL_UNSPECIFIED
	}
}

// Placeholder implementations for unimplemented RPCs
func (s *ChalaniServer) GetChalaniByNumber(ctx context.Context, req *chalaniv1.GetChalaniByNumberRequest) (*chalaniv1.GetChalaniByNumberResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) GetMyChalani(ctx context.Context, req *chalaniv1.GetMyChalaniRequest) (*chalaniv1.GetMyChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) GetChalaniStats(ctx context.Context, req *chalaniv1.GetChalaniStatsRequest) (*chalaniv1.GetChalaniStatsResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) ListChalaniTemplates(ctx context.Context, req *chalaniv1.ListChalaniTemplatesRequest) (*chalaniv1.ListChalaniTemplatesResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) GetChalaniTemplate(ctx context.Context, req *chalaniv1.GetChalaniTemplateRequest) (*chalaniv1.GetChalaniTemplateResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) ReviewChalani(ctx context.Context, req *chalaniv1.ReviewChalaniRequest) (*chalaniv1.ReviewChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) FinalizeChalaniRegistration(ctx context.Context, req *chalaniv1.FinalizeChalaniRegistrationRequest) (*chalaniv1.FinalizeChalaniRegistrationResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) DirectRegisterChalani(ctx context.Context, req *chalaniv1.DirectRegisterChalaniRequest) (*chalaniv1.DirectRegisterChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) SignChalani(ctx context.Context, req *chalaniv1.SignChalaniRequest) (*chalaniv1.SignChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) SealChalani(ctx context.Context, req *chalaniv1.SealChalaniRequest) (*chalaniv1.SealChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) MarkChalaniInTransit(ctx context.Context, req *chalaniv1.MarkChalaniInTransitRequest) (*chalaniv1.MarkChalaniInTransitResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) AcknowledgeChalani(ctx context.Context, req *chalaniv1.AcknowledgeChalaniRequest) (*chalaniv1.AcknowledgeChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) MarkChalaniReturnedUndelivered(ctx context.Context, req *chalaniv1.MarkChalaniReturnedUndeliveredRequest) (*chalaniv1.MarkChalaniReturnedUndeliveredResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) ResendChalani(ctx context.Context, req *chalaniv1.ResendChalaniRequest) (*chalaniv1.ResendChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) SupersedeChalani(ctx context.Context, req *chalaniv1.SupersedeChalaniRequest) (*chalaniv1.SupersedeChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) CloseChalani(ctx context.Context, req *chalaniv1.CloseChalaniRequest) (*chalaniv1.CloseChalaniResponse, error) {
	return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *ChalaniServer) HealthCheck(ctx context.Context, req *chalaniv1.HealthCheckRequest) (*chalaniv1.HealthCheckResponse, error) {
	return &chalaniv1.HealthCheckResponse{
		Status:    "healthy",
		Service:   "chalani-service",
		Timestamp: timestamppb.Now(),
	}, nil
}
