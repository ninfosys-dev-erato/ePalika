package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	identityv1 "git.ninjainfosys.com/ePalika/proto/gen/identity/v1"
	"git.ninjainfosys.com/ePalika/services/identity/internal/config"
	grpcserver "git.ninjainfosys.com/ePalika/services/identity/internal/grpc"
	"git.ninjainfosys.com/ePalika/services/identity/internal/keycloak"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize Keycloak client
	kcClient := keycloak.NewClient(keycloak.Config{
		URL:          cfg.Keycloak.URL,
		Realm:        cfg.Keycloak.Realm,
		ClientID:     cfg.Keycloak.ClientID,
		ClientSecret: cfg.Keycloak.ClientSecret,
	})

	// Login to Keycloak
	ctx := context.Background()
	if err := kcClient.Login(ctx); err != nil {
		log.Fatalf("failed to login to keycloak: %v", err)
	}
	log.Println("successfully logged in to keycloak")

	// Start token refresh goroutine
	go refreshKeycloakToken(kcClient)

	// Create gRPC server
	grpcServer := grpc.NewServer()

	// Register health check
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	// Register identity service
	identityServer := grpcserver.NewIdentityServer(kcClient)
	identityv1.RegisterIdentityServiceServer(grpcServer, identityServer)

	// Register reflection for grpcurl
	reflection.Register(grpcServer)

	// Start server
	listen, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	log.Printf("gRPC server listening on :%s", cfg.Port)

	// Graceful shutdown
	go func() {
		if err := grpcServer.Serve(listen); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down server...")
	grpcServer.GracefulStop()
	log.Println("server stopped")
}

// refreshKeycloakToken periodically refreshes the Keycloak admin token
func refreshKeycloakToken(client *keycloak.Client) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		ctx := context.Background()
		if err := client.Login(ctx); err != nil {
			log.Printf("failed to refresh keycloak token: %v", err)
		} else {
			log.Println("keycloak token refreshed")
		}
	}
}
