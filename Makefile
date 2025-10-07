.PHONY: help build test clean docker-build k8s-deploy dev-setup test-alice test-bob security-scan

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_REGISTRY ?= ghcr.io
DOCKER_NAMESPACE ?= your-org
VERSION ?= $(shell git describe --tags --always --dirty)
KUBECONFIG ?= ~/.kube/config

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)ePalika Development Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)Available targets:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
dev-setup: ## Setup development environment
	@echo "$(GREEN)Setting up ePalika development environment$(RESET)"
	@echo "Services running on:"
	@echo "  Gateway (Oathkeeper): http://localhost:4455"
	@echo "  Keycloak Admin: http://localhost:8080 (admin/admin)"
	@echo "  OpenFGA: http://localhost:8081"
	@echo "  PDP: http://localhost:8083"
	@echo "  Upstream: http://localhost:9000"
	@echo ""
	@echo "$(YELLOW)Usage:$(RESET)"
	@echo "  make test-alice  # Test Alice access (should work)"
	@echo "  make test-bob    # Test Bob access (should be denied)"
	@echo "  ./scripts/get-token.sh alice  # Get JWT token for Alice"

up: ## Start all services with docker-compose
	@echo "$(GREEN)Starting ePalika services...$(RESET)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(RESET)"
	@$(MAKE) dev-setup

down: ## Stop all services
	@echo "$(YELLOW)Stopping ePalika services...$(RESET)"
	docker-compose down
	@echo "$(GREEN)Services stopped!$(RESET)"

logs: ## Show logs from all services
	docker-compose logs -f

restart: ## Restart all services
	@echo "$(YELLOW)Restarting ePalika services...$(RESET)"
	docker-compose restart
	@echo "$(GREEN)Services restarted!$(RESET)"

# Building
build: ## Build all Go services
	@echo "$(GREEN)Building ePalika services...$(RESET)"
	@cd services/pdp && go build -o ../../bin/pdp ./cmd/pdpsvc
	@cd services/darta-chalani && go build -o ../../bin/darta-chalani ./cmd/dartasvc
	@echo "$(GREEN)Build completed!$(RESET)"

build-pdp: ## Build PDP service
	@echo "$(GREEN)Building PDP service...$(RESET)"
	@cd services/pdp && go build -o ../../bin/pdp ./cmd/pdpsvc

build-darta: ## Build Darta-Chalani service
	@echo "$(GREEN)Building Darta-Chalani service...$(RESET)"
	@cd services/darta-chalani && go build -o ../../bin/darta-chalani ./cmd/dartasvc

sqlc-darta: ## Generate sqlc code for Darta-Chalani
	@echo "$(GREEN)Generating sqlc artifacts for darta-chalani...$(RESET)"
	@cd services/darta-chalani && sqlc generate

# Testing
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(RESET)"
	@cd services/pdp && go test -v -race ./...
	@cd services/darta-chalani && go test -v -race ./...
	@echo "$(GREEN)All tests passed!$(RESET)"

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(RESET)"
	@cd services/pdp && go test -v -race -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html
	@cd services/darta-chalani && go test -v -race -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Coverage reports generated!$(RESET)"

test-alice: ## Test Alice access (should work)
	@echo "$(GREEN)Testing access for Alice...$(RESET)"
	@./scripts/test-gateway.sh alice 123

test-bob: ## Test Bob access (should be denied)
	@echo "$(GREEN)Testing access for Bob...$(RESET)"
	@./scripts/test-gateway.sh bob 123

test-e2e: ## Run end-to-end tests
	@echo "$(GREEN)Running E2E tests...$(RESET)"
	@./scripts/e2e-test.sh

wait-for-services: ## Wait for all services to be ready
	@echo "$(GREEN)Waiting for services to be ready...$(RESET)"
	@./scripts/wait-for-services.sh

health-check: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(RESET)"
	@./scripts/wait-for-services.sh status

test-integration: ## Run integration tests
	@echo "$(GREEN)Running integration tests...$(RESET)"
	@docker-compose -f docker-compose.test.yml up -d
	@sleep 30  # Wait for services to be ready
	@./scripts/integration-tests.sh
	@docker-compose -f docker-compose.test.yml down

# Security
security-scan: ## Run security scans
	@echo "$(GREEN)Running security scans...$(RESET)"
	@command -v trivy >/dev/null 2>&1 || { echo "$(RED)Trivy not installed$(RESET)"; exit 1; }
	@command -v gosec >/dev/null 2>&1 || { echo "$(RED)Gosec not installed$(RESET)"; exit 1; }
	@echo "$(CYAN)Running Trivy scan...$(RESET)"
	@trivy fs .
	@echo "$(CYAN)Running Gosec scan...$(RESET)"
	@gosec ./...
	@echo "$(GREEN)Security scans completed!$(RESET)"

# Docker
docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(RESET)"
	docker build -f services/pdp/cmd/pdpsvc/Dockerfile -t $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/pdp:$(VERSION) .
	docker build -f services/darta-chalani/cmd/dartasvc/Dockerfile -t $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/darta-chalani:$(VERSION) .
	@echo "$(GREEN)Docker images built!$(RESET)"

docker-push: docker-build ## Push Docker images to registry
	@echo "$(GREEN)Pushing Docker images...$(RESET)"
	docker push $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/pdp:$(VERSION)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/darta-chalani:$(VERSION)
	@echo "$(GREEN)Docker images pushed!$(RESET)"

docker-run: docker-build ## Run services using Docker
	@echo "$(GREEN)Running services with Docker...$(RESET)"
	docker-compose -f docker-compose.yml up -d

# Kubernetes
k8s-validate: ## Validate Kubernetes manifests
	@echo "$(GREEN)Validating Kubernetes manifests...$(RESET)"
	@command -v kubectl >/dev/null 2>&1 || { echo "$(RED)kubectl not installed$(RESET)"; exit 1; }
	@command -v kustomize >/dev/null 2>&1 || { echo "$(RED)kustomize not installed$(RESET)"; exit 1; }
	@kubectl apply --dry-run=client -k k8s/base/
	@kubectl apply --dry-run=client -k k8s/overlays/dev/
	@kubectl apply --dry-run=client -k k8s/overlays/prod/
	@echo "$(GREEN)Kubernetes manifests are valid!$(RESET)"

k8s-deploy-dev: ## Deploy to Kubernetes dev environment
	@echo "$(GREEN)Deploying to Kubernetes dev environment...$(RESET)"
	@kubectl apply -k k8s/overlays/dev/
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=epalika -n epalika-dev --timeout=300s
	@echo "$(GREEN)Deployment to dev completed!$(RESET)"

k8s-deploy-prod: ## Deploy to Kubernetes prod environment
	@echo "$(YELLOW)Deploying to Kubernetes prod environment...$(RESET)"
	@read -p "Are you sure you want to deploy to production? [y/N] " confirm && [ "$$confirm" = "y" ]
	@kubectl apply -k k8s/overlays/prod/
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=epalika -n epalika-prod --timeout=600s
	@echo "$(GREEN)Deployment to prod completed!$(RESET)"

k8s-status: ## Show Kubernetes deployment status
	@echo "$(GREEN)Kubernetes deployment status:$(RESET)"
	@echo "$(CYAN)Development:$(RESET)"
	@kubectl get pods -n epalika-dev 2>/dev/null || echo "  No dev deployment found"
	@echo "$(CYAN)Production:$(RESET)"
	@kubectl get pods -n epalika-prod 2>/dev/null || echo "  No prod deployment found"

# Helm
helm-install-dev: ## Install using Helm (dev)
	@echo "$(GREEN)Installing ePalika using Helm (dev)...$(RESET)"
	@helm upgrade --install epalika-dev ./charts/epalika \
		--namespace epalika-dev \
		--create-namespace \
		--set global.environment=dev \
		--set global.domain=dev.epalika.local \
		--wait --timeout 10m
	@echo "$(GREEN)Helm installation (dev) completed!$(RESET)"

helm-install-prod: ## Install using Helm (prod)
	@echo "$(YELLOW)Installing ePalika using Helm (prod)...$(RESET)"
	@read -p "Are you sure you want to deploy to production? [y/N] " confirm && [ "$$confirm" = "y" ]
	@helm upgrade --install epalika-prod ./charts/epalika \
		--namespace epalika-prod \
		--create-namespace \
		--values charts/epalika/values-prod.yaml \
		--set global.environment=prod \
		--set global.domain=epalika.gov.np \
		--wait --timeout 15m
	@echo "$(GREEN)Helm installation (prod) completed!$(RESET)"

helm-uninstall-dev: ## Uninstall Helm deployment (dev)
	@echo "$(YELLOW)Uninstalling ePalika Helm deployment (dev)...$(RESET)"
	@helm uninstall epalika-dev -n epalika-dev || true
	@kubectl delete namespace epalika-dev || true
	@echo "$(GREEN)Helm uninstall (dev) completed!$(RESET)"

helm-status: ## Show Helm deployment status
	@echo "$(GREEN)Helm deployment status:$(RESET)"
	@echo "$(CYAN)Development:$(RESET)"
	@helm list -n epalika-dev 2>/dev/null || echo "  No dev deployment found"
	@echo "$(CYAN)Production:$(RESET)"
	@helm list -n epalika-prod 2>/dev/null || echo "  No prod deployment found"

# Monitoring
logs-dev: ## Show logs from dev environment
	@echo "$(GREEN)Showing logs from dev environment...$(RESET)"
	@kubectl logs -l app.kubernetes.io/name=epalika -n epalika-dev --tail=100 -f

logs-prod: ## Show logs from prod environment
	@echo "$(GREEN)Showing logs from prod environment...$(RESET)"
	@kubectl logs -l app.kubernetes.io/name=epalika -n epalika-prod --tail=100 -f

port-forward-dev: ## Port forward dev services for local access
	@echo "$(GREEN)Port forwarding dev services...$(RESET)"
	@echo "Gateway: http://localhost:4455"
	@echo "Keycloak: http://localhost:8083"
	@kubectl port-forward svc/dev-oathkeeper 4455:4455 -n epalika-dev &
	@kubectl port-forward svc/dev-keycloak 8083:8080 -n epalika-dev &
	@echo "$(YELLOW)Press Ctrl+C to stop port forwarding$(RESET)"
	@wait

# Utilities
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(RESET)"
	@rm -rf bin/
	@rm -rf services/*/coverage.out services/*/coverage.html
	@docker system prune -f
	@echo "$(GREEN)Cleanup completed!$(RESET)"

clean-tokens: ## Clean JWT tokens (they expire automatically)
	@echo "$(GREEN)Tokens are short-lived (5min), no cleanup needed$(RESET)"

install-tools: ## Install required development tools
	@echo "$(GREEN)Installing development tools...$(RESET)"
	@echo "$(CYAN)Installing kubectl...$(RESET)"
	@curl -LO "https://dl.k8s.io/release/$$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
	@chmod +x kubectl && sudo mv kubectl /usr/local/bin/ 2>/dev/null || mv kubectl ~/bin/
	@echo "$(CYAN)Installing Helm...$(RESET)"
	@curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
	@echo "$(CYAN)Installing kustomize...$(RESET)"
	@curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
	@sudo mv kustomize /usr/local/bin/ 2>/dev/null || mv kustomize ~/bin/
	@echo "$(CYAN)Installing trivy...$(RESET)"
	@curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin 2>/dev/null || curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b ~/bin
	@echo "$(CYAN)Installing gosec...$(RESET)"
	@go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	@echo "$(GREEN)All tools installed!$(RESET)"

version: ## Show version information
	@echo "$(GREEN)ePalika Version Information:$(RESET)"
	@echo "Version: $(VERSION)"
	@echo "Git Commit: $$(git rev-parse HEAD)"
	@echo "Git Branch: $$(git rev-parse --abbrev-ref HEAD)"
	@echo "Build Date: $$(date -u)"
	@echo "Go Version: $$(go version)"

# Documentation
docs: ## Generate documentation
	@echo "$(GREEN)Generating documentation...$(RESET)"
	@echo "Documentation available in docs/ directory"

lint: ## Run linters
	@echo "$(GREEN)Running linters...$(RESET)"
	@command -v golangci-lint >/dev/null 2>&1 || { echo "$(RED)golangci-lint not installed$(RESET)"; exit 1; }
	@cd services/pdp && golangci-lint run
	@cd services/darta-chalani && golangci-lint run
	@echo "$(GREEN)Linting completed!$(RESET)"

fmt: ## Format Go code
	@echo "$(GREEN)Formatting Go code...$(RESET)"
	@go fmt ./services/...
	@echo "$(GREEN)Code formatted!$(RESET)"

# Quick development workflow
dev: clean build up ## Quick development setup (clean, build, up)
	@echo "$(GREEN)Development environment ready!$(RESET)"

# CI/CD simulation
ci: test security-scan k8s-validate ## Simulate CI pipeline
	@echo "$(GREEN)CI pipeline simulation completed!$(RESET)"

# Show running services
status: ## Show status of all services
	@echo "$(GREEN)Service Status:$(RESET)"
	@echo "$(CYAN)Docker Compose:$(RESET)"
	@docker-compose ps 2>/dev/null || echo "  No docker-compose services running"
	@echo "$(CYAN)Kubernetes:$(RESET)"
	@$(MAKE) k8s-status
	@echo "$(CYAN)Helm:$(RESET)"
	@$(MAKE) helm-status
