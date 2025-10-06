# ePalika Postman Collections

This directory contains Postman collections and environments for testing the ePalika GraphQL API.

## 📁 Structure

```
postman/
├── collections/
│   ├── darta.postman_collection.json       # Darta (Incoming) API endpoints
│   └── chalani.postman_collection.json     # Chalani (Outgoing) API endpoints
├── environments/
│   ├── local.postman_environment.json      # Local development
│   ├── dev.postman_environment.json        # Development server
│   ├── staging.postman_environment.json    # Staging server
│   └── prod.postman_environment.json       # Production server
└── README.md
```

## 🚀 Quick Start

### 1. Import Collections

1. Open Postman
2. Click **Import** button
3. Select the collection files from `postman/collections/`
4. Import both `darta.postman_collection.json` and `chalani.postman_collection.json`

### 2. Import Environment

1. Click the **Environments** icon (gear icon)
2. Click **Import**
3. Select the appropriate environment file from `postman/environments/`
   - For local development: `local.postman_environment.json`
   - For dev server: `dev.postman_environment.json`
   - For staging: `staging.postman_environment.json`
   - For production: `prod.postman_environment.json`

### 3. Configure Environment Variables

After importing the environment:

1. Select the imported environment from the dropdown
2. Click the **eye icon** to view environment variables
3. Update the following variables with your credentials:
   - `keycloak_username`: Your Keycloak username
   - `keycloak_password`: Your Keycloak password

**Note**: The local environment has default test credentials (`testuser`/`testpass`).

### 4. Get JWT Token

Before making API calls:

1. Expand the **Authentication** folder in either collection
2. Run the **Get JWT Token** request
3. The token will be automatically saved to the `jwt_token` environment variable
4. All subsequent requests will use this token automatically

## 📚 Collections Overview

### Darta Collection

Endpoints for managing incoming correspondence (Darta):

**Queries:**
- Get Darta by ID
- Get Darta by Number
- List Dartas
- My Dartas
- Darta Stats

**Mutations:**
- Create Darta
- Submit Darta for Review
- Review Darta
- Classify Darta
- Reserve Darta Number
- Finalize Darta Registration
- Route Darta
- Close Darta
- Void Darta

**Health Check:**
- GraphQL Health (via Oathkeeper)
- Darta Service Health (Direct)

### Chalani Collection

Endpoints for managing outgoing correspondence (Chalani):

**Queries:**
- Get Chalani by ID
- Get Chalani by Number
- List Chalanis
- My Pending Approvals
- Chalani Templates
- Chalani Stats
- Chalani Review Queue
- Chalani Dispatch Board

**Mutations:**
- Create Chalani
- Submit Chalani
- Review Chalani
- Approve Chalani
- Reserve Chalani Number
- Finalize Chalani Registration
- Sign Chalani
- Dispatch Chalani
- Mark Chalani In Transit
- Acknowledge Chalani
- Mark Chalani Delivered
- Void Chalani
- Close Chalani

**Health Check:**
- GraphQL Health (via Oathkeeper)

## 🔐 Authentication

All API requests (except health checks and token acquisition) require JWT authentication.

### Authentication Flow

1. **Get Token**: Run the "Get JWT Token" request with valid credentials
2. **Auto-save**: The response script automatically saves the token to `jwt_token` variable
3. **Auto-use**: All requests inherit the collection-level Bearer token authentication

### Token Expiry

Keycloak tokens typically expire after 5 minutes (300 seconds). If you get authentication errors:

1. Re-run the **Get JWT Token** request
2. Continue with your API calls

## 🧪 Testing Workflows

### Darta Workflow Example

1. **Get Token** → Authentication/Get JWT Token
2. **Create Darta** → Mutations/Create Darta
   - Note: The `darta_id` is automatically saved
3. **Submit for Review** → Mutations/Submit Darta for Review
4. **Review** → Mutations/Review Darta
5. **Classify** → Mutations/Classify Darta
6. **Route** → Mutations/Route Darta
7. **Close** → Mutations/Close Darta

### Chalani Workflow Example

1. **Get Token** → Authentication/Get JWT Token
2. **Create Chalani** → Mutations/Create Chalani
   - Note: The `chalani_id` is automatically saved
3. **Submit** → Mutations/Submit Chalani
4. **Review** → Mutations/Review Chalani
5. **Approve** → Mutations/Approve Chalani
6. **Sign** → Mutations/Sign Chalani
7. **Dispatch** → Mutations/Dispatch Chalani
8. **Mark Delivered** → Mutations/Mark Chalani Delivered
9. **Close** → Mutations/Close Chalani

## 🌐 Environment Configuration

### Local Environment

Default configuration for local Docker Compose setup:

- GraphQL API: `http://localhost:4455/graphql` (via Oathkeeper)
- Keycloak: `http://localhost:8083`
- Direct Services:
  - Darta: `http://localhost:9000`
  - Identity: `http://localhost:9001`
  - PDP: `http://localhost:8080`
  - OpenFGA: `http://localhost:8081`

### Dev/Staging/Prod Environments

Update the URLs in the respective environment files to match your deployment:

```json
{
  "key": "graphql_url",
  "value": "https://api.yourdomain.com/graphql"
}
```

## 📝 Variables

### Auto-populated Variables

These are automatically set by test scripts:

- `jwt_token`: JWT access token from Keycloak
- `darta_id`: Last created Darta ID
- `chalani_id`: Last created Chalani ID

### Manual Variables

You may need to set these manually:

- `allocation_id`: Number allocation ID (from numbering service)
- `keycloak_username`: Your username
- `keycloak_password`: Your password

## 🔍 Tips & Tricks

### 1. GraphQL Variables

Each request includes GraphQL variables that you can customize. Click on the **GraphQL** tab in the request body to edit:

```graphql
query GetDarta($id: ID!) {
  darta(id: $id) {
    id
    subject
    status
  }
}
```

Variables:
```json
{
  "id": "{{darta_id}}"
}
```

### 2. Response Inspection

- Click **Visualize** tab to see formatted GraphQL responses
- Check **Test Results** tab to see auto-save script execution
- Use **Console** (bottom panel) to debug requests

### 3. Collection Runner

To run multiple requests in sequence:

1. Click **Runner** button
2. Select collection and environment
3. Configure run order
4. Click **Run**

### 4. Pre-request Scripts

Add custom logic before requests:

```javascript
// Example: Generate random subject
pm.environment.set("random_subject", "Test " + Date.now());
```

### 5. Testing Authorization

The local environment includes OpenFGA integration. Test authorization by:

1. Creating resources with different scopes
2. Attempting operations with different users
3. Checking PDP service logs for authorization decisions

## 🐛 Troubleshooting

### Error: "Requested url does not match any rules"

**Solution**: Ensure Oathkeeper is running and rules are loaded:
```bash
curl http://localhost:4456/rules
```

### Error: "401 Unauthorized"

**Solutions**:
1. Re-run "Get JWT Token" (token may have expired)
2. Check Keycloak is running: `http://localhost:8083`
3. Verify credentials in environment variables

### Error: "Connection refused"

**Solution**: Ensure all services are running:
```bash
docker compose ps
```

All services should show `Up` status.

### GraphQL Errors

Check the response body for detailed error messages:

```json
{
  "errors": [
    {
      "message": "Detailed error message here",
      "path": ["mutation", "createDarta"]
    }
  ]
}
```

## 📖 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenFGA Documentation](https://openfga.dev/docs)
- [Oathkeeper Documentation](https://www.ory.sh/docs/oathkeeper)

## 🤝 Contributing

When adding new API endpoints:

1. Add the request to the appropriate collection
2. Include example variables
3. Add test scripts to auto-save relevant IDs
4. Update this README with workflow examples

## 📄 License

Copyright © 2025 ePalika Development Team
