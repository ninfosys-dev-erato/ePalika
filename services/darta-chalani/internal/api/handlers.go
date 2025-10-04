package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/app"
)

// Handler wires HTTP routes to the application service layer.
type Handler struct {
	svc           *app.Service
	pool          *pgxpool.Pool
	serviceName   string
	healthTimeout time.Duration
}

type Config struct {
	Service       *app.Service
	Pool          *pgxpool.Pool
	ServiceName   string
	HealthTimeout time.Duration
}

func NewHandler(cfg Config) http.Handler {
	h := &Handler{
		svc:           cfg.Service,
		pool:          cfg.Pool,
		serviceName:   cfg.ServiceName,
		healthTimeout: cfg.HealthTimeout,
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/health", h.health)

	r.Post("/register", h.register)

	r.Route("/dartas", func(r chi.Router) {
		r.Get("/", h.list)
		r.Post("/", h.register)
		r.Get("/{id}", h.get)
		r.Patch("/{id}", h.updateStatus)
	})

	return r
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), h.healthTimeout)
	defer cancel()

	status := http.StatusOK
	message := "healthy"

	if err := h.pool.Ping(ctx); err != nil {
		status = http.StatusServiceUnavailable
		message = "degraded"
	}

	respondJSON(w, status, map[string]any{
		"status":    message,
		"service":   h.serviceName,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		SubmittedBy string  `json:"submittedBy"`
		Remarks     *string `json:"remarks"`
		TenantID    string  `json:"tenantId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}

	darta, err := h.svc.RegisterDarta(r.Context(), app.RegisterInput{
		Title:       payload.Title,
		Description: payload.Description,
		SubmittedBy: payload.SubmittedBy,
		Remarks:     payload.Remarks,
		TenantID:    payload.TenantID,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"message": "Darta registered successfully",
		"darta":   darta,
		"dartaId": darta.ID,
	})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	dartaID, err := parseUUIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	darta, err := h.svc.GetDarta(r.Context(), dartaID)
	if err != nil {
		if errors.Is(err, app.ErrNotFound) {
			respondError(w, http.StatusNotFound, app.ErrNotFound.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Darta fetched",
		"darta":   darta,
	})
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	limit := parseQueryInt(r, "limit", 10)
	offset := parseQueryInt(r, "offset", 0)

	results, err := h.svc.ListDartas(r.Context(), app.ListOptions{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Darta list fetched",
		"data": map[string]any{
			"items":  results.Items,
			"total":  results.Total,
			"limit":  results.Limit,
			"offset": results.Offset,
		},
		"items":  results.Items,
		"total":  results.Total,
		"limit":  results.Limit,
		"offset": results.Offset,
	})
}

func (h *Handler) updateStatus(w http.ResponseWriter, r *http.Request) {
	dartaID, err := parseUUIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var payload struct {
		Status  string  `json:"status"`
		Remarks *string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}

	darta, err := h.svc.UpdateStatus(r.Context(), app.UpdateStatusInput{
		ID:      dartaID,
		Status:  payload.Status,
		Remarks: payload.Remarks,
	})
	if err != nil {
		if errors.Is(err, app.ErrNotFound) {
			respondError(w, http.StatusNotFound, app.ErrNotFound.Error())
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Status updated",
		"darta":   darta,
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]any{
		"success": false,
		"message": message,
	})
}

func parseUUIDParam(r *http.Request, key string) (uuid.UUID, error) {
	raw := chi.URLParam(r, key)
	if raw == "" {
		return uuid.Nil, errors.New("missing id parameter")
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, errors.New("invalid id parameter")
	}
	return id, nil
}

func parseQueryInt(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil || parsed < 0 {
		return fallback
	}
	return parsed
}
