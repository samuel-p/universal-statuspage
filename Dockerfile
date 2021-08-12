ARG ARCH
FROM alpine:3.14.1@sha256:be9bdc0ef8e96dbc428dc189b31e2e3b05523d96d12ed627c37aa2936653258c AS base-amd64
FROM arm32v7/alpine:3.14.1@sha256:fb9ac82b4cc94c5a6c416a1c656b3ee84df9290ab4106c260eb959997e759e5e AS base-arm
FROM arm64v8/alpine:3.14.1@sha256:bd9137c3bb45dbc40cde0f0e19a8b9064c2bc485466221f5e95eb72b0d0cf82e AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.22.1-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
