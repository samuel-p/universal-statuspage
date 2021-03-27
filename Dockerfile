ARG ARCH
FROM amd64/alpine:3.12.3@sha256:074d3636ebda6dd446d0d00304c4454f468237fdacf08fb0eeac90bdbfa1bac7 AS base-amd64
FROM arm32v7/alpine:3.12.3@sha256:299294be8699c1b323c137f972fd0aa5eaa4b95489c213091dcf46ef39b6c810 AS base-arm
FROM arm64v8/alpine:3.12.3@sha256:549694ea68340c26d1d85c00039aa11ad835be279bfd475ff4284b705f92c24e AS base-arm64
FROM base-${ARCH}

RUN apk --no-cache add nodejs="12.21.0-r0"

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
