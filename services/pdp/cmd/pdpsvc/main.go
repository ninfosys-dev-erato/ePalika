package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	pdpv1 "git.ninjainfosys.com/ePalika/proto/gen/pdp/v1"
	"git.ninjainfosys.com/ePalika/services/pdp/internal/config"
	grpcserver "git.ninjainfosys.com/ePalika/services/pdp/internal/grpc"
	"git.ninjainfosys.com/ePalika/services/pdp/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	svc := service.New(cfg, nil)

	grpcSrv := grpc.NewServer()
	pdpv1.RegisterPolicyDecisionServiceServer(grpcSrv, grpcserver.NewServer(svc))
	reflection.Register(grpcSrv)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	go startHTTPHealth(ctx, cfg, svc)

	go func() {
		<-ctx.Done()
		log.Println("shutting down gRPC server...")
		grpcSrv.GracefulStop()
	}()

	log.Printf("%s gRPC server listening on :%s", cfg.ServiceName, cfg.GRPCPort)
	if err := grpcSrv.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}

func startHTTPHealth(ctx context.Context, cfg *config.Config, svc *service.Service) {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		health := svc.Health(r.Context())
		payload := map[string]any{
			"status":    health.Status,
			"service":   health.Service,
			"timestamp": health.Timestamp.Format(time.RFC3339),
		}
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			log.Printf("encode health payload: %v", err)
		}
	})

	srv := &http.Server{
		Addr:    ":" + cfg.HTTPPort,
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil && err != http.ErrServerClosed {
			log.Printf("health server shutdown: %v", err)
		}
	}()

	log.Printf("%s HTTP health server listening on :%s", cfg.ServiceName, cfg.HTTPPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("health server error: %v", err)
	}
}
