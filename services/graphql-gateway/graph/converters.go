package graph

import (
	dartav1 "git.ninjainfosys.com/ePalika/proto/gen/darta/v1"
	"git.ninjainfosys.com/ePalika/graphql-gateway/graph/model"
)

// GraphQL to Proto enum converters

func scopeToProto(s model.Scope) dartav1.Scope {
	switch s {
	case model.ScopeMunicipality:
		return dartav1.Scope_SCOPE_MUNICIPALITY
	case model.ScopeWard:
		return dartav1.Scope_SCOPE_WARD
	default:
		return dartav1.Scope_SCOPE_UNSPECIFIED
	}
}

func scopePtrToProto(s *model.Scope) dartav1.Scope {
	if s == nil {
		return dartav1.Scope_SCOPE_UNSPECIFIED
	}
	return scopeToProto(*s)
}

func priorityToProto(p model.Priority) dartav1.Priority {
	switch p {
	case model.PriorityLow:
		return dartav1.Priority_PRIORITY_LOW
	case model.PriorityMedium:
		return dartav1.Priority_PRIORITY_MEDIUM
	case model.PriorityHigh:
		return dartav1.Priority_PRIORITY_HIGH
	case model.PriorityUrgent:
		return dartav1.Priority_PRIORITY_URGENT
	default:
		return dartav1.Priority_PRIORITY_UNSPECIFIED
	}
}

func priorityPtrToProto(p *model.Priority) dartav1.Priority {
	if p == nil {
		return dartav1.Priority_PRIORITY_UNSPECIFIED
	}
	return priorityToProto(*p)
}

func intakeChannelToProto(ic model.IntakeChannel) dartav1.IntakeChannel {
	switch ic {
	case model.IntakeChannelCounter:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_COUNTER
	case model.IntakeChannelPostal:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_POSTAL
	case model.IntakeChannelEmail:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_EMAIL
	case model.IntakeChannelEdartaPortal:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_EDARTA_PORTAL
	case model.IntakeChannelCourier:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_COURIER
	default:
		return dartav1.IntakeChannel_INTAKE_CHANNEL_UNSPECIFIED
	}
}

func intakeChannelPtrToProto(ic *model.IntakeChannel) dartav1.IntakeChannel {
	if ic == nil {
		return dartav1.IntakeChannel_INTAKE_CHANNEL_UNSPECIFIED
	}
	return intakeChannelToProto(*ic)
}

func dartaStatusPtrToProto(ds *model.DartaStatus) dartav1.DartaStatus {
	if ds == nil {
		return dartav1.DartaStatus_DARTA_STATUS_UNSPECIFIED
	}
	
	switch *ds {
	case model.DartaStatusDraft:
		return dartav1.DartaStatus_DARTA_STATUS_DRAFT
	case model.DartaStatusPendingReview:
		return dartav1.DartaStatus_DARTA_STATUS_PENDING_REVIEW
	case model.DartaStatusClassification:
		return dartav1.DartaStatus_DARTA_STATUS_CLASSIFICATION
	case model.DartaStatusNumberReserved:
		return dartav1.DartaStatus_DARTA_STATUS_NUMBER_RESERVED
	case model.DartaStatusRegistered:
		return dartav1.DartaStatus_DARTA_STATUS_REGISTERED
	case model.DartaStatusVoided:
		return dartav1.DartaStatus_DARTA_STATUS_VOIDED
	case model.DartaStatusAssigned:
		return dartav1.DartaStatus_DARTA_STATUS_ASSIGNED
	case model.DartaStatusClosed:
		return dartav1.DartaStatus_DARTA_STATUS_CLOSED
	default:
		return dartav1.DartaStatus_DARTA_STATUS_UNSPECIFIED
	}
}

func applicantTypeToProto(at model.ApplicantType) dartav1.ApplicantType {
	switch at {
	case model.ApplicantTypeCitizen:
		return dartav1.ApplicantType_APPLICANT_TYPE_CITIZEN
	case model.ApplicantTypeOrganization:
		return dartav1.ApplicantType_APPLICANT_TYPE_ORGANIZATION
	case model.ApplicantTypeGovernmentOffice:
		return dartav1.ApplicantType_APPLICANT_TYPE_GOVERNMENT_OFFICE
	case model.ApplicantTypeOther:
		return dartav1.ApplicantType_APPLICANT_TYPE_OTHER
	default:
		return dartav1.ApplicantType_APPLICANT_TYPE_UNSPECIFIED
	}
}

// Proto to GraphQL enum converters

func protoToScope(s dartav1.Scope) model.Scope {
	switch s {
	case dartav1.Scope_SCOPE_MUNICIPALITY:
		return model.ScopeMunicipality
	case dartav1.Scope_SCOPE_WARD:
		return model.ScopeWard
	default:
		return model.ScopeMunicipality
	}
}

func protoToPriority(p dartav1.Priority) model.Priority {
	switch p {
	case dartav1.Priority_PRIORITY_LOW:
		return model.PriorityLow
	case dartav1.Priority_PRIORITY_MEDIUM:
		return model.PriorityMedium
	case dartav1.Priority_PRIORITY_HIGH:
		return model.PriorityHigh
	case dartav1.Priority_PRIORITY_URGENT:
		return model.PriorityUrgent
	default:
		return model.PriorityMedium
	}
}

func protoToIntakeChannel(ic dartav1.IntakeChannel) model.IntakeChannel {
	switch ic {
	case dartav1.IntakeChannel_INTAKE_CHANNEL_COUNTER:
		return model.IntakeChannelCounter
	case dartav1.IntakeChannel_INTAKE_CHANNEL_POSTAL:
		return model.IntakeChannelPostal
	case dartav1.IntakeChannel_INTAKE_CHANNEL_EMAIL:
		return model.IntakeChannelEmail
	case dartav1.IntakeChannel_INTAKE_CHANNEL_EDARTA_PORTAL:
		return model.IntakeChannelEdartaPortal
	case dartav1.IntakeChannel_INTAKE_CHANNEL_COURIER:
		return model.IntakeChannelCourier
	default:
		return model.IntakeChannelCounter
	}
}

func protoToDartaStatus(ds dartav1.DartaStatus) model.DartaStatus {
	switch ds {
	case dartav1.DartaStatus_DARTA_STATUS_DRAFT:
		return model.DartaStatusDraft
	case dartav1.DartaStatus_DARTA_STATUS_PENDING_REVIEW:
		return model.DartaStatusPendingReview
	case dartav1.DartaStatus_DARTA_STATUS_CLASSIFICATION:
		return model.DartaStatusClassification
	case dartav1.DartaStatus_DARTA_STATUS_NUMBER_RESERVED:
		return model.DartaStatusNumberReserved
	case dartav1.DartaStatus_DARTA_STATUS_REGISTERED:
		return model.DartaStatusRegistered
	case dartav1.DartaStatus_DARTA_STATUS_VOIDED:
		return model.DartaStatusVoided
	case dartav1.DartaStatus_DARTA_STATUS_ASSIGNED:
		return model.DartaStatusAssigned
	case dartav1.DartaStatus_DARTA_STATUS_CLOSED:
		return model.DartaStatusClosed
	default:
		return model.DartaStatusDraft
	}
}

func protoToApplicantType(at dartav1.ApplicantType) model.ApplicantType {
	switch at {
	case dartav1.ApplicantType_APPLICANT_TYPE_CITIZEN:
		return model.ApplicantTypeCitizen
	case dartav1.ApplicantType_APPLICANT_TYPE_ORGANIZATION:
		return model.ApplicantTypeOrganization
	case dartav1.ApplicantType_APPLICANT_TYPE_GOVERNMENT_OFFICE:
		return model.ApplicantTypeGovernmentOffice
	case dartav1.ApplicantType_APPLICANT_TYPE_OTHER:
		return model.ApplicantTypeOther
	default:
		return model.ApplicantTypeCitizen
	}
}
