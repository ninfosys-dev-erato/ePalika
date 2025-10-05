package graph

import (
	"git.ninjainfosys.com/ePalika/graphql-gateway/internal/clients"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DartaClient    clients.DartaService
	IdentityClient clients.IdentityService
	PDPClient      clients.PDPService
}

func NewResolver(dartaClient clients.DartaService, identityClient clients.IdentityService, pdpClient clients.PDPService) *Resolver {
	return &Resolver{
		DartaClient:    dartaClient,
		IdentityClient: identityClient,
		PDPClient:      pdpClient,
	}
}
