package clients

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	dartav1 "git.ninjainfosys.com/ePalika/proto/gen/darta/v1"
)

// DartaService defines the gRPC operations required by the gateway resolvers.
type DartaService interface {
	CreateDarta(ctx context.Context, req *dartav1.CreateDartaRequest) (*dartav1.CreateDartaResponse, error)
	GetDarta(ctx context.Context, req *dartav1.GetDartaRequest) (*dartav1.GetDartaResponse, error)
	ListDartas(ctx context.Context, req *dartav1.ListDartasRequest) (*dartav1.ListDartasResponse, error)
	GetMyDartas(ctx context.Context, req *dartav1.GetMyDartasRequest) (*dartav1.GetMyDartasResponse, error)
	GetDartaStats(ctx context.Context, req *dartav1.GetDartaStatsRequest) (*dartav1.GetDartaStatsResponse, error)
	SubmitDartaForReview(ctx context.Context, req *dartav1.SubmitDartaForReviewRequest) (*dartav1.SubmitDartaForReviewResponse, error)
	ClassifyDarta(ctx context.Context, req *dartav1.ClassifyDartaRequest) (*dartav1.ClassifyDartaResponse, error)
	ReserveDartaNumber(ctx context.Context, req *dartav1.ReserveDartaNumberRequest) (*dartav1.ReserveDartaNumberResponse, error)
	FinalizeDartaRegistration(ctx context.Context, req *dartav1.FinalizeDartaRegistrationRequest) (*dartav1.FinalizeDartaRegistrationResponse, error)
	RouteDarta(ctx context.Context, req *dartav1.RouteDartaRequest) (*dartav1.RouteDartaResponse, error)
	CloseDarta(ctx context.Context, req *dartav1.CloseDartaRequest) (*dartav1.CloseDartaResponse, error)
	VoidDarta(ctx context.Context, req *dartav1.VoidDartaRequest) (*dartav1.VoidDartaResponse, error)
	HealthCheck(ctx context.Context, req *dartav1.HealthCheckRequest) (*dartav1.HealthCheckResponse, error)
}

// DartaClient wraps the gRPC client for the darta service.
type DartaClient struct {
	client dartav1.DartaServiceClient
	conn   *grpc.ClientConn
}

var _ DartaService = (*DartaClient)(nil)

// NewDartaClient creates a new darta gRPC client with sensible dialing defaults.
func NewDartaClient(ctx context.Context, address string) (*DartaClient, error) {
	if address == "" {
		return nil, fmt.Errorf("address is required")
	}

	dialCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	conn, err := grpc.DialContext(
		dialCtx,
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
		grpc.WithBlock(),
	)
	if err != nil {
		return nil, fmt.Errorf("connect to darta service: %w", err)
	}

	return &DartaClient{
		client: dartav1.NewDartaServiceClient(conn),
		conn:   conn,
	}, nil
}

// Close closes the gRPC connection.
func (c *DartaClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// CreateDarta creates a new darta.
func (c *DartaClient) CreateDarta(ctx context.Context, req *dartav1.CreateDartaRequest) (*dartav1.CreateDartaResponse, error) {
	return c.client.CreateDarta(ctx, req)
}

// GetDarta retrieves a darta by ID.
func (c *DartaClient) GetDarta(ctx context.Context, req *dartav1.GetDartaRequest) (*dartav1.GetDartaResponse, error) {
	return c.client.GetDarta(ctx, req)
}

// ListDartas lists dartas with pagination.
func (c *DartaClient) ListDartas(ctx context.Context, req *dartav1.ListDartasRequest) (*dartav1.ListDartasResponse, error) {
	return c.client.ListDartas(ctx, req)
}

// FinalizeDartaRegistration finalizes darta registration.
func (c *DartaClient) FinalizeDartaRegistration(ctx context.Context, req *dartav1.FinalizeDartaRegistrationRequest) (*dartav1.FinalizeDartaRegistrationResponse, error) {
	return c.client.FinalizeDartaRegistration(ctx, req)
}

// GetMyDartas retrieves dartas for the current user.
func (c *DartaClient) GetMyDartas(ctx context.Context, req *dartav1.GetMyDartasRequest) (*dartav1.GetMyDartasResponse, error) {
	return c.client.GetMyDartas(ctx, req)
}

// GetDartaStats retrieves statistics for dartas.
func (c *DartaClient) GetDartaStats(ctx context.Context, req *dartav1.GetDartaStatsRequest) (*dartav1.GetDartaStatsResponse, error) {
	return c.client.GetDartaStats(ctx, req)
}

// SubmitDartaForReview submits a darta for review.
func (c *DartaClient) SubmitDartaForReview(ctx context.Context, req *dartav1.SubmitDartaForReviewRequest) (*dartav1.SubmitDartaForReviewResponse, error) {
	return c.client.SubmitDartaForReview(ctx, req)
}

// ClassifyDarta classifies a darta.
func (c *DartaClient) ClassifyDarta(ctx context.Context, req *dartav1.ClassifyDartaRequest) (*dartav1.ClassifyDartaResponse, error) {
	return c.client.ClassifyDarta(ctx, req)
}

// ReserveDartaNumber reserves a darta number.
func (c *DartaClient) ReserveDartaNumber(ctx context.Context, req *dartav1.ReserveDartaNumberRequest) (*dartav1.ReserveDartaNumberResponse, error) {
	return c.client.ReserveDartaNumber(ctx, req)
}

// RouteDarta routes a darta to an organizational unit or assignee.
func (c *DartaClient) RouteDarta(ctx context.Context, req *dartav1.RouteDartaRequest) (*dartav1.RouteDartaResponse, error) {
	return c.client.RouteDarta(ctx, req)
}

// CloseDarta closes a darta.
func (c *DartaClient) CloseDarta(ctx context.Context, req *dartav1.CloseDartaRequest) (*dartav1.CloseDartaResponse, error) {
	return c.client.CloseDarta(ctx, req)
}

// VoidDarta voids a darta.
func (c *DartaClient) VoidDarta(ctx context.Context, req *dartav1.VoidDartaRequest) (*dartav1.VoidDartaResponse, error) {
	return c.client.VoidDarta(ctx, req)
}

// HealthCheck checks the health of the darta service.
func (c *DartaClient) HealthCheck(ctx context.Context, req *dartav1.HealthCheckRequest) (*dartav1.HealthCheckResponse, error) {
	return c.client.HealthCheck(ctx, req)
}
