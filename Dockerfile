ARG ARCH
FROM amd64/alpine:3.13.4@sha256:e103c1b4bf019dc290bcc7aca538dc2bf7a9d0fc836e186f5fa34945c5168310 AS base-amd64
FROM arm32v7/alpine:3.13.5@sha256:9663906b1c3bf891618ebcac857961531357525b25493ef717bca0f86f581ad6 AS base-arm
FROM arm64v8/alpine:3.13.5@sha256:8f18fae117ec6e5777cc62ba78cbb3be10a8a38639ccfb949521abd95c8301a4 AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.22.1-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
