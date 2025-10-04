# GraphQL Gateway

A unified GraphQL gateway for all ePalika microservices.

## Features

- Single GraphQL endpoint for all microservices
- GraphQL Playground for interactive API exploration
- Sample resolvers for darta-chalani registration

## Running

### With Docker Compose

```bash
docker-compose up graphql-gateway
```

The GraphQL Playground will be available at: http://localhost:8000/

### Sample Queries

#### Health Check
```graphql
query {
  health {
    status
    service
  }
}
```

#### Register Darta
```graphql
mutation {
  registerDarta(input: {
    title: "Sample Darta"
    description: "This is a test registration"
    submittedBy: "John Doe"
  }) {
    success
    message
    dartaId
  }
}
```

## Architecture

The gateway acts as a unified entry point that:
- Exposes a single GraphQL API
- Routes requests to appropriate microservices
- Aggregates responses from multiple services
- Provides type safety and schema validation

## Adding New Services

To add resolvers for a new microservice:

1. Update `schema.graphql` with new types and operations
2. Implement resolvers in `graph/schema.resolvers.go`
3. Add the microservice URL to the Resolver struct
4. Update environment variables in docker-compose.yml
