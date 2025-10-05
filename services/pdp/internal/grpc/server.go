package grpc

import (
	"context"
	"errors"

	pdpv1 "git.ninjainfosys.com/ePalika/proto/gen/pdp/v1"
	"git.ninjainfosys.com/ePalika/services/pdp/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Server implements the PolicyDecisionService gRPC contract.
type Server struct {
	pdpv1.UnimplementedPolicyDecisionServiceServer
	svc *service.Service
}

// NewServer constructs a gRPC server backed by the given domain service.
func NewServer(svc *service.Service) *Server {
	return &Server{svc: svc}
}

// HealthCheck returns the current health of the PDP service.
func (s *Server) HealthCheck(ctx context.Context, _ *pdpv1.HealthCheckRequest) (*pdpv1.HealthCheckResponse, error) {
	health := s.svc.Health(ctx)
	return &pdpv1.HealthCheckResponse{
		Status:    health.Status,
		Service:   health.Service,
		Timestamp: timestamppb.New(health.Timestamp),
	}, nil
}

// CheckAuthorization evaluates an authorization decision for the provided input.
func (s *Server) CheckAuthorization(ctx context.Context, req *pdpv1.CheckAuthorizationRequest) (*pdpv1.CheckAuthorizationResponse, error) {
	result, err := s.svc.CheckAuthorization(ctx, service.AuthorizationRequest{
		User:     req.GetUser(),
		Relation: req.GetRelation(),
		Object:   req.GetObject(),
		Context:  req.GetContext(),
	})
	if err != nil {
		if errors.Is(err, service.ErrInvalidInput) {
			return nil, status.Error(codes.InvalidArgument, err.Error())
		}
		return nil, status.Errorf(codes.Internal, "authorization evaluation failed: %v", err)
	}

	return &pdpv1.CheckAuthorizationResponse{
		Allowed: result.Allowed,
		Message: result.Message,
		Reason:  result.Reason,
	}, nil
}
