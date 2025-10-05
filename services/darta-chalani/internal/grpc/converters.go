package grpc

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	dartav1 "git.ninjainfosys.com/ePalika/proto/gen/darta/v1"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/domain"
)

// toProtoDarta converts db.Darta to proto Darta
func toProtoDarta(d *db.Darta) *dartav1.Darta {
	if d == nil {
		return nil
	}

	darta := &dartav1.Darta{
		Id:            d.ID.String(),
		FiscalYear:    &dartav1.FiscalYear{Id: d.FiscalYearID},
		Scope:         stringToScope(d.Scope),
		Subject:       d.Subject,
		IntakeChannel: stringToIntakeChannel(d.IntakeChannel),
		ReceivedDate:  timestamppb.New(d.ReceivedDate),
		EntryDate:     timestamppb.New(d.EntryDate),
		IsBackdated:   d.IsBackdated,
		Status:        stringToDartaStatus(d.Status),
		Priority:      stringToPriority(d.Priority),
		CreatedBy:     &dartav1.User{Id: d.CreatedBy},
		CreatedAt:     timestamppb.New(d.CreatedAt),
		UpdatedAt:     timestamppb.New(d.UpdatedAt),
		TenantID:      d.TenantID,
	}

	if d.DartaNumber != nil {
		darta.DartaNumber = *d.DartaNumber
	}
	if d.FormattedDartaNumber != nil {
		darta.FormattedDartaNumber = *d.FormattedDartaNumber
	}
	if d.WardID != nil {
		darta.Ward = &dartav1.Ward{Id: *d.WardID}
	}
	if d.BackdateReason != nil {
		darta.BackdateReason = *d.BackdateReason
	}
	if d.BackdateApproverID != nil {
		darta.BackdateApprover = &dartav1.User{Id: *d.BackdateApproverID}
	}
	if d.ClassificationCode != nil {
		darta.ClassificationCode = *d.ClassificationCode
	}
	if d.AssignedToUnitID != nil {
		darta.AssignedTo = &dartav1.OrganizationalUnit{Id: *d.AssignedToUnitID}
	}
	if d.CurrentAssigneeID != nil {
		darta.CurrentAssignee = &dartav1.User{Id: *d.CurrentAssigneeID}
	}
	if d.SlaDeadline != nil {
		darta.SlaDeadline = timestamppb.New(*d.SlaDeadline)
	}

	darta.PrimaryDocument = &dartav1.Attachment{Id: d.PrimaryDocumentID.String()}
	darta.Applicant = &dartav1.Applicant{Id: d.ApplicantID.String()}

	return darta
}

// buildDartaFromRow builds full Darta from GetDartaRow
func buildDartaFromRow(row *db.GetDartaRow) *dartav1.Darta {
	if row == nil {
		return nil
	}

	darta := &dartav1.Darta{
		Id:            row.ID.String(),
		FiscalYear:    &dartav1.FiscalYear{Id: row.FiscalYearID},
		Scope:         stringToScope(row.Scope),
		Subject:       row.Subject,
		IntakeChannel: stringToIntakeChannel(row.IntakeChannel),
		ReceivedDate:  timestamppb.New(row.ReceivedDate),
		EntryDate:     timestamppb.New(row.EntryDate),
		IsBackdated:   row.IsBackdated,
		Status:        stringToDartaStatus(row.Status),
		Priority:      stringToPriority(row.Priority),
		CreatedBy:     &dartav1.User{Id: row.CreatedBy},
		CreatedAt:     timestamppb.New(row.CreatedAt),
		UpdatedAt:     timestamppb.New(row.UpdatedAt),
		TenantID:      row.TenantID,
		Applicant: &dartav1.Applicant{
			Id:       row.ID_2.String(),
			Type:     stringToApplicantType(row.Type),
			FullName: row.FullName,
		},
	}

	if row.DartaNumber != nil {
		darta.DartaNumber = *row.DartaNumber
	}
	if row.FormattedDartaNumber != nil {
		darta.FormattedDartaNumber = *row.FormattedDartaNumber
	}

	return darta
}

// parseApplicantInput parses or creates an applicant
func parseApplicantInput(ctx context.Context, queries db.Querier, input *dartav1.ApplicantInput) (uuid.UUID, error) {
	if input == nil {
		return uuid.Nil, errors.New("applicant input is required")
	}

	// Create or find existing applicant
	applicant, err := queries.CreateApplicant(ctx, db.CreateApplicantParams{
		Type:     input.Type.String(),
		FullName: input.FullName,
		Organization: func() *string {
			if input.Organization != "" {
				return &input.Organization
			}
			return nil
		}(),
		Email: func() *string {
			if input.Email != "" {
				return &input.Email
			}
			return nil
		}(),
		Phone: func() *string {
			if input.Phone != "" {
				return &input.Phone
			}
			return nil
		}(),
		Address: func() *string {
			if input.Address != "" {
				return &input.Address
			}
			return nil
		}(),
		IdentificationNumber: func() *string {
			if input.IdentificationNumber != "" {
				return &input.IdentificationNumber
			}
			return nil
		}(),
	})
	if err != nil {
		return uuid.Nil, err
	}

	return applicant.ID, nil
}

// Enum converters
func stringToScope(s string) dartav1.Scope {
	switch s {
	case "MUNICIPALITY":
		return dartav1.Scope_SCOPE_MUNICIPALITY
	case "WARD":
		return dartav1.Scope_SCOPE_WARD
	default:
		return dartav1.Scope_SCOPE_UNSPECIFIED
	}
}

func stringToPriority(s string) dartav1.Priority {
	switch s {
	case "LOW":
		return dartav1.Priority_PRIORITY_LOW
	case "MEDIUM":
		return dartav1.Priority_PRIORITY_MEDIUM
	case "HIGH":
		return dartav1.Priority_PRIORITY_HIGH
	case "URGENT":
		return dartav1.Priority_PRIORITY_URGENT
	default:
		return dartav1.Priority_PRIORITY_UNSPECIFIED
	}
}

func stringToIntakeChannel(s string) dartav1.IntakeChannel {
	switch s {
	case "COUNTER":
		return dartav1.IntakeChannel_INTAKE_CHANNEL_COUNTER
	case "POSTAL":
		return dartav1.IntakeChannel_INTAKE_CHANNEL_POSTAL
	case "EMAIL":
		return dartav1.IntakeChannel_INTAKE_CHANNEL_EMAIL
	case "EDARTA_PORTAL":
		return dartav1.IntakeChannel_INTAKE_CHANNEL_EDARTA_PORTAL
	case "COURIER":
		return dartav1.IntakeChannel_INTAKE_CHANNEL_COURIER
	default:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_UNSPECIFIED
	}
}

func stringToDartaStatus(s string) dartav1.DartaStatus {
	switch s {
	case "DRAFT":
		return dartav1.DartaStatus_DARTA_STATUS_DRAFT
	case "PENDING_REVIEW":
		return dartav1.DartaStatus_DARTA_STATUS_PENDING_REVIEW
	case "CLASSIFICATION":
		return dartav1.DartaStatus_DARTA_STATUS_CLASSIFICATION
	case "NUMBER_RESERVED":
		return dartav1.DartaStatus_DARTA_STATUS_NUMBER_RESERVED
	case "REGISTERED":
		return dartav1.DartaStatus_DARTA_STATUS_REGISTERED
	case "VOIDED":
		return dartav1.DartaStatus_DARTA_STATUS_VOIDED
	case "ASSIGNED":
		return dartav1.DartaStatus_DARTA_STATUS_ASSIGNED
	case "CLOSED":
		return dartav1.DartaStatus_DARTA_STATUS_CLOSED
	default:
		return dartav1.DartaStatus_DARTA_STATUS_UNSPECIFIED
	}
}

func stringToApplicantType(s string) dartav1.ApplicantType {
	switch s {
	case "CITIZEN":
		return dartav1.ApplicantType_APPLICANT_TYPE_CITIZEN
	case "ORGANIZATION":
		return dartav1.ApplicantType_APPLICANT_TYPE_ORGANIZATION
	case "GOVERNMENT_OFFICE":
		return dartav1.ApplicantType_APPLICANT_TYPE_GOVERNMENT_OFFICE
	case "OTHER":
		return dartav1.ApplicantType_APPLICANT_TYPE_OTHER
	default:
		return dartav1.ApplicantType_APPLICANT_TYPE_UNSPECIFIED
	}
}

// Helper functions
func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func int32Ptr(i int32) *int32 {
	if i == 0 {
		return nil
	}
	return &i
}

func protoToPriority(p dartav1.Priority) *string {
	if p == dartav1.Priority_PRIORITY_UNSPECIFIED {
		return nil
	}
	s := p.String()
	return &s
}

// mapDomainError maps domain errors to gRPC status codes
func mapDomainError(err error) error {
	if err == nil {
		return nil
	}

	switch {
	case errors.Is(err, domain.ErrNotFound),
		errors.Is(err, domain.ErrDartaNotFound),
		errors.Is(err, domain.ErrChalaniNotFound):
		return status.Error(codes.NotFound, err.Error())
	case errors.Is(err, domain.ErrInvalidInput),
		errors.Is(err, domain.ErrInvalidDartaStatus),
		errors.Is(err, domain.ErrInvalidChalaniStatus):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, domain.ErrAlreadyExists),
		errors.Is(err, domain.ErrDuplicateDarta),
		errors.Is(err, domain.ErrDuplicateChalani):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, domain.ErrUnauthorized):
		return status.Error(codes.Unauthenticated, err.Error())
	case errors.Is(err, domain.ErrForbidden):
		return status.Error(codes.PermissionDenied, err.Error())
	default:
		// Check if it's a validation error
		var valErr *domain.ValidationError
		if errors.As(err, &valErr) {
			return status.Error(codes.InvalidArgument, valErr.Error())
		}
		return status.Error(codes.Internal, fmt.Sprintf("internal error: %v", err))
	}
}
