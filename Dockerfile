# ================== Backend Builder ==================
FROM golang:1.21-alpine AS backend-builder
ENV CGO_ENABLED=0
RUN apk add --update make
WORKDIR /backend

RUN --mount=target=. \
    --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

RUN --mount=target=. \
    --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    OUT=/service make bin

# ================== Frontend Builder ==================
FROM --platform=$BUILDPLATFORM node:17.7-alpine3.14 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

# ================== Configure Extension ==================
FROM alpine
LABEL org.opencontainers.image.title="LLMDash" \
    org.opencontainers.image.description="Caching extension for LLMs" \
    org.opencontainers.image.vendor="Metaprov" \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.changelog=""

COPY docker-compose.yaml .
COPY metadata.json .
COPY docker.svg .

COPY --from=builder /service /
COPY --from=client-builder /ui/build ui

# Copy grafana and prometheus configurations into extension image
COPY configs/grafana grafana
COPY configs/prometheus prometheus

# ================== Start Extension Backend ==================
CMD /service -socket /run/guest-services/backend.sock
