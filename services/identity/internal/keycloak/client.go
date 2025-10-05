package keycloak

import (
	"context"
	"fmt"

	"github.com/Nerzal/gocloak/v13"
)

// Client wraps Keycloak API client
type Client struct {
	gocloak     *gocloak.GoCloak
	realm       string
	clientID    string
	clientSecret string
	adminToken  string
}

// Config holds Keycloak configuration
type Config struct {
	URL          string
	Realm        string
	ClientID     string
	ClientSecret string
}

// NewClient creates a new Keycloak client
func NewClient(cfg Config) *Client {
	client := gocloak.NewClient(cfg.URL)

	return &Client{
		gocloak:      client,
		realm:        cfg.Realm,
		clientID:     cfg.ClientID,
		clientSecret: cfg.ClientSecret,
	}
}

// Login authenticates with Keycloak and stores admin token
func (c *Client) Login(ctx context.Context) error {
	// For admin-cli client (no secret), use admin credentials
	if c.clientSecret == "" || c.clientSecret == "admin" {
		token, err := c.gocloak.LoginAdmin(ctx, "admin", "admin", c.realm)
		if err != nil {
			return fmt.Errorf("failed to login to keycloak: %w", err)
		}
		c.adminToken = token.AccessToken
		return nil
	}

	// For service clients with secrets
	token, err := c.gocloak.LoginClient(ctx, c.clientID, c.clientSecret, c.realm)
	if err != nil {
		return fmt.Errorf("failed to login to keycloak: %w", err)
	}

	c.adminToken = token.AccessToken
	return nil
}

// GetUser retrieves a user by ID from Keycloak
func (c *Client) GetUser(ctx context.Context, userID string) (*gocloak.User, error) {
	user, err := c.gocloak.GetUserByID(ctx, c.adminToken, c.realm, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetUsers retrieves users with optional filters
func (c *Client) GetUsers(ctx context.Context, params gocloak.GetUsersParams) ([]*gocloak.User, error) {
	users, err := c.gocloak.GetUsers(ctx, c.adminToken, c.realm, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}
	return users, nil
}

// CreateUser creates a new user in Keycloak
func (c *Client) CreateUser(ctx context.Context, user gocloak.User) (string, error) {
	userID, err := c.gocloak.CreateUser(ctx, c.adminToken, c.realm, user)
	if err != nil {
		return "", fmt.Errorf("failed to create user: %w", err)
	}
	return userID, nil
}

// UpdateUser updates an existing user
func (c *Client) UpdateUser(ctx context.Context, user gocloak.User) error {
	err := c.gocloak.UpdateUser(ctx, c.adminToken, c.realm, user)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// GetUserGroups retrieves groups for a user
func (c *Client) GetUserGroups(ctx context.Context, userID string) ([]*gocloak.Group, error) {
	groups, err := c.gocloak.GetUserGroups(ctx, c.adminToken, c.realm, userID, gocloak.GetGroupsParams{})
	if err != nil {
		return nil, fmt.Errorf("failed to get user groups: %w", err)
	}
	return groups, nil
}

// GetRoles retrieves all realm roles
func (c *Client) GetRoles(ctx context.Context) ([]*gocloak.Role, error) {
	roles, err := c.gocloak.GetRealmRoles(ctx, c.adminToken, c.realm, gocloak.GetRoleParams{})
	if err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	return roles, nil
}

// GetRoleByName retrieves a role by name
func (c *Client) GetRoleByName(ctx context.Context, roleName string) (*gocloak.Role, error) {
	role, err := c.gocloak.GetRealmRole(ctx, c.adminToken, c.realm, roleName)
	if err != nil {
		return nil, fmt.Errorf("failed to get role: %w", err)
	}
	return role, nil
}

// AddRealmRoleToUser adds a realm role to a user
func (c *Client) AddRealmRoleToUser(ctx context.Context, userID string, roles []gocloak.Role) error {
	err := c.gocloak.AddRealmRoleToUser(ctx, c.adminToken, c.realm, userID, roles)
	if err != nil {
		return fmt.Errorf("failed to add role to user: %w", err)
	}
	return nil
}

// GetGroup retrieves a group by ID
func (c *Client) GetGroup(ctx context.Context, groupID string) (*gocloak.Group, error) {
	group, err := c.gocloak.GetGroup(ctx, c.adminToken, c.realm, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group: %w", err)
	}
	return group, nil
}

// GetGroups retrieves all groups
func (c *Client) GetGroups(ctx context.Context, params gocloak.GetGroupsParams) ([]*gocloak.Group, error) {
	groups, err := c.gocloak.GetGroups(ctx, c.adminToken, c.realm, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get groups: %w", err)
	}
	return groups, nil
}
