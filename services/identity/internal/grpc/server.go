package grpc

import (
	"context"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	identityv1 "git.ninjainfosys.com/ePalika/proto/gen/identity/v1"
	"git.ninjainfosys.com/ePalika/services/identity/internal/keycloak"
)

// IdentityServer implements the IdentityService gRPC service
type IdentityServer struct {
	identityv1.UnimplementedIdentityServiceServer
	keycloakClient *keycloak.Client
}

// NewIdentityServer creates a new IdentityServer
func NewIdentityServer(keycloakClient *keycloak.Client) *IdentityServer {
	return &IdentityServer{
		keycloakClient: keycloakClient,
	}
}

// GetMe retrieves the current authenticated user
func (s *IdentityServer) GetMe(ctx context.Context, req *identityv1.GetMeRequest) (*identityv1.GetMeResponse, error) {
	// In a real implementation, extract user ID from context (passed from Oathkeeper)
	// For now, return not implemented
	return nil, status.Error(codes.Unimplemented, "GetMe requires authentication context from Oathkeeper")
}

// GetUser retrieves a user by ID
func (s *IdentityServer) GetUser(ctx context.Context, req *identityv1.GetUserRequest) (*identityv1.GetUserResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "user ID is required")
	}

	kcUser, err := s.keycloakClient.GetUser(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
	}

	user := convertKeycloakUserToProto(kcUser)

	return &identityv1.GetUserResponse{
		User: user,
	}, nil
}

// ListUsers retrieves a list of users with filters
func (s *IdentityServer) ListUsers(ctx context.Context, req *identityv1.ListUsersRequest) (*identityv1.ListUsersResponse, error) {
	params := gocloak.GetUsersParams{
		Max: gocloak.IntP(int(req.Limit)),
	}

	if req.Search != "" {
		params.Search = gocloak.StringP(req.Search)
	}

	kcUsers, err := s.keycloakClient.GetUsers(ctx, params)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list users: %v", err)
	}

	users := make([]*identityv1.User, len(kcUsers))
	for i, kcUser := range kcUsers {
		users[i] = convertKeycloakUserToProto(kcUser)
	}

	return &identityv1.ListUsersResponse{
		Users: users,
		Total: int64(len(users)),
	}, nil
}

// InviteUser creates a new user
func (s *IdentityServer) InviteUser(ctx context.Context, req *identityv1.InviteUserRequest) (*identityv1.InviteUserResponse, error) {
	if req.Input == nil {
		return nil, status.Error(codes.InvalidArgument, "input is required")
	}

	// Create Keycloak user
	enabled := true
	kcUser := gocloak.User{
		Username:      gocloak.StringP(req.Input.Username),
		Email:         gocloak.StringP(req.Input.Email),
		Enabled:       &enabled,
		EmailVerified: gocloak.BoolP(false),
	}

	// Add custom attributes for person data
	if req.Input.Person != nil {
		attributes := make(map[string][]string)
		if req.Input.Person.LegalName != "" {
			attributes["legalName"] = []string{req.Input.Person.LegalName}
		}
		if req.Input.Person.PreferredName != "" {
			attributes["preferredName"] = []string{req.Input.Person.PreferredName}
		}
		if req.Input.Person.DateOfBirth != "" {
			attributes["dateOfBirth"] = []string{req.Input.Person.DateOfBirth}
		}
		kcUser.Attributes = &attributes
	}

	userID, err := s.keycloakClient.CreateUser(ctx, kcUser)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	// Retrieve the created user
	createdUser, err := s.keycloakClient.GetUser(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to retrieve created user: %v", err)
	}

	return &identityv1.InviteUserResponse{
		User: convertKeycloakUserToProto(createdUser),
	}, nil
}

// GetOrgUnit retrieves an organizational unit by ID
func (s *IdentityServer) GetOrgUnit(ctx context.Context, req *identityv1.GetOrgUnitRequest) (*identityv1.GetOrgUnitResponse, error) {
	// OrgUnits are mapped to Keycloak groups
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "org unit ID is required")
	}

	group, err := s.keycloakClient.GetGroup(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "org unit not found: %v", err)
	}

	return &identityv1.GetOrgUnitResponse{
		OrgUnit: convertKeycloakGroupToOrgUnit(group),
	}, nil
}

// ListOrgUnits retrieves a list of organizational units
func (s *IdentityServer) ListOrgUnits(ctx context.Context, req *identityv1.ListOrgUnitsRequest) (*identityv1.ListOrgUnitsResponse, error) {
	params := gocloak.GetGroupsParams{}

	if req.Search != "" {
		params.Search = gocloak.StringP(req.Search)
	}

	groups, err := s.keycloakClient.GetGroups(ctx, params)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list org units: %v", err)
	}

	orgUnits := make([]*identityv1.OrgUnit, len(groups))
	for i, group := range groups {
		orgUnits[i] = convertKeycloakGroupToOrgUnit(group)
	}

	return &identityv1.ListOrgUnitsResponse{
		OrgUnits: orgUnits,
	}, nil
}

// CreateOrgUnit creates a new organizational unit
func (s *IdentityServer) CreateOrgUnit(ctx context.Context, req *identityv1.CreateOrgUnitRequest) (*identityv1.CreateOrgUnitResponse, error) {
	if req.Input == nil {
		return nil, status.Error(codes.InvalidArgument, "input is required")
	}

	// OrgUnits will be created as Keycloak groups
	// This is a placeholder - full implementation would create the group in Keycloak
	return nil, status.Error(codes.Unimplemented, "CreateOrgUnit not yet implemented")
}

// GetRole retrieves a role by key
func (s *IdentityServer) GetRole(ctx context.Context, req *identityv1.GetRoleRequest) (*identityv1.GetRoleResponse, error) {
	if req.Key == "" {
		return nil, status.Error(codes.InvalidArgument, "role key is required")
	}

	kcRole, err := s.keycloakClient.GetRoleByName(ctx, req.Key)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "role not found: %v", err)
	}

	return &identityv1.GetRoleResponse{
		Role: convertKeycloakRoleToProto(kcRole),
	}, nil
}

// ListRoles retrieves a list of roles
func (s *IdentityServer) ListRoles(ctx context.Context, req *identityv1.ListRolesRequest) (*identityv1.ListRolesResponse, error) {
	kcRoles, err := s.keycloakClient.GetRoles(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list roles: %v", err)
	}

	roles := make([]*identityv1.Role, len(kcRoles))
	for i, kcRole := range kcRoles {
		roles[i] = convertKeycloakRoleToProto(kcRole)
	}

	return &identityv1.ListRolesResponse{
		Roles: roles,
		Total: int64(len(roles)),
	}, nil
}

// GetGrant retrieves a grant by ID
func (s *IdentityServer) GetGrant(ctx context.Context, req *identityv1.GetGrantRequest) (*identityv1.GetGrantResponse, error) {
	// Grants are not directly stored in Keycloak - would need separate database
	return nil, status.Error(codes.Unimplemented, "GetGrant requires grant management database")
}

// ListGrants retrieves a list of grants
func (s *IdentityServer) ListGrants(ctx context.Context, req *identityv1.ListGrantsRequest) (*identityv1.ListGrantsResponse, error) {
	// Grants would require separate database
	return nil, status.Error(codes.Unimplemented, "ListGrants requires grant management database")
}

// RequestGrant creates a new grant request
func (s *IdentityServer) RequestGrant(ctx context.Context, req *identityv1.RequestGrantRequest) (*identityv1.RequestGrantResponse, error) {
	// Grant requests would require separate database
	return nil, status.Error(codes.Unimplemented, "RequestGrant requires grant management database")
}

// CheckPermission checks if a user has permission for an action
func (s *IdentityServer) CheckPermission(ctx context.Context, req *identityv1.CheckPermissionRequest) (*identityv1.CheckPermissionResponse, error) {
	// Permission checking would integrate with OpenFGA
	return nil, status.Error(codes.Unimplemented, "CheckPermission requires OpenFGA integration")
}

// HealthCheck returns health status
func (s *IdentityServer) HealthCheck(ctx context.Context, req *identityv1.HealthCheckRequest) (*identityv1.HealthCheckResponse, error) {
	return &identityv1.HealthCheckResponse{
		Status:    "healthy",
		Service:   "identity",
		Timestamp: timestamppb.Now(),
	}, nil
}

// Helper functions to convert Keycloak types to proto types

func convertKeycloakUserToProto(kcUser *gocloak.User) *identityv1.User {
	user := &identityv1.User{
		Id:       getStringValue(kcUser.ID),
		Username: getStringValue(kcUser.Username),
		Email:    getStringValue(kcUser.Email),
		Status:   identityv1.UserStatus_USER_STATUS_ACTIVE,
	}

	if kcUser.Enabled != nil && !*kcUser.Enabled {
		user.Status = identityv1.UserStatus_USER_STATUS_DISABLED
	}

	// Extract person data from attributes
	if kcUser.Attributes != nil {
		attrs := *kcUser.Attributes
		person := &identityv1.Person{
			Id: user.Id,
		}
		if legalName, ok := attrs["legalName"]; ok && len(legalName) > 0 {
			person.LegalName = legalName[0]
			user.FullName = legalName[0]
		}
		if preferredName, ok := attrs["preferredName"]; ok && len(preferredName) > 0 {
			person.PreferredName = preferredName[0]
		}
		if dob, ok := attrs["dateOfBirth"]; ok && len(dob) > 0 {
			person.DateOfBirth = dob[0]
		}
		user.Person = person
	}

	if kcUser.CreatedTimestamp != nil {
		user.CreatedAt = timestamppb.New(time.UnixMilli(*kcUser.CreatedTimestamp))
	}

	return user
}

func convertKeycloakGroupToOrgUnit(group *gocloak.Group) *identityv1.OrgUnit {
	orgUnit := &identityv1.OrgUnit{
		Id:   getStringValue(group.ID),
		Name: getStringValue(group.Name),
		Type: identityv1.OrgUnitType_ORG_UNIT_TYPE_ADMINISTRATION,
	}

	// Extract type from attributes if available
	if group.Attributes != nil {
		attrs := *group.Attributes
		if orgType, ok := attrs["type"]; ok && len(orgType) > 0 {
			orgUnit.Code = orgType[0]
		}
	}

	return orgUnit
}

func convertKeycloakRoleToProto(kcRole *gocloak.Role) *identityv1.Role {
	role := &identityv1.Role{
		Id:   getStringValue(kcRole.ID),
		Key:  getStringValue(kcRole.Name),
		Name: getStringValue(kcRole.Name),
	}

	if kcRole.Description != nil {
		role.Description = *kcRole.Description
	}

	// Constraints would need to be stored in role attributes
	role.Constraints = &identityv1.RoleConstraints{
		RequiresMfa: false,
	}

	return role
}

func getStringValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
