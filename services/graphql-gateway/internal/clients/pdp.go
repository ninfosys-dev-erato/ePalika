package clients

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pdpv1 "git.ninjainfosys.com/ePalika/proto/gen/pdp/v1"
)

// PolicyDecisionService captures the operations required from the PDP microservice.
type PolicyDecisionService interface {
	HealthCheck(ctx context.Context, req *pdpv1.HealthCheckRequest) (*pdpv1.HealthCheckResponse, error)
	CheckAuthorization(ctx context.Context, req *pdpv1.CheckAuthorizationRequest) (*pdpv1.CheckAuthorizationResponse, error)
}

// PDPService is an alias for PolicyDecisionService for backward compatibility.
type PDPService = PolicyDecisionService

// PDPClient wraps the gRPC client for the PDP service.
type PDPClient struct {
	client pdpv1.PolicyDecisionServiceClient
	conn   *grpc.ClientConn
}

var _ PolicyDecisionService = (*PDPClient)(nil)

// NewPDPClient dials the PDP gRPC service.
func NewPDPClient(ctx context.Context, address string) (*PDPClient, error) {
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
		return nil, fmt.Errorf("connect to pdp service: %w", err)
	}

	return &PDPClient{
		client: pdpv1.NewPolicyDecisionServiceClient(conn),
		conn:   conn,
	}, nil
}

// Close closes the underlying gRPC connection.
func (c *PDPClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// HealthCheck proxies the gRPC health endpoint.
func (c *PDPClient) HealthCheck(ctx context.Context, req *pdpv1.HealthCheckRequest) (*pdpv1.HealthCheckResponse, error) {
	return c.client.HealthCheck(ctx, req)
}

// CheckAuthorization proxies the gRPC authorization endpoint.
func (c *PDPClient) CheckAuthorization(ctx context.Context, req *pdpv1.CheckAuthorizationRequest) (*pdpv1.CheckAuthorizationResponse, error) {
	return c.client.CheckAuthorization(ctx, req)
}
