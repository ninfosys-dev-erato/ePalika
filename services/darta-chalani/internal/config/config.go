package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
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

	HTTP struct {
		Port string
	}

	DB struct {
		DSN            string
		MaxConns       int32
		MinConns       int32
		MigrateTimeout time.Duration
		HealthTimeout  time.Duration
	}
}

// Load gathers configuration from environment variables, falling back to
// sensible defaults that keep local development simple.
func Load() (Config, error) {
	var cfg Config

	cfg.ServiceName = getEnv("SERVICE_NAME", defaultServiceName)
	cfg.DefaultTenant = getEnv("DEFAULT_TENANT", defaultDBTenant)

	cfg.HTTP.Port = getEnv("PORT", defaultPort)

	cfg.DB.DSN = os.Getenv("DARTA_DB_DSN")
	if cfg.DB.DSN == "" {
		return cfg, fmt.Errorf("DARTA_DB_DSN is required")
	}

	cfg.DB.MaxConns = getEnvInt32("DARTA_DB_MAX_CONNS", defaultDBMaxConns)
	cfg.DB.MinConns = getEnvInt32("DARTA_DB_MIN_CONNS", defaultDBMinConns)

	cfg.DB.MigrateTimeout = getEnvDuration("DARTA_DB_MIGRATE_TIMEOUT", 30*time.Second)
	cfg.DB.HealthTimeout = getEnvDuration("DARTA_DB_HEALTH_TIMEOUT", 2*time.Second)

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

func getEnvInt32(key string, fallback int32) int32 {
	if val, ok := os.LookupEnv(key); ok {
		parsed, err := strconv.Atoi(val)
		if err == nil && parsed >= 0 {
			return int32(parsed)
		}
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if val, ok := os.LookupEnv(key); ok {
		if parsed, err := time.ParseDuration(val); err == nil {
			return parsed
		}
	}
	return fallback
}
