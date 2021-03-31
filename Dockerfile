ARG ARCH
FROM amd64/alpine:3.13.3@sha256:4266485e304a825d82c375d3584121b53c802e3540d6b520b212a9f0784d56f5 AS base-amd64
FROM arm32v7/alpine:3.13.4@sha256:59b46c319f3b66dfda96faafd0c6959e9b2f409792d0236204f270dfd0235960 AS base-arm
FROM arm64v8/alpine:3.13.4@sha256:071fa5de01a240dbef5be09d69f8fef2f89d68445d9175393773ee389b6f5935 AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.21.0-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
