package graph

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// doJSONRequest performs an HTTP request with an optional JSON payload and
// returns the response body alongside the HTTP status code.
func (r *Resolver) doJSONRequest(ctx context.Context, method, endpoint string, payload any) ([]byte, int, error) {
	if r.HTTPClient == nil {
		return nil, 0, fmt.Errorf("http client is not configured")
	}

	var body io.Reader
	if payload != nil {
		buf := &bytes.Buffer{}
		enc := json.NewEncoder(buf)
		enc.SetEscapeHTML(false)
		if err := enc.Encode(payload); err != nil {
			return nil, 0, fmt.Errorf("encode payload: %w", err)
		}
		body = buf
	}

	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return nil, 0, fmt.Errorf("build request: %w", err)
	}

	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")

	resp, err := r.HTTPClient.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("perform %s %s: %w", method, endpoint, err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, 0, fmt.Errorf("read response body: %w", err)
	}

	return data, resp.StatusCode, nil
}

// joinEndpoint composes a baseURL with one or more path segments using
// url.JoinPath to avoid double slashes.
func joinEndpoint(baseURL string, segments ...string) (string, error) {
	endpoint, err := url.JoinPath(baseURL, segments...)
	if err != nil {
		return "", fmt.Errorf("join URL path: %w", err)
	}
	return endpoint, nil
}

// extractMessage tries to pull a human-friendly message from a JSON body,
// falling back to the raw string if necessary.
func extractMessage(body []byte, fallback string) string {
	var payload map[string]any
	if len(body) > 0 {
		if err := json.Unmarshal(body, &payload); err == nil {
			if msg, ok := payload["message"].(string); ok && strings.TrimSpace(msg) != "" {
				return msg
			}
			if errMsg, ok := payload["error"].(string); ok && strings.TrimSpace(errMsg) != "" {
				return errMsg
			}
			if detail, ok := payload["detail"].(string); ok && strings.TrimSpace(detail) != "" {
				return detail
			}
		}
	}

	raw := strings.TrimSpace(string(body))
	if raw != "" {
		return raw
	}
	if fallback != "" {
		return fallback
	}
	return "service returned an error"
}
