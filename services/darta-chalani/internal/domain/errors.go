package domain

import (
	"errors"
	"fmt"
)

// Domain errors
var (
	// Common errors
	ErrNotFound           = errors.New("resource not found")
	ErrAlreadyExists      = errors.New("resource already exists")
	ErrInvalidInput       = errors.New("invalid input")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrConflict           = errors.New("conflict")
	ErrInternalServer     = errors.New("internal server error")
	
	// Darta specific errors
	ErrDartaNotFound      = errors.New("darta not found")
	ErrInvalidDartaStatus = errors.New("invalid darta status transition")
	ErrDartaNumberExists  = errors.New("darta number already exists")
	ErrDuplicateDarta     = errors.New("duplicate darta submission")
	
	// Chalani specific errors
	ErrChalaniNotFound       = errors.New("chalani not found")
	ErrInvalidChalaniStatus  = errors.New("invalid chalani status transition")
	ErrNotFullyApproved      = errors.New("chalani not fully approved")
	ErrDuplicateChalani      = errors.New("duplicate chalani submission")
	
	// Attachment errors
	ErrAttachmentNotFound = errors.New("attachment not found")
	ErrInvalidFileType    = errors.New("invalid file type")
	ErrFileTooLarge       = errors.New("file too large")
)

// DomainError wraps errors with additional context
type DomainError struct {
	Err     error
	Message string
	Code    string
}

func (e *DomainError) Error() string {
	if e.Message != "" {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Err.Error()
}

func (e *DomainError) Unwrap() error {
	return e.Err
}

// NewDomainError creates a new domain error
func NewDomainError(err error, message string, code string) *DomainError {
	return &DomainError{
		Err:     err,
		Message: message,
		Code:    code,
	}
}

// Validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: field '%s': %s", e.Field, e.Message)
}

func NewValidationError(field, message string) *ValidationError {
	return &ValidationError{Field: field, Message: message}
}
