package grpc

import (
	"context"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/domain"
)

// UnaryAuthInterceptor extracts authentication context from gRPC metadata
func UnaryAuthInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// Extract metadata from context
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			// No metadata, use defaults
			return handler(ctx, req)
		}

		// Extract headers injected by Oathkeeper
		userCtx := &domain.UserContext{
			UserID:    getMetadataValue(md, "x-user-id"),
			TenantID:  getMetadataValue(md, "x-tenant"),
			Roles:     getMetadataValues(md, "x-roles"),
			RequestID: getMetadataValue(md, "x-request-id"),
			IPAddress: getMetadataValue(md, "x-forwarded-for"),
			UserAgent: getMetadataValue(md, "user-agent"),
		}

		// Set defaults if missing
		if userCtx.TenantID == "" {
			userCtx.TenantID = "default"
		}
		if userCtx.UserID == "" {
			userCtx.UserID = "system"
		}

		// Add to context
		ctx = domain.WithUserContext(ctx, userCtx)

		return handler(ctx, req)
	}
}

// getMetadataValue extracts a single value from metadata
func getMetadataValue(md metadata.MD, key string) string {
	values := md.Get(key)
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

// getMetadataValues extracts multiple values (e.g., roles as comma-separated)
func getMetadataValues(md metadata.MD, key string) []string {
	value := getMetadataValue(md, key)
	if value == "" {
		return []string{}
	}
	// Split by comma if it's a comma-separated list
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
