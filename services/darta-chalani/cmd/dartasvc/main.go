package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "healthy",
			"service": "darta-chalani",
		})
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]any{
			"path":    r.URL.Path,
			"method":  r.Method,
			"headers": r.Header,
			"msg":     "hello from darta chalani upstream via gateway",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})
	addr := ":9000"
	log.Println("echo upstream listening", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
