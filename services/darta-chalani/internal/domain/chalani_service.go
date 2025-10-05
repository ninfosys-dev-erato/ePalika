package domain

import (
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
)

// ChalaniService handles Chalani business logic
// Note: Most Chalani logic is implemented directly in the gRPC server
// This service struct is kept for consistency with DartaService
type ChalaniService struct {
	queries db.Querier
}

// NewChalaniService creates a new Chalani service
func NewChalaniService(queries db.Querier) *ChalaniService {
	return &ChalaniService{
		queries: queries,
	}
}
