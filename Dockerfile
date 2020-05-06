FROM node:alpine

COPY dist/grafana-statuspage /grafana-statuspage

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["node", "/grafana-statuspage/server/main.js"]
