import {json, Router} from 'express';
import {CurrentStatus, State} from "./app/_data/data";
import {existsSync, readFileSync, writeFileSync} from "fs";

interface Cache {
  [id: string]: State
}

interface Config {
  authToken: string;
  title: string;
  description: string;
  groups: {
    id: string;
    name: string;
    services: {
      id: string;
      name: string;
      url: string;
    }[];
  }[];
}

interface GrafanaWebhookBody {
  dashboardId: number;
  evalMatches: {
    value: number,
    metric: string,
    tags: any
  }[];
  imageUrl: string,
  message: string,
  orgId: number,
  panelId: number,
  ruleId: number,
  ruleName: string,
  ruleUrl: string,
  state: "ok" | "paused" | "alerting" | "pending" | "no_data";
  tags: { [key: string]: string },
  title: string
}

const api = Router();
api.use(json());

const config = JSON.parse(readFileSync('config.json', {encoding: 'UTF-8'})) as Config;
const serviceStates = existsSync('cache.json') ? JSON.parse(readFileSync('cache.json', {encoding: 'UTF-8'})) : {} as Cache;

let cache: CurrentStatus;
updateCache();

api.post('/update/health', (req, res) => {
  const token = req.query.token;
  if (token !== config.authToken) {
    return res.status(401).send('invalid token');
  }
  const serviceId = req.query.service as string;
  const message = req.body as GrafanaWebhookBody;

  switch (message.state) {
    case "no_data":
    case "alerting":
      serviceStates[serviceId] = "outage";
      break;
    case "paused":
      serviceStates[serviceId] = "maintenance";
      break;
    default:
      serviceStates[serviceId] = "operational"
  }

  updateCache();

  writeFileSync('cache.json', JSON.stringify(serviceStates), {encoding: 'UTF-8'});

  return res.send('OK');
});

api.get('/status', (req, res) => {
  return res.json(cache);
});

api.get('/info', (req, res) => {
  return res.json({
    title: config.title,
    description: config.description
  });
});

function updateCache(): void {
  const groups = config.groups.map(group => {
    const services = group.services.map(service => {
      return {
        id: service.id,
        name: service.name,
        url: service.url,
        state: serviceStates[service.id] || "operational"
      }
    });
    return {
      id: group.id,
      name: group.name,
      state: calculateOverallState(services.map(s => s.state)),
      services: services
    }
  });
  cache = {
    state: calculateOverallState(groups.map(g => g.state)),
    groups: groups
  };
}

function calculateOverallState(states: State[]): State {
  return states.includes("outage") ? "outage" : states.includes("maintenance") ? "maintenance" : "operational"
}

export {api};
