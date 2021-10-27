ARG ARCH
FROM alpine:3.14.2@sha256:e1c082e3d3c45cccac829840a25941e679c25d438cc8412c2fa221cf1a824e6a AS base-amd64
FROM arm32v7/alpine:3.14.2@sha256:e12ff876f0075740ed3d7bdf788107ae84c1b3dd6dc98b3baea41088aba5236f AS base-arm
FROM arm64v8/alpine:3.14.2@sha256:b06a5cf61b2956088722c4f1b9a6f71dfe95f0b1fe285d44195452b8a1627de7 AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.22.6-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
