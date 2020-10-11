FROM node:14.13.1-alpine

COPY dist/universal-statuspage /universal-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/universal-statuspage/server/main.js"]
