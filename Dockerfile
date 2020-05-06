FROM node

COPY dist/grafana-statuspage /grafana-statuspage

WORKDIR /app

ENTRYPOINT ["node", "/grafana-statuspage/server/main.js"]
