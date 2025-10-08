# syntax=docker/dockerfile:1
FROM oryd/oathkeeper:latest

USER root

RUN apk add --no-cache curl jq envsubst

# Copy all configs into the image
COPY base /oathkeeper/base
COPY rules /oathkeeper/rules
COPY secrets /oathkeeper/secrets
COPY config.yaml /oathkeeper/config.yaml
COPY scripts/start-oathkeeper.sh /usr/local/bin/start-oathkeeper.sh

# Permissions
RUN chmod +x /usr/local/bin/start-oathkeeper.sh && \
    mkdir -p /etc/secrets && \
    chown -R ory:ory /etc/secrets /oathkeeper

USER ory

ENTRYPOINT ["/usr/local/bin/start-oathkeeper.sh"]
