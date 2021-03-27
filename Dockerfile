ARG ARCH
FROM amd64/alpine:3.13.3@sha256:4266485e304a825d82c375d3584121b53c802e3540d6b520b212a9f0784d56f5 AS base-amd64
FROM arm32v7/alpine:3.13.3@sha256:20e384223963ef2fd24ec9341eaad4c796673da0e848387e6fe53ee2ec118d0e AS base-arm
FROM arm64v8/alpine:3.13.3@sha256:31605c2bc05b020943d5c20a108f4bfe1af47e0a818e94411041805d1374ab42 AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.21.0-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
