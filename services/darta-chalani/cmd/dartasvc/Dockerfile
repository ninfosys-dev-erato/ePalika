FROM golang:1.25.1 AS build
WORKDIR /app
COPY go.work ./
COPY services/darta-chalani/go.mod ./services/darta-chalani/
COPY services/pdp/go.mod ./services/pdp/
COPY internal-libs ./internal-libs
COPY services/darta-chalani ./services/darta-chalani
COPY services/pdp ./services/pdp
RUN --mount=type=cache,target=/go/pkg/mod \
    cd services/darta-chalani && go build -o /dartasvc ./cmd/dartasvc

FROM gcr.io/distroless/base-debian12
COPY --from=build /dartasvc /dartasvc
EXPOSE 9000
ENTRYPOINT ["/dartasvc"]
