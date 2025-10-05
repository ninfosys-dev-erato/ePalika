package config

import (
	"fmt"
	"os"
	"time"
)

// Config holds runtime configuration for the PDP service.
type Config struct {
	ServiceName string
	GRPCPort    string
	HTTPPort    string
	HTTPTimeout time.Duration
	FGA         FGAConfig
	OPA         OPAConfig
}

// FGAConfig captures OpenFGA connection details.
type FGAConfig struct {
	CheckURL string
	ModelID  string
	APIToken string
}

// OPAConfig captures the optional OPA decision endpoint.
type OPAConfig struct {
	DecideURL string
}

// Load reads configuration from the environment with sensible defaults.
func Load() (*Config, error) {
	cfg := &Config{
		ServiceName: envOrDefault("SERVICE_NAME", "pdp"),
		GRPCPort:    envOrDefault("PDP_GRPC_PORT", "9100"),
		HTTPPort:    envOrDefault("PDP_HTTP_PORT", "8080"),
		HTTPTimeout: 2 * time.Second,
	}

	if v := os.Getenv("HTTP_TIMEOUT"); v != "" {
		timeout, err := time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("parse HTTP_TIMEOUT: %w", err)
		}
		cfg.HTTPTimeout = timeout
	}

	cfg.FGA.CheckURL = os.Getenv("FGA_CHECK_URL")
	if cfg.FGA.CheckURL == "" {
		return nil, fmt.Errorf("FGA_CHECK_URL is required")
	}
	cfg.FGA.ModelID = os.Getenv("FGA_MODEL_ID")
	cfg.FGA.APIToken = os.Getenv("FGA_API_TOKEN")
	cfg.OPA.DecideURL = os.Getenv("OPA_DECIDE_URL")

	return cfg, nil
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
