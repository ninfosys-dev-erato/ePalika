package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"git.ninjainfosys.com/ePalika/graphql-gateway/graph"
)

const defaultPort = "8000"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Get microservice URLs from environment or use defaults
	dartaChalaniURL := os.Getenv("DARTA_CHALANI_URL")
	if dartaChalaniURL == "" {
		dartaChalaniURL = "http://darta-chalani:9000"
	}

	pdpURL := os.Getenv("PDP_URL")
	if pdpURL == "" {
		pdpURL = "http://pdp:8080"
	}

	// Initialize resolver with dependencies
	resolver := graph.NewResolver(dartaChalaniURL, pdpURL)

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", srv)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"graphql-gateway"}`))
	})

	log.Printf("GraphQL Gateway listening on :%s", port)
	log.Printf("GraphQL Playground available at http://localhost:%s/", port)
	log.Printf("GraphQL endpoint at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
