# Build stage
FROM golang:1.25.1 AS build

WORKDIR /app

# Copy proto files
COPY proto proto

# Copy identity service files
COPY services/identity/go.mod services/identity/go.sum services/identity/
COPY services/identity services/identity

# Create output directory
RUN mkdir -p /out

# Build
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/identity && go mod download && go build -o /out/identitysvc ./cmd/identitysvc

# Runtime stage
FROM gcr.io/distroless/base-debian12:latest AS identitysvc

COPY --from=build /out/identitysvc /identitysvc

EXPOSE 9001

CMD ["/identitysvc"]
