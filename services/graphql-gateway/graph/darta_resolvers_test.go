package graph

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"git.ninjainfosys.com/ePalika/graphql-gateway/graph/model"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func TestParseDartaRegisterResponse(t *testing.T) {
	input := model.RegisterDartaInput{
		Title:       "Birth Certificate",
		Description: "Citizen request",
		SubmittedBy: "alice",
	}

	payload := []byte(`{
        "success": true,
        "message": "created",
        "dartaId": "D-123",
        "darta": {
            "id": "D-123",
            "title": "Birth Certificate",
            "description": "Citizen request",
            "submittedBy": "alice",
            "status": "PENDING",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }`)

	resp, err := parseDartaRegisterResponse(payload, input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !resp.Success {
		t.Fatalf("expected success true")
	}
	if resp.DartaID == nil || *resp.DartaID != "D-123" {
		t.Fatalf("unexpected dartaId: %#v", resp.DartaID)
	}
	if resp.Darta == nil || resp.Darta.Title != input.Title {
		t.Fatalf("unexpected darta payload: %#v", resp.Darta)
	}
}

func TestParseDartaMutationResponse(t *testing.T) {
	payload := []byte(`{
        "success": true,
        "message": "updated",
        "darta": {
            "id": "D-123",
            "title": "Birth Certificate",
            "description": "Citizen request",
            "submittedBy": "alice",
            "status": "APPROVED",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }`)

	resp, err := parseDartaMutationResponse(payload, model.DartaStatusApproved)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !resp.Success {
		t.Fatalf("expected success true")
	}
	if resp.Darta.Status != model.DartaStatusApproved {
		t.Fatalf("expected status approved, got %s", resp.Darta.Status)
	}
}

func TestParseDartaListResponse(t *testing.T) {
	payload := []byte(`{
        "success": true,
        "data": {
            "items": [
                {
                    "id": "D-1",
                    "title": "Doc 1",
                    "description": "Desc 1",
                    "submittedBy": "alice",
                    "status": "PENDING",
                    "createdAt": "2024-01-01T00:00:00Z"
                }
            ],
            "total": 1,
            "limit": 5,
            "offset": 0
        }
    }`)

	list, err := parseDartaListResponse(payload, 5, 0)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if list.Total != 1 || list.Limit != 5 || list.Offset != 0 {
		t.Fatalf("unexpected pagination: %#v", list)
	}
	if len(list.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(list.Items))
	}
}

func TestCheckAuthorizationUsesAuthorizeEndpoint(t *testing.T) {
	var requestedPath string
	transport := roundTripFunc(func(req *http.Request) (*http.Response, error) {
		requestedPath = req.URL.Path
		resp := &http.Response{
			StatusCode: http.StatusOK,
			Header:     make(http.Header),
			Body:       io.NopCloser(strings.NewReader(`{"allowed": true}`)),
		}
		return resp, nil
	})

	resolver := &Resolver{
		PDPURL:     "http://pdp.local",
		HTTPClient: &http.Client{Transport: transport},
	}

	resp, err := (&queryResolver{resolver}).CheckAuthorization(context.Background(), model.AuthCheckInput{
		User:     "user:1",
		Relation: "can_read",
		Object:   "document:1",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if requestedPath != "/authorize" {
		t.Fatalf("expected request path '/authorize', got %q", requestedPath)
	}
	if !resp.Allowed {
		t.Fatalf("expected authorization to be allowed")
	}
}
