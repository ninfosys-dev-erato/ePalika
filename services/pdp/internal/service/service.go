package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"git.ninjainfosys.com/ePalika/services/pdp/internal/config"
)

// Service encapsulates authorization logic that fronts OpenFGA (and optional OPA).
type Service struct {
	cfg        *config.Config
	httpClient *http.Client
}

// AuthorizationRequest represents an authorization check request in the domain layer.
type AuthorizationRequest struct {
	User     string
	Relation string
	Object   string
	Context  map[string]string
}

// AuthorizationResult contains the outcome of an authorization check.
type AuthorizationResult struct {
	Allowed bool
	Message string
	Reason  string
}

// HealthStatus represents the service health snapshot.
type HealthStatus struct {
	Status    string
	Service   string
	Timestamp time.Time
}

// Common errors returned by the service.
var (
	ErrInvalidInput = errors.New("invalid input")
)

// New creates a new authorization service instance.
func New(cfg *config.Config, client *http.Client) *Service {
	httpClient := client
	if httpClient == nil {
		httpClient = &http.Client{Timeout: cfg.HTTPTimeout}
	}

	return &Service{
		cfg:        cfg,
		httpClient: httpClient,
	}
}

// Health returns a health snapshot for the service.
func (s *Service) Health(_ context.Context) *HealthStatus {
	return &HealthStatus{
		Status:    "healthy",
		Service:   s.cfg.ServiceName,
		Timestamp: time.Now().UTC(),
	}
}

// CheckAuthorization evaluates whether the given subject can perform the relation on the object.
func (s *Service) CheckAuthorization(ctx context.Context, input AuthorizationRequest) (*AuthorizationResult, error) {
	user := strings.TrimSpace(input.User)
	relation := strings.TrimSpace(input.Relation)
	object := strings.TrimSpace(input.Object)

	if user == "" {
		return nil, fmt.Errorf("%w: user is required", ErrInvalidInput)
	}
	if relation == "" {
		return nil, fmt.Errorf("%w: relation is required", ErrInvalidInput)
	}
	if object == "" {
		return nil, fmt.Errorf("%w: object is required", ErrInvalidInput)
	}

	normalizedRelation := mapActionToRelation(relation)

	if s.cfg.OPA.DecideURL != "" {
		allowed, err := s.askOPA(ctx, user, normalizedRelation, object, input.Context)
		if err != nil {
			return nil, fmt.Errorf("opa decision: %w", err)
		}
		if !allowed {
			return &AuthorizationResult{
				Allowed: false,
				Message: "Denied by OPA policy",
				Reason:  "opa_denied",
			}, nil
		}
	}

	result, err := s.askFGA(ctx, user, normalizedRelation, object, input.Context)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *Service) askOPA(ctx context.Context, user, relation, object string, ctxMap map[string]string) (bool, error) {
	payload := struct {
		Input any `json:"input"`
	}{
		Input: map[string]any{
			"subject":  user,
			"resource": object,
			"action":   relation,
			"context":  ctxMap,
		},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return false, fmt.Errorf("marshal opa payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.cfg.OPA.DecideURL, bytes.NewReader(data))
	if err != nil {
		return false, fmt.Errorf("create opa request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("perform opa request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("opa returned status %d", resp.StatusCode)
	}

	var out struct {
		Result bool `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return false, fmt.Errorf("decode opa response: %w", err)
	}

	return out.Result, nil
}

func (s *Service) askFGA(ctx context.Context, user, relation, object string, ctxMap map[string]string) (*AuthorizationResult, error) {
	payload := fgaCheckRequest{AuthorizationModelID: s.cfg.FGA.ModelID}
	payload.TupleKey.User = user
	payload.TupleKey.Relation = relation
	payload.TupleKey.Object = object

	if len(ctxMap) > 0 {
		payload.Context = make(map[string]any, len(ctxMap))
		for k, v := range ctxMap {
			payload.Context[k] = v
		}
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal fga payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.cfg.FGA.CheckURL, bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("create fga request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token := strings.TrimSpace(s.cfg.FGA.APIToken); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("perform fga request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Try to extract error message for logging / response.
		var errorPayload struct {
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&errorPayload); err == nil {
			msg := errorPayload.Message
			if msg == "" {
				msg = errorPayload.Error
			}
			if msg != "" {
				return nil, fmt.Errorf("fga returned status %d: %s", resp.StatusCode, msg)
			}
		}
		return nil, fmt.Errorf("fga returned status %d", resp.StatusCode)
	}

	var out fgaCheckResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("decode fga response: %w", err)
	}

	message := out.Message
	if message == "" {
		message = "Authorization check completed"
	}

	return &AuthorizationResult{
		Allowed: out.Allowed,
		Message: message,
		Reason:  out.Reason,
	}, nil
}

func mapActionToRelation(action string) string {
	normalized := strings.ToLower(strings.TrimSpace(action))
	switch normalized {
	case "read", "can_read", "viewer":
		return "can_read"
	case "update", "write", "can_write", "editor":
		return "can_write"
	case "delete", "owner":
		return "owner"
	default:
		return normalized
	}
}

type fgaCheckRequest struct {
	AuthorizationModelID string         `json:"authorization_model_id,omitempty"`
	TupleKey             fgaTupleKey    `json:"tuple_key"`
	Context              map[string]any `json:"context,omitempty"`
}

type fgaTupleKey struct {
	User     string `json:"user"`
	Relation string `json:"relation"`
	Object   string `json:"object"`
}

type fgaCheckResponse struct {
	Allowed bool   `json:"allowed"`
	Message string `json:"message"`
	Reason  string `json:"reason"`
}
