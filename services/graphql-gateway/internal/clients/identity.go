package clients

import (
	"context"

	identityv1 "git.ninjainfosys.com/ePalika/proto/gen/identity/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// IdentityService defines the interface for identity operations
type IdentityService interface {
	Client() identityv1.IdentityServiceClient
	Close() error
}

// IdentityClient wraps the identity service gRPC client
type IdentityClient struct {
	conn   *grpc.ClientConn
	client identityv1.IdentityServiceClient
}

// NewIdentityClient creates a new identity client
func NewIdentityClient(ctx context.Context, addr string) (*IdentityClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := identityv1.NewIdentityServiceClient(conn)

	return &IdentityClient{
		conn:   conn,
		client: client,
	}, nil
}

// Close closes the gRPC connection
func (c *IdentityClient) Close() error {
	return c.conn.Close()
}

// Client returns the underlying gRPC client
func (c *IdentityClient) Client() identityv1.IdentityServiceClient {
	return c.client
}
