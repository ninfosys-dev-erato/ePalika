package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type authzReq struct {
	Subject  string         `json:"subject"`
	Resource string         `json:"resource"`
	Action   string         `json:"action"`
	Claims   map[string]any `json:"claims"`
	Context  map[string]any `json:"context"`
}

type fgaCheckReq struct {
	AuthorizationModelID string `json:"authorization_model_id,omitempty"`
	TupleKey             struct {
		User     string `json:"user"`
		Relation string `json:"relation"`
		Object   string `json:"object"`
	} `json:"tuple_key"`
	Context map[string]any `json:"context,omitempty"`
}

type fgaCheckResp struct {
	Allowed bool `json:"allowed"`
}

func mapActionToRelation(action string) string {
	switch action {
	case "read", "can_read":
		return "can_read"
	case "update", "can_write":
		return "can_write"
	case "delete":
		return "owner"
	default:
		return "viewer"
	}
}

func main() {
	fgaURL := mustEnv("FGA_CHECK_URL") // e.g. http://openfga.svc/stores/<id>/check
	fgaModelID := os.Getenv("FGA_MODEL_ID")
	fgaToken := os.Getenv("FGA_API_TOKEN")
	fmt.Println("fgaURL:", fgaURL, "fgaModelID:", fgaModelID, "fgaToken:", fgaToken)
	opaURL := os.Getenv("OPA_DECIDE_URL") // optional: http://opa.svc/v1/data/api/authz/allow

	client := &http.Client{Timeout: 2 * time.Second}

	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/authorize", func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		var in authzReq
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		log.Printf("PDP received request: %+v", in)

		// Optional OPA decision gate (ABAC / SoD / time rules)
		if opaURL != "" {
			allow, err := askOPA(client, opaURL, in)
			if err != nil {
				log.Printf("opa error: %v", err)
				http.Error(w, "opa", http.StatusInternalServerError)
				return
			}
			if !allow {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
		}

		freq := fgaCheckReq{AuthorizationModelID: fgaModelID, Context: in.Context}
		freq.TupleKey.User = in.Subject
		freq.TupleKey.Relation = mapActionToRelation(in.Action)
		freq.TupleKey.Object = in.Resource

		b, _ := json.Marshal(freq)
		log.Printf("FGA request payload: %s", string(b))
		req, _ := http.NewRequestWithContext(context.Background(), http.MethodPost, fgaURL, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
		if fgaToken != "" {
			req.Header.Set("Authorization", "Bearer "+fgaToken)
		}

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("fga error: %v", err)
			http.Error(w, "fga", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("fga non-200: %d", resp.StatusCode)
			http.Error(w, "fga", http.StatusInternalServerError)
			return
		}

		var out fgaCheckResp
		if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
			log.Printf("fga json error: %v", err)
			http.Error(w, "fga json", http.StatusInternalServerError)
			return
		}

		if out.Allowed {
			w.WriteHeader(http.StatusOK)
			return
		}
		http.Error(w, "forbidden", http.StatusForbidden)
	})

	log.Println("PDP listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func askOPA(c *http.Client, url string, in authzReq) (bool, error) {
	payload := struct {
		Input any `json:"input"`
	}{Input: in}
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, errors.New("opa non-200")
	}
	var out struct {
		Result bool `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return false, err
	}
	fmt.Printf("opa result: %v\n", out.Result)
	return out.Result, nil
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("%s not set", k)
	}
	return v
}
