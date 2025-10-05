package config

import (
	"fmt"
	"os"
)

const (
	defaultPort              = "9000"
	defaultServiceName       = "darta-chalani"
	defaultDBMaxConns  int32 = 10
	defaultDBMinConns  int32 = 2
	defaultDBTenant          = "default"
)

// Config captures runtime configuration for the darta-chalani service.
type Config struct {
	ServiceName   string
	DefaultTenant string
	GRPCPort      string
	DatabaseDSN   string
}

// Load gathers configuration from environment variables, falling back to
// sensible defaults that keep local development simple.
func Load() (*Config, error) {
	cfg := &Config{
		ServiceName:   getEnv("SERVICE_NAME", defaultServiceName),
		DefaultTenant: getEnv("DEFAULT_TENANT", defaultDBTenant),
		GRPCPort:      getEnv("GRPC_PORT", defaultPort),
		DatabaseDSN:   os.Getenv("DARTA_DB_DSN"),
	}

	if cfg.DatabaseDSN == "" {
		return nil, fmt.Errorf("DARTA_DB_DSN is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
