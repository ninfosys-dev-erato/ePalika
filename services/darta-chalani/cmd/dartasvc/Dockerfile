FROM golang:1.25.1 AS build
WORKDIR /app
COPY go.work ./
COPY services/darta-chalani/go.mod ./services/darta-chalani/
COPY services/pdp/go.mod ./services/pdp/
COPY services/graphql-gateway/go.mod ./services/graphql-gateway/
COPY internal-libs ./internal-libs
COPY services/darta-chalani ./services/darta-chalani
COPY services/pdp ./services/pdp
COPY services/graphql-gateway ./services/graphql-gateway
RUN mkdir -p /out
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/darta-chalani && \
    go build -o /out/dartasvc ./cmd/dartasvc && \
    go build -o /out/dartasvc-migrate ./cmd/dartasvc-migrate

FROM gcr.io/distroless/base-debian12 AS dartasvc
COPY --from=build /out/dartasvc /dartasvc
EXPOSE 9000
ENTRYPOINT ["/dartasvc"]

FROM gcr.io/distroless/base-debian12 AS dartasvc-migrate
COPY --from=build /out/dartasvc-migrate /dartasvc-migrate
ENTRYPOINT ["/dartasvc-migrate"]
