package config

import (
	"fmt"
	"os"
)

// Config holds application configuration
type Config struct {
	Port     string
	Keycloak KeycloakConfig
}

// KeycloakConfig holds Keycloak configuration
type KeycloakConfig struct {
	URL          string
	Realm        string
	ClientID     string
	ClientSecret string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		Port: getEnv("PORT", "9001"),
		Keycloak: KeycloakConfig{
			URL:          getEnv("KEYCLOAK_URL", "http://keycloak:8083"),
			Realm:        getEnv("KEYCLOAK_REALM", "epalika"),
			ClientID:     getEnv("KEYCLOAK_CLIENT_ID", "identity-service"),
			ClientSecret: getEnv("KEYCLOAK_CLIENT_SECRET", ""),
		},
	}

	// Validate required fields
	if cfg.Keycloak.ClientSecret == "" {
		return nil, fmt.Errorf("KEYCLOAK_CLIENT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
