package app

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/config"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
)

// Service coordinates business logic for darta registration workflows.
type Service struct {
	queries       db.Querier
	defaultTenant string
}

func NewService(queries db.Querier, cfg config.Config) *Service {
	return &Service{
		queries:       queries,
		defaultTenant: cfg.DefaultTenant,
	}
}

type RegisterInput struct {
	Title       string
	Description string
	SubmittedBy string
	Remarks     *string
	TenantID    string
}

type UpdateStatusInput struct {
	ID      uuid.UUID
	Status  string
	Remarks *string
}

type ListOptions struct {
	Limit  int32
	Offset int32
}

type Darta struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	SubmittedBy string  `json:"submittedBy"`
	Status      string  `json:"status"`
	Remarks     *string `json:"remarks,omitempty"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   *string `json:"updatedAt,omitempty"`
}

type ListResult struct {
	Items  []*Darta
	Total  int64
	Limit  int32
	Offset int32
}

// ErrNotFound indicates the requested darta record was not located.
var ErrNotFound = errors.New("darta not found")

func (s *Service) RegisterDarta(ctx context.Context, in RegisterInput) (*Darta, error) {
	if err := validateRegisterInput(in); err != nil {
		return nil, err
	}

	tenant := in.TenantID
	if tenant == "" {
		tenant = s.defaultTenant
	}

	darta, err := s.queries.CreateDarta(ctx, db.CreateDartaParams{
		ID:          uuid.New(),
		Title:       strings.TrimSpace(in.Title),
		Description: strings.TrimSpace(in.Description),
		SubmittedBy: strings.TrimSpace(in.SubmittedBy),
		Status:      "PENDING",
		Remarks:     normalizeStringPtr(in.Remarks),
		TenantID:    tenant,
	})
	if err != nil {
		return nil, fmt.Errorf("create darta: %w", err)
	}

	return convertDarta(darta), nil
}

func (s *Service) UpdateStatus(ctx context.Context, in UpdateStatusInput) (*Darta, error) {
	if err := validateStatus(in.Status); err != nil {
		return nil, err
	}

	darta, err := s.queries.UpdateDartaStatus(ctx, db.UpdateDartaStatusParams{
		ID:      in.ID,
		Status:  strings.ToUpper(in.Status),
		Remarks: normalizeStringPtr(in.Remarks),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update darta status: %w", err)
	}

	return convertDarta(darta), nil
}

func (s *Service) GetDarta(ctx context.Context, id uuid.UUID) (*Darta, error) {
	darta, err := s.queries.GetDarta(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get darta: %w", err)
	}
	return convertDarta(darta), nil
}

func (s *Service) ListDartas(ctx context.Context, opts ListOptions) (*ListResult, error) {
	if opts.Limit <= 0 {
		opts.Limit = 10
	}
	if opts.Offset < 0 {
		opts.Offset = 0
	}

	dartas, err := s.queries.ListDartas(ctx, db.ListDartasParams{
		Limit:  opts.Limit,
		Offset: opts.Offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list dartas: %w", err)
	}
	total, err := s.queries.CountDartas(ctx)
	if err != nil {
		return nil, fmt.Errorf("count dartas: %w", err)
	}

	list := make([]*Darta, 0, len(dartas))
	for _, d := range dartas {
		list = append(list, convertDarta(d))
	}

	return &ListResult{
		Items:  list,
		Total:  total,
		Limit:  opts.Limit,
		Offset: opts.Offset,
	}, nil
}

func validateRegisterInput(in RegisterInput) error {
	if strings.TrimSpace(in.Title) == "" {
		return fmt.Errorf("title is required")
	}
	if strings.TrimSpace(in.Description) == "" {
		return fmt.Errorf("description is required")
	}
	if strings.TrimSpace(in.SubmittedBy) == "" {
		return fmt.Errorf("submittedBy is required")
	}
	return nil
}

func validateStatus(status string) error {
	if status == "" {
		return fmt.Errorf("status is required")
	}
	allowed := map[string]struct{}{
		"PENDING":     {},
		"IN_PROGRESS": {},
		"APPROVED":    {},
		"REJECTED":    {},
		"COMPLETED":   {},
	}
	if _, ok := allowed[strings.ToUpper(status)]; !ok {
		return fmt.Errorf("unsupported status %q", status)
	}
	return nil
}

func convertDarta(d db.Darta) *Darta {
	dto := &Darta{
		ID:          d.ID.String(),
		Title:       d.Title,
		Description: d.Description,
		SubmittedBy: d.SubmittedBy,
		Status:      d.Status,
		Remarks:     d.Remarks,
		CreatedAt:   d.CreatedAt.UTC().Format(time.RFC3339),
	}
	if d.UpdatedAt != nil {
		formatted := d.UpdatedAt.UTC().Format(time.RFC3339)
		dto.UpdatedAt = &formatted
	}
	return dto
}

func normalizeStringPtr(in *string) *string {
	if in == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*in)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
