ARG ARCH
FROM alpine:3.14.1@sha256:eb3e4e175ba6d212ba1d6e04fc0782916c08e1c9d7b45892e9796141b1d379ae AS base-amd64
FROM arm32v7/alpine:3.14.1@sha256:fb9ac82b4cc94c5a6c416a1c656b3ee84df9290ab4106c260eb959997e759e5e AS base-arm
FROM arm64v8/alpine:3.14.1@sha256:bd9137c3bb45dbc40cde0f0e19a8b9064c2bc485466221f5e95eb72b0d0cf82e AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.22.1-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
