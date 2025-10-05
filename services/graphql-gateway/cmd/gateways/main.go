package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"git.ninjainfosys.com/ePalika/graphql-gateway/graph"
	"git.ninjainfosys.com/ePalika/graphql-gateway/internal/clients"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
)

const defaultPort = "8000"

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	dartaAddr := os.Getenv("DARTA_CHALANI_GRPC_ADDR")
	if dartaAddr == "" {
		dartaAddr = "localhost:9000"
	}

	pdpAddr := os.Getenv("PDP_GRPC_ADDR")
	if pdpAddr == "" {
		pdpAddr = "localhost:9100"
	}

	dartaClient, err := clients.NewDartaClient(ctx, dartaAddr)
	if err != nil {
		log.Fatalf("failed to create darta client: %v", err)
	}
	defer dartaClient.Close()

	pdpClient, err := clients.NewPDPClient(ctx, pdpAddr)
	if err != nil {
		log.Fatalf("failed to create pdp client: %v", err)
	}
	defer pdpClient.Close()

	resolver := graph.NewResolver(dartaClient, pdpClient)

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", srv)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"graphql-gateway"}`))
	})

	httpServer := &http.Server{
		Addr:         ":" + port,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		<-ctx.Done()
		log.Println("shutting down HTTP server...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			log.Printf("http server shutdown error: %v", err)
		}
	}()

	log.Printf("GraphQL Gateway listening on :%s", port)
	log.Printf("GraphQL Playground available at http://localhost:%s/", port)
	log.Printf("GraphQL endpoint at http://localhost:%s/query", port)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("failed to start server: %v", err)
	}
}
