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
	RegisterDarta(ctx context.Context, req *dartav1.RegisterDartaRequest) (*dartav1.RegisterDartaResponse, error)
	GetDarta(ctx context.Context, req *dartav1.GetDartaRequest) (*dartav1.GetDartaResponse, error)
	ListDartas(ctx context.Context, req *dartav1.ListDartasRequest) (*dartav1.ListDartasResponse, error)
	UpdateDartaStatus(ctx context.Context, req *dartav1.UpdateDartaStatusRequest) (*dartav1.UpdateDartaStatusResponse, error)
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

// RegisterDarta registers a new darta.
func (c *DartaClient) RegisterDarta(ctx context.Context, req *dartav1.RegisterDartaRequest) (*dartav1.RegisterDartaResponse, error) {
	return c.client.RegisterDarta(ctx, req)
}

// GetDarta retrieves a darta by ID.
func (c *DartaClient) GetDarta(ctx context.Context, req *dartav1.GetDartaRequest) (*dartav1.GetDartaResponse, error) {
	return c.client.GetDarta(ctx, req)
}

// ListDartas lists dartas with pagination.
func (c *DartaClient) ListDartas(ctx context.Context, req *dartav1.ListDartasRequest) (*dartav1.ListDartasResponse, error) {
	return c.client.ListDartas(ctx, req)
}

// UpdateDartaStatus updates the status of a darta.
func (c *DartaClient) UpdateDartaStatus(ctx context.Context, req *dartav1.UpdateDartaStatusRequest) (*dartav1.UpdateDartaStatusResponse, error) {
	return c.client.UpdateDartaStatus(ctx, req)
}

// HealthCheck checks the health of the darta service.
func (c *DartaClient) HealthCheck(ctx context.Context, req *dartav1.HealthCheckRequest) (*dartav1.HealthCheckResponse, error) {
	return c.client.HealthCheck(ctx, req)
}
