package domain

import (
	"context"
)

// Context keys for storing user information
type contextKey string

const (
	UserIDKey     contextKey = "user_id"
	TenantIDKey   contextKey = "tenant_id"
	RolesKey      contextKey = "roles"
	RequestIDKey  contextKey = "request_id"
	IPAddressKey  contextKey = "ip_address"
	UserAgentKey  contextKey = "user_agent"
)

// UserContext contains authenticated user information
type UserContext struct {
	UserID    string
	TenantID  string
	Roles     []string
	RequestID string
	IPAddress string
	UserAgent string
}

// GetUserContext extracts user context from context.Context
func GetUserContext(ctx context.Context) *UserContext {
	return &UserContext{
		UserID:    GetStringValue(ctx, UserIDKey),
		TenantID:  GetStringValue(ctx, TenantIDKey),
		Roles:     GetStringSliceValue(ctx, RolesKey),
		RequestID: GetStringValue(ctx, RequestIDKey),
		IPAddress: GetStringValue(ctx, IPAddressKey),
		UserAgent: GetStringValue(ctx, UserAgentKey),
	}
}

// WithUserContext adds user context to context.Context
func WithUserContext(ctx context.Context, uc *UserContext) context.Context {
	ctx = context.WithValue(ctx, UserIDKey, uc.UserID)
	ctx = context.WithValue(ctx, TenantIDKey, uc.TenantID)
	ctx = context.WithValue(ctx, RolesKey, uc.Roles)
	ctx = context.WithValue(ctx, RequestIDKey, uc.RequestID)
	ctx = context.WithValue(ctx, IPAddressKey, uc.IPAddress)
	ctx = context.WithValue(ctx, UserAgentKey, uc.UserAgent)
	return ctx
}

// GetStringValue safely extracts string value from context
func GetStringValue(ctx context.Context, key contextKey) string {
	val := ctx.Value(key)
	if val == nil {
		return ""
	}
	str, ok := val.(string)
	if !ok {
		return ""
	}
	return str
}

// GetStringSliceValue safely extracts []string value from context
func GetStringSliceValue(ctx context.Context, key contextKey) []string {
	val := ctx.Value(key)
	if val == nil {
		return []string{}
	}
	slice, ok := val.([]string)
	if !ok {
		return []string{}
	}
	return slice
}
