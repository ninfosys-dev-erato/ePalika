FROM golang:1.25.1 AS build
WORKDIR /app
COPY services/pdp/go.mod services/pdp/go.sum services/pdp/
COPY proto proto
COPY services/pdp services/pdp
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/pdp && go mod download && go build -o /pdpsvc ./cmd/pdpsvc

FROM gcr.io/distroless/base-debian12
COPY --from=build /pdpsvc /pdpsvc
EXPOSE 9100 8080
ENTRYPOINT ["/pdpsvc"]
