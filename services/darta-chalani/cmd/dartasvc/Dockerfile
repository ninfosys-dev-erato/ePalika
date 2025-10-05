FROM golang:1.25.1 AS build
WORKDIR /app
COPY services/darta-chalani/go.mod services/darta-chalani/go.sum services/darta-chalani/
COPY proto proto
COPY services/darta-chalani services/darta-chalani
RUN mkdir -p /out
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/darta-chalani && go mod download && go build -o /out/dartasvc ./cmd/dartasvc
FROM gcr.io/distroless/base-debian12 AS dartasvc
COPY --from=build /out/dartasvc /dartasvc
EXPOSE 9000
ENTRYPOINT ["/dartasvc"]
