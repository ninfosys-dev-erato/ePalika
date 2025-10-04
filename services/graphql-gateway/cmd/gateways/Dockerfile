FROM golang:1.25.1-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY services/graphql-gateway/go.mod services/graphql-gateway/go.sum* ./
RUN go mod download

# Copy source code
COPY services/graphql-gateway/ ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /gateway ./cmd/gateways

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /gateway .

EXPOSE 8000

CMD ["./gateway"]
