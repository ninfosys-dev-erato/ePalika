package grpc

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	dartav1 "git.ninjainfosys.com/ePalika/proto/gen/darta/v1"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/domain"
)

// DartaServer implements the DartaService gRPC service
type DartaServer struct {
	dartav1.UnimplementedDartaServiceServer
	dartaService *domain.DartaService
	queries      db.Querier
}

// NewDartaServer creates a new DartaServer
func NewDartaServer(dartaService *domain.DartaService, queries db.Querier) *DartaServer {
	return &DartaServer{
		dartaService: dartaService,
		queries:      queries,
	}
}

// CreateDarta creates a new darta
func (s *DartaServer) CreateDarta(ctx context.Context, req *dartav1.CreateDartaRequest) (*dartav1.CreateDartaResponse, error) {
	if req.Input == nil {
		return nil, status.Error(codes.InvalidArgument, "input is required")
	}

	// Parse applicant
	applicantID, err := parseApplicantInput(ctx, s.queries, req.Input.Applicant)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid applicant: %v", err)
	}

	// Parse primary document ID
	primaryDocID, err := uuid.Parse(req.Input.PrimaryDocumentId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid primary document ID")
	}

	// Parse annex IDs
	annexIDs := make([]uuid.UUID, 0, len(req.Input.AnnexIds))
	for _, id := range req.Input.AnnexIds {
		annexID, err := uuid.Parse(id)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid annex ID: %s", id)
		}
		annexIDs = append(annexIDs, annexID)
	}

	// Create darta
	input := domain.CreateDartaInput{
		FiscalYearID:      req.Input.Scope.String(),
		Scope:             req.Input.Scope.String(),
		WardID:            stringPtr(req.Input.WardId),
		Subject:           req.Input.Subject,
		ApplicantID:       applicantID,
		IntakeChannel:     req.Input.IntakeChannel.String(),
		ReceivedDate:      req.Input.ReceivedDate.AsTime(),
		PrimaryDocumentID: primaryDocID,
		AnnexIDs:          annexIDs,
		Priority:          req.Input.Priority.String(),
		IdempotencyKey:    req.Input.IdempotencyKey,
	}

	darta, err := s.dartaService.CreateDarta(ctx, input)
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.CreateDartaResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// GetDarta retrieves a darta by ID
func (s *DartaServer) GetDarta(ctx context.Context, req *dartav1.GetDartaRequest) (*dartav1.GetDartaResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	dartaRow, err := s.dartaService.GetDarta(ctx, id)
	if err != nil {
		return nil, mapDomainError(err)
	}

	// Build darta proto
	darta := buildDartaFromRow(dartaRow)

	return &dartav1.GetDartaResponse{
		Darta: darta,
	}, nil
}

// UpdateDartaStatus updates darta status
func (s *DartaServer) UpdateDartaStatus(ctx context.Context, req *dartav1.UpdateDartaStatusRequest) (*dartav1.UpdateDartaStatusResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.dartaService.UpdateDartaStatus(ctx, id, req.Status.String())
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.UpdateDartaStatusResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// SubmitDartaForReview submits darta for review
func (s *DartaServer) SubmitDartaForReview(ctx context.Context, req *dartav1.SubmitDartaForReviewRequest) (*dartav1.SubmitDartaForReviewResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.dartaService.UpdateDartaStatus(ctx, id, "PENDING_REVIEW")
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.SubmitDartaForReviewResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// ClassifyDarta classifies a darta
func (s *DartaServer) ClassifyDarta(ctx context.Context, req *dartav1.ClassifyDartaRequest) (*dartav1.ClassifyDartaResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	// Update classification code
	darta, err := s.queries.UpdateDartaClassification(ctx, db.UpdateDartaClassificationParams{
		ID:                 id,
		ClassificationCode: &req.ClassificationCode,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to classify darta: %v", err)
	}

	// Update status
	_, _ = s.dartaService.UpdateDartaStatus(ctx, id, "CLASSIFICATION")

	return &dartav1.ClassifyDartaResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// ReserveDartaNumber reserves a darta number
func (s *DartaServer) ReserveDartaNumber(ctx context.Context, req *dartav1.ReserveDartaNumberRequest) (*dartav1.ReserveDartaNumberResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.dartaService.ReserveDartaNumber(ctx, id)
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.ReserveDartaNumberResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// FinalizeDartaRegistration finalizes darta registration
func (s *DartaServer) FinalizeDartaRegistration(ctx context.Context, req *dartav1.FinalizeDartaRegistrationRequest) (*dartav1.FinalizeDartaRegistrationResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.dartaService.UpdateDartaStatus(ctx, id, "REGISTERED")
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.FinalizeDartaRegistrationResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// RouteDarta routes darta to a unit/user
func (s *DartaServer) RouteDarta(ctx context.Context, req *dartav1.RouteDartaRequest) (*dartav1.RouteDartaResponse, error) {
	if req.Input == nil {
		return nil, status.Error(codes.InvalidArgument, "input is required")
	}

	id, err := uuid.Parse(req.Input.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.dartaService.AssignDarta(
		ctx,
		id,
		stringPtr(req.Input.OrganizationalUnitId),
		stringPtr(req.Input.AssigneeId),
		protoToPriority(req.Input.Priority),
		int32Ptr(req.Input.SlaHours),
	)
	if err != nil {
		return nil, mapDomainError(err)
	}

	return &dartav1.RouteDartaResponse{
		Darta: toProtoDarta(darta),
	}, nil
}

// CloseDarta closes a darta
func (s *DartaServer) CloseDarta(ctx context.Context, req *dartav1.CloseDartaRequest) (*dartav1.CloseDartaResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.queries.CloseDarta(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to close darta: %v", err)
	}

	return &dartav1.CloseDartaResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// VoidDarta voids a darta
func (s *DartaServer) VoidDarta(ctx context.Context, req *dartav1.VoidDartaRequest) (*dartav1.VoidDartaResponse, error) {
	id, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid darta ID")
	}

	darta, err := s.queries.VoidDarta(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to void darta: %v", err)
	}

	return &dartav1.VoidDartaResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// ListDartas lists dartas with filtering
func (s *DartaServer) ListDartas(ctx context.Context, req *dartav1.ListDartasRequest) (*dartav1.ListDartasResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	// Build filter params
	limit := int32(10)
	offset := int32(0)
	if req.Pagination != nil {
		if req.Pagination.Limit > 0 {
			limit = req.Pagination.Limit
		}
		if req.Pagination.Offset > 0 {
			offset = req.Pagination.Offset
		}
	}

	// Query dartas
	rows, err := s.queries.ListDartas(ctx, db.ListDartasParams{
		FiscalYearID:      stringPtr(req.Filter.GetFiscalYearId()),
		Scope:             stringPtr(req.Filter.GetScope().String()),
		WardID:            stringPtr(req.Filter.GetWardId()),
		Status:            stringPtr(req.Filter.GetStatus().String()),
		Priority:          stringPtr(req.Filter.GetPriority().String()),
		AssignedToUnitID:  stringPtr(req.Filter.GetOrganizationalUnitId()),
		CurrentAssigneeID: stringPtr(req.Filter.GetAssigneeId()),
		Search:            stringPtr(req.Filter.GetSearch()),
		TenantID:          userCtx.TenantID,
		SortBy:            "created_at",
		Limit:             limit,
		Offset:            offset,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list dartas: %v", err)
	}

	// Build response
	edges := make([]*dartav1.DartaEdge, len(rows))
	for i, row := range rows {
		darta := buildDartaFromRow(&row)
		edges[i] = &dartav1.DartaEdge{
			Cursor: fmt.Sprintf("%d", offset+int32(i)),
			Node:   darta,
		}
	}

	// Get total count
	total, _ := s.queries.CountDartas(ctx, db.CountDartasParams{
		FiscalYearID: stringPtr(req.Filter.GetFiscalYearId()),
		Status:       stringPtr(req.Filter.GetStatus().String()),
		TenantID:     userCtx.TenantID,
	})

	return &dartav1.ListDartasResponse{
		Connection: &dartav1.DartaConnection{
			Edges: edges,
			PageInfo: &dartav1.PageInfo{
				HasNextPage:  int64(offset+limit) < total,
				TotalCount:   total,
			},
		},
	}, nil
}

// GetMyDartas gets dartas assigned to current user
func (s *DartaServer) GetMyDartas(ctx context.Context, req *dartav1.GetMyDartasRequest) (*dartav1.GetMyDartasResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	limit := int32(10)
	offset := int32(0)
	if req.Pagination != nil {
		if req.Pagination.Limit > 0 {
			limit = req.Pagination.Limit
		}
		offset = req.Pagination.Offset
	}

	rows, err := s.queries.GetMyDartas(ctx, db.GetMyDartasParams{
		CurrentAssigneeID: userCtx.UserID,
		Status:            stringPtr(req.Status.String()),
		TenantID:          userCtx.TenantID,
		Limit:             limit,
		Offset:            offset,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get my dartas: %v", err)
	}

	edges := make([]*dartav1.DartaEdge, len(rows))
	for i, row := range rows {
		darta := buildDartaFromRow(&row)
		edges[i] = &dartav1.DartaEdge{
			Cursor: fmt.Sprintf("%d", i),
			Node:   darta,
		}
	}

	total, _ := s.queries.CountMyDartas(ctx, db.CountMyDartasParams{
		CurrentAssigneeID: userCtx.UserID,
		Status:            stringPtr(req.Status.String()),
		TenantID:          userCtx.TenantID,
	})

	return &dartav1.GetMyDartasResponse{
		Connection: &dartav1.DartaConnection{
			Edges: edges,
			PageInfo: &dartav1.PageInfo{
				HasNextPage: int64(offset+limit) < total,
				TotalCount:  total,
			},
		},
	}, nil
}

// GetDartaStats gets darta statistics
func (s *DartaServer) GetDartaStats(ctx context.Context, req *dartav1.GetDartaStatsRequest) (*dartav1.GetDartaStatsResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	// Get counts by status
	statusCounts, _ := s.queries.GetDartaStatsByStatus(ctx, db.GetDartaStatsByStatusParams{
		TenantID: userCtx.TenantID,
	})

	// Get counts by channel
	channelCounts, _ := s.queries.GetDartaStatsByChannel(ctx, db.GetDartaStatsByChannelParams{
		TenantID: userCtx.TenantID,
	})

	// Get overdue count
	overdueCount, _ := s.queries.GetOverdueCount(ctx, db.GetOverdueCountParams{
		TenantID: userCtx.TenantID,
	})

	// Build response
	byStatus := make([]*dartav1.DartaStatusCount, len(statusCounts))
	for i, sc := range statusCounts {
		byStatus[i] = &dartav1.DartaStatusCount{
			Status: stringToDartaStatus(sc.Status),
			Count:  int32(sc.Count),
		}
	}

	byChannel := make([]*dartav1.ChannelCount, len(channelCounts))
	for i, cc := range channelCounts {
		byChannel[i] = &dartav1.ChannelCount{
			Channel: stringToIntakeChannel(cc.IntakeChannel),
			Count:   int32(cc.Count),
		}
	}

	return &dartav1.GetDartaStatsResponse{
		Stats: &dartav1.DartaStats{
			Total:                   int32(len(statusCounts)),
			ByStatus:                byStatus,
			ByChannel:               byChannel,
			OverdueCount:            int32(overdueCount),
			AvgProcessingTimeHours:  0, // TODO: Calculate
		},
	}, nil
}

// HealthCheck returns health status
func (s *DartaServer) HealthCheck(ctx context.Context, req *dartav1.HealthCheckRequest) (*dartav1.HealthCheckResponse, error) {
	return &dartav1.HealthCheckResponse{
		Status:    "healthy",
		Service:   "darta-chalani",
		Timestamp: timestamppb.Now(),
	}, nil
}

// GetDartaByNumber retrieves a darta by its formatted number
func (s *DartaServer) GetDartaByNumber(ctx context.Context, req *dartav1.GetDartaByNumberRequest) (*dartav1.GetDartaByNumberResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	darta, err := s.queries.GetDartaByFormattedNumber(ctx, db.GetDartaByFormattedNumberParams{
		FormattedDartaNumber: sql.NullString{String: req.FormattedNumber, Valid: true},
		TenantID:             userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	return &dartav1.GetDartaByNumberResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// ReviewDarta handles review decision (approve/reject/request changes)
func (s *DartaServer) ReviewDarta(ctx context.Context, req *dartav1.ReviewDartaRequest) (*dartav1.ReviewDartaResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Get current darta
	darta, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       dartaID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	// Validate current status
	if darta.Status != "PENDING_REVIEW" {
		return nil, status.Errorf(codes.FailedPrecondition, "darta must be in PENDING_REVIEW status")
	}

	// Determine new status based on decision
	var newStatus string
	switch req.Decision {
	case dartav1.DartaReviewDecision_DARTA_REVIEW_DECISION_APPROVED:
		newStatus = "CLASSIFICATION"
	case dartav1.DartaReviewDecision_DARTA_REVIEW_DECISION_REJECTED:
		newStatus = "VOIDED"
	case dartav1.DartaReviewDecision_DARTA_REVIEW_DECISION_REQUEST_CHANGES:
		newStatus = "RETURNED_FOR_CLARIFICATION"
	default:
		return nil, status.Error(codes.InvalidArgument, "invalid review decision")
	}

	// Update status
	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    newStatus,
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	// Create audit trail
	changes := map[string]interface{}{
		"status":         map[string]string{"from": darta.Status, "to": newStatus},
		"review_notes":   req.Notes,
		"review_decision": req.Decision.String(),
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "REVIEWED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.ReviewDartaResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// DirectRegisterDarta registers a darta directly (skips draft/review workflow)
func (s *DartaServer) DirectRegisterDarta(ctx context.Context, req *dartav1.DirectRegisterDartaRequest) (*dartav1.DirectRegisterDartaResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	// Parse applicant
	applicantID, err := parseApplicantInput(ctx, s.queries, req.Input.Applicant)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid applicant: %v", err)
	}

	// Use domain service to create with FINALIZED status directly
	input := domain.CreateDartaInput{
		FiscalYearID:   req.Input.FiscalYearId,
		Scope:          req.Input.Scope.String(),
		WardID:         strPtrOrNil(req.Input.WardId),
		Subject:        req.Input.Subject,
		ApplicantID:    applicantID,
		IntakeChannel:  req.Input.IntakeChannel.String(),
		ReceivedDate:   req.Input.ReceivedDate.AsTime(),
		Priority:       req.Input.Priority.String(),
		IdempotencyKey: req.Input.IdempotencyKey,
	}

	darta, err := s.dartaService.CreateDarta(ctx, input)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create darta: %v", err)
	}

	// Reserve number and finalize immediately
	if err := s.dartaService.ReserveDartaNumber(ctx, darta.ID); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to reserve number: %v", err)
	}

	if err := s.dartaService.FinalizeDartaRegistration(ctx, darta.ID); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to finalize: %v", err)
	}

	// Fetch updated darta
	updated, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       darta.ID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch updated darta: %v", err)
	}

	return &dartav1.DirectRegisterDartaResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// ScanDarta updates scan metadata for physical document scanning
func (s *DartaServer) ScanDarta(ctx context.Context, req *dartav1.ScanDartaRequest) (*dartav1.ScanDartaResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Update metadata with scan information
	scanMetadata := map[string]interface{}{
		"scan_date":    time.Now(),
		"scanner_user": userCtx.UserID,
		"scan_quality": req.ScanQuality,
		"page_count":   req.PageCount,
	}
	metadataJSON, _ := json.Marshal(scanMetadata)

	updated, err := s.queries.UpdateDartaMetadata(ctx, db.UpdateDartaMetadataParams{
		ID:       dartaID,
		Metadata: metadataJSON,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update metadata: %v", err)
	}

	return &dartav1.ScanDartaResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// EnrichDartaMetadata adds or updates metadata fields
func (s *DartaServer) EnrichDartaMetadata(ctx context.Context, req *dartav1.EnrichDartaMetadataRequest) (*dartav1.EnrichDartaMetadataResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Merge new metadata with existing
	updated, err := s.queries.UpdateDartaMetadata(ctx, db.UpdateDartaMetadataParams{
		ID:       dartaID,
		Metadata: []byte(req.Metadata),
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update metadata: %v", err)
	}

	return &dartav1.EnrichDartaMetadataResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// FinalizeDartaArchive marks darta as archived
func (s *DartaServer) FinalizeDartaArchive(ctx context.Context, req *dartav1.FinalizeDartaArchiveRequest) (*dartav1.FinalizeDartaArchiveResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Update status to ARCHIVED
	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    "ARCHIVED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to archive: %v", err)
	}

	// Create audit trail
	changes := map[string]interface{}{
		"status":       map[string]string{"to": "ARCHIVED"},
		"archive_notes": req.Notes,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "ARCHIVED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.FinalizeDartaArchiveResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// SectionReviewDarta handles section-level review
func (s *DartaServer) SectionReviewDarta(ctx context.Context, req *dartav1.SectionReviewDartaRequest) (*dartav1.SectionReviewDartaResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Similar to ReviewDarta but for section-level approval
	darta, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       dartaID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	var newStatus string
	if req.Approved {
		newStatus = "PENDING_APPROVAL"
	} else {
		newStatus = "RETURNED_FOR_CLARIFICATION"
	}

	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    newStatus,
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":        map[string]string{"from": darta.Status, "to": newStatus},
		"section_notes": req.Notes,
		"approved":      req.Approved,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "SECTION_REVIEWED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.SectionReviewDartaResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// RequestDartaClarification requests additional information from applicant
func (s *DartaServer) RequestDartaClarification(ctx context.Context, req *dartav1.RequestDartaClarificationRequest) (*dartav1.RequestDartaClarificationResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    "RETURNED_FOR_CLARIFICATION",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":               map[string]string{"to": "RETURNED_FOR_CLARIFICATION"},
		"clarification_notes":  req.ClarificationNotes,
		"requested_by":         userCtx.UserID,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "CLARIFICATION_REQUESTED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.RequestDartaClarificationResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// ProvideDartaClarification submits clarification from applicant
func (s *DartaServer) ProvideDartaClarification(ctx context.Context, req *dartav1.ProvideDartaClarificationRequest) (*dartav1.ProvideDartaClarificationResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Move back to PENDING_REVIEW after clarification provided
	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    "PENDING_REVIEW",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":             map[string]string{"from": "RETURNED_FOR_CLARIFICATION", "to": "PENDING_REVIEW"},
		"clarification_text": req.ClarificationText,
		"provided_by":        userCtx.UserID,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "CLARIFICATION_PROVIDED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.ProvideDartaClarificationResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// AcceptDarta marks darta as accepted by assigned staff
func (s *DartaServer) AcceptDarta(ctx context.Context, req *dartav1.AcceptDartaRequest) (*dartav1.AcceptDartaResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    "UNDER_PROCESSING",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":      map[string]string{"to": "UNDER_PROCESSING"},
		"accepted_by": userCtx.UserID,
		"accepted_at": time.Now(),
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "ACCEPTED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.AcceptDartaResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// MarkDartaAction records an action/decision taken on the darta
func (s *DartaServer) MarkDartaAction(ctx context.Context, req *dartav1.MarkDartaActionRequest) (*dartav1.MarkDartaActionResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Create audit trail for action
	changes := map[string]interface{}{
		"action_type":  req.ActionType,
		"action_notes": req.ActionNotes,
		"action_by":    userCtx.UserID,
	}
	changesJSON, _ := json.Marshal(changes)

	err = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "ACTION_MARKED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create audit trail: %v", err)
	}

	// Fetch darta for response
	darta, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       dartaID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	return &dartav1.MarkDartaActionResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// IssueDartaResponse prepares response to be sent to applicant
func (s *DartaServer) IssueDartaResponse(ctx context.Context, req *dartav1.IssueDartaResponseRequest) (*dartav1.IssueDartaResponseResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Move to RESOLVED status
	updated, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:        dartaID,
		Status:    "RESOLVED",
		TenantID:  userCtx.TenantID,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	changes := map[string]interface{}{
		"status":         map[string]string{"to": "RESOLVED"},
		"response_text":  req.ResponseText,
		"response_by":    userCtx.UserID,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "RESPONSE_ISSUED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.IssueDartaResponseResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}

// RequestDartaAck sends acknowledgement request to applicant
func (s *DartaServer) RequestDartaAck(ctx context.Context, req *dartav1.RequestDartaAckRequest) (*dartav1.RequestDartaAckResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Create audit trail for acknowledgement request
	changes := map[string]interface{}{
		"ack_requested":    true,
		"ack_requested_by": userCtx.UserID,
		"ack_requested_at": time.Now(),
	}
	changesJSON, _ := json.Marshal(changes)

	err = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "ACK_REQUESTED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create audit trail: %v", err)
	}

	darta, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       dartaID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	return &dartav1.RequestDartaAckResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// ReceiveDartaAck records acknowledgement from applicant
func (s *DartaServer) ReceiveDartaAck(ctx context.Context, req *dartav1.ReceiveDartaAckRequest) (*dartav1.ReceiveDartaAckResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	// Create audit trail for acknowledgement received
	changes := map[string]interface{}{
		"ack_received":    true,
		"ack_received_at": time.Now(),
		"ack_signature":   req.AcknowledgementSignature,
	}
	changesJSON, _ := json.Marshal(changes)

	err = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "ACK_RECEIVED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create audit trail: %v", err)
	}

	darta, err := s.queries.GetDartaByID(ctx, db.GetDartaByIDParams{
		ID:       dartaID,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "darta not found: %v", err)
	}

	return &dartav1.ReceiveDartaAckResponse{
		Darta: toProtoDarta(&darta),
	}, nil
}

// SupersedeDartaRecord marks a darta as superseded by another
func (s *DartaServer) SupersedeDartaRecord(ctx context.Context, req *dartav1.SupersedeDartaRecordRequest) (*dartav1.SupersedeDartaRecordResponse, error) {
	userCtx := domain.GetUserContext(ctx)

	dartaID, err := uuid.Parse(req.DartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid darta ID: %v", err)
	}

	supersededByID, err := uuid.Parse(req.SupersededByDartaId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid superseded by darta ID: %v", err)
	}

	// Update metadata to mark as superseded
	metadata := map[string]interface{}{
		"superseded": true,
		"superseded_by": supersededByID.String(),
		"superseded_at": time.Now(),
		"superseded_reason": req.Reason,
	}
	metadataJSON, _ := json.Marshal(metadata)

	updated, err := s.queries.UpdateDartaMetadata(ctx, db.UpdateDartaMetadataParams{
		ID:       dartaID,
		Metadata: metadataJSON,
		TenantID: userCtx.TenantID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update metadata: %v", err)
	}

	// Create audit trail
	changes := map[string]interface{}{
		"superseded_by": supersededByID.String(),
		"reason":        req.Reason,
	}
	changesJSON, _ := json.Marshal(changes)

	_ = s.queries.CreateAuditTrail(ctx, db.CreateAuditTrailParams{
		EntityType:  "DARTA",
		EntityID:    dartaID,
		Action:      "SUPERSEDED",
		PerformedBy: userCtx.UserID,
		Changes:     changesJSON,
		TenantID:    userCtx.TenantID,
	})

	return &dartav1.SupersedeDartaRecordResponse{
		Darta: toProtoDarta(&updated),
	}, nil
}
