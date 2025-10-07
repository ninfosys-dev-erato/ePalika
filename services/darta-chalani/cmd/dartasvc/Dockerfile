FROM golang:1.25.1 AS build
WORKDIR /app
COPY services/darta-chalani/go.mod services/darta-chalani/go.sum services/darta-chalani/
COPY proto proto
COPY services/darta-chalani services/darta-chalani
RUN mkdir -p /out
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/darta-chalani && go mod download && go build -o /out/dartasvc ./cmd/dartasvc
FROM debian:bookworm-slim AS dartasvc

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out/dartasvc /usr/local/bin/dartasvc

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/dartasvc"]
