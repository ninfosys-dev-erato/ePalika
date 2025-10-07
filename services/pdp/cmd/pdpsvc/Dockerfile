FROM golang:1.25.1 AS build
WORKDIR /app
COPY services/pdp/go.mod services/pdp/go.sum services/pdp/
COPY proto proto
COPY services/pdp services/pdp
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/pdp && go mod download && go build -o /pdpsvc ./cmd/pdpsvc

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /pdpsvc /usr/local/bin/pdpsvc

EXPOSE 9100 8080

ENTRYPOINT ["/usr/local/bin/pdpsvc"]
