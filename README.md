# ePalika - Government Document Management System

[![CI Pipeline](https://github.com/your-org/epalika/workflows/CI%20Pipeline/badge.svg)](https://github.com/your-org/epalika/actions)
[![Security Scan](https://github.com/your-org/epalika/workflows/Security%20Scan/badge.svg)](https://github.com/your-org/epalika/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A secure, scalable microservices platform for government document management with multi-tenant support, JWT authentication, and relationship-based authorization.

## 🏛️ Overview

ePalika is a comprehensive document management system designed for government organizations in Nepal. It provides secure, multi-tenant access to government documents with fine-grained authorization controls.

### Key Features

- **🔐 Secure Authentication**: JWT-based authentication via Keycloak
- **🛡️ Fine-grained Authorization**: Relationship-based access control with OpenFGA
- **🏢 Multi-tenant**: Support for multiple municipalities (palika)
- **⚡ High Performance**: Cloud-native microservices architecture
- **📊 Observability**: Comprehensive monitoring and alerting
- **🚀 Cloud-ready**: Kubernetes-native with Helm charts
- **🔒 Security First**: Zero-trust architecture with defense in depth

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Internet      │────│   Ingress/LB     │────│   Oathkeeper    │
│   Traffic       │    │   (SSL Term)     │    │   (Gateway)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                              ┌──────────────────────────┼──────────────────────────┐
                              │                          │                          │
                    ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
                    │    Keycloak       │    │       PDP         │    │  Darta-Chalani    │
                    │  (Identity)       │    │  (Authorization)  │    │   (Documents)     │
                    └───────────────────┘    └───────────────────┘    └───────────────────┘
                                                         │
                                             ┌─────────▼─────────┐
                                             │     OpenFGA       │
                                             │  (Relationships)  │
                                             └───────────────────┘
```

### Components

| Service | Purpose | Technology |
|---------|---------|------------|
| **Oathkeeper** | API Gateway & Authentication | ORY Oathkeeper |
| **Keycloak** | Identity Provider (OIDC) | Keycloak |
| **PDP** | Policy Decision Point | Go |
| **OpenFGA** | Relationship Authorization | OpenFGA |
| **Darta-Chalani** | Document Service | Go |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- kubectl and Helm (for Kubernetes)
- Go 1.25+ (for development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/epalika.git
cd epalika

# Start local services
docker-compose up -d

# Wait for services to be ready
make dev-setup

# Test the system
make test-alice  # Should work
make test-bob    # Should be denied
```

### Kubernetes Deployment

```bash
# Development environment
kubectl apply -k k8s/overlays/dev/

# Production environment (with Helm)
helm install epalika-prod ./charts/epalika \
  --namespace epalika-prod \
  --create-namespace \
  --values charts/epalika/values-prod.yaml
```

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🛠️ Development

### Project Structure

```
ePalika/
├── services/                 # Microservices
│   ├── pdp/                 # Policy Decision Point
│   ├── darta-chalani/       # Document service
│   └── auth/                # Authentication service
├── k8s/                     # Kubernetes manifests
│   ├── base/                # Base manifests
│   └── overlays/            # Environment-specific overlays
├── charts/                  # Helm charts
│   └── epalika/            # Main application chart
├── policies/                # Authorization policies
│   ├── oathkeeper/         # Gateway rules
│   └── openfga/            # Relationship models
├── scripts/                 # Utility scripts
├── .github/                 # CI/CD workflows
└── docs/                    # Documentation
```

### Building Services

```bash
# Build all services
make build

# Build specific service
cd services/pdp
go build ./cmd/pdpsvc

# Run tests
make test

# Run security scan
make security-scan
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# OpenFGA Configuration
FGA_STORE=your-store-id
FGA_MODEL_ID=your-model-id

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8083
KEYCLOAK_REALM=epalika
```

## 🔐 Security

### Authentication Flow

1. **User Login**: User authenticates with Keycloak
2. **JWT Token**: Keycloak issues JWT token
3. **API Request**: Client sends request with JWT to gateway
4. **Token Validation**: Oathkeeper validates JWT
5. **Authorization Check**: PDP checks permissions via OpenFGA
6. **Request Forwarding**: Authorized requests reach upstream services

### Authorization Model

The system uses relationship-based access control:

```yaml
# Example relationships
user:alice owner doc:palika_bagmati/123
user:bob viewer doc:palika_bagmati/123
group:staff member user:alice
folder:budget parent doc:palika_bagmati/123
```

### Security Features

- 🔒 **JWT Authentication**: Cryptographically signed tokens
- 🛡️ **Fine-grained RBAC**: Relationship-based permissions
- 🚫 **Zero Trust**: Every request is authenticated and authorized
- 🔐 **Secrets Management**: External secret management support
- 🌐 **Network Policies**: Kubernetes network segmentation
- 📋 **Security Scanning**: Automated vulnerability detection

## 📊 Monitoring

### Health Endpoints

- **Gateway**: `GET /health`
- **Keycloak**: `GET /health/ready`
- **PDP**: `GET /healthz`
- **OpenFGA**: `GET /healthz`
- **Darta-Chalani**: `GET /health`

### Metrics

The system exposes Prometheus metrics for monitoring:

- Request rates and latencies
- Authentication success/failure rates
- Authorization decisions
- Resource utilization
- Error rates

### Alerts

Critical alerts include:

- Service downtime
- High error rates
- Authentication failures
- Resource exhaustion
- Security incidents

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific service tests
cd services/pdp && go test ./...
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
make test-integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### End-to-End Tests

```bash
# Deploy to test environment
kubectl apply -k k8s/overlays/test/

# Run E2E tests
make test-e2e
```

## 🚀 CI/CD

The project uses GitHub Actions for CI/CD:

### Continuous Integration

- ✅ Code testing and quality checks
- 🔍 Security vulnerability scanning
- 🐳 Docker image building
- ✔️ Kubernetes manifest validation

### Continuous Deployment

- 🔄 **Development**: Auto-deploy on `develop` branch
- 🏷️ **Production**: Manual deploy from version tags
- 🔒 **Security**: Approval required for production
- 📊 **Monitoring**: Post-deployment health checks

### Deployment Workflow

```bash
# Development deployment (automatic)
git push origin develop

# Production deployment
git tag v1.0.0
git push origin v1.0.0
```

## 📖 API Documentation

### Authentication

```bash
# Get JWT token
TOKEN=$(curl -s -X POST "http://localhost:8083/realms/epalika/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&password=alice123&grant_type=password&client_id=gateway&client_secret=gateway-secret" | \
  jq -r '.access_token')
```

### Document Access

```bash
# Read document (requires can_read permission)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4455/documents/123"

# Create document (requires can_write permission)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Document","content":"..."}' \
  "http://localhost:4455/documents"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Create a Pull Request

### Development Guidelines

- Follow Go best practices and conventions
- Write tests for new functionality
- Update documentation for API changes
- Ensure security scan passes
- Use conventional commit messages

## 📋 Makefile Commands

```bash
make help           # Show available commands
make build          # Build all services
make test           # Run all tests
make dev-setup      # Setup development environment
make docker-build   # Build Docker images
make k8s-deploy     # Deploy to Kubernetes
make security-scan  # Run security analysis
make clean          # Clean build artifacts
```

## 🌍 Environment Support

| Environment | Purpose | Characteristics |
|-------------|---------|-----------------|
| **Development** | Local development | Single replicas, debug logging, no TLS |
| **Testing** | CI/CD testing | Automated testing, temporary |
| **Staging** | Pre-production | Production-like, limited access |
| **Production** | Live system | High availability, monitoring, security |

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Comprehensive deployment instructions
- [Security Guide](docs/SECURITY.md) - Security architecture and guidelines
- [API Reference](docs/API.md) - Complete API documentation
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

## 📞 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/your-org/epalika/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/epalika/discussions)
- **Security**: security@epalika.gov.np

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- [ORY](https://www.ory.sh/) for Oathkeeper
- [Keycloak](https://www.keycloak.org/) for identity management
- [OpenFGA](https://openfga.dev/) for authorization
- [Kubernetes](https://kubernetes.io/) for orchestration
- Government of Nepal for support and requirements

---

<div align="center">

**Built with ❤️ for the Government of Nepal**

[Website](https://epalika.gov.np) • [Documentation](docs/) • [API Reference](docs/API.md)

</div>