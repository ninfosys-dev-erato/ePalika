FROM golang:1.25.1 AS build
WORKDIR /app
COPY go.work ./
COPY services/pdp/go.mod ./services/pdp/
COPY services/darta-chalani/go.mod ./services/darta-chalani/
COPY services/graphql-gateway/go.mod ./services/graphql-gateway/
COPY internal-libs ./internal-libs
COPY services/pdp ./services/pdp
COPY services/darta-chalani ./services/darta-chalani
COPY services/graphql-gateway ./services/graphql-gateway
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/pdp && go build -o /pdpsvc ./cmd/pdpsvc

FROM gcr.io/distroless/base-debian12
COPY --from=build /pdpsvc /pdpsvc
EXPOSE 8080
ENTRYPOINT ["/pdpsvc"]
