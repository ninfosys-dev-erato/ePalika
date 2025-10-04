package graph

import (
	"net/http"
	"time"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DartaChalaniURL string
	PDPURL          string
	HTTPClient      *http.Client
}

func NewResolver(dartaChalaniURL, pdpURL string) *Resolver {
	return &Resolver{
		DartaChalaniURL: dartaChalaniURL,
		PDPURL:          pdpURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}
