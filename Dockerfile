ARG ARCH
FROM amd64/alpine:3.13.5@sha256:def822f9851ca422481ec6fee59a9966f12b351c62ccb9aca841526ffaa9f748 AS base-amd64
FROM arm32v7/alpine:3.13.5@sha256:9663906b1c3bf891618ebcac857961531357525b25493ef717bca0f86f581ad6 AS base-arm
FROM arm64v8/alpine:3.13.5@sha256:8f18fae117ec6e5777cc62ba78cbb3be10a8a38639ccfb949521abd95c8301a4 AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.22.1-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
