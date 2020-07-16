import {json, Router} from 'express';
import {CurrentStatus, State} from './app/_data/data';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {JSONPath} from 'jsonpath-plus';

interface Cache {
  [id: string]: State;
}

interface Config {
  authToken: string;
  title: string;
  description: string;
  servicesPath?: string;
  idPath?: string;
  statePath?: string;
  stateValues: {
    operational: string[];
    maintenance: string[];
  };
  groups: {
    id: string;
    name: string;
    url?: string;
    services: {
      id: string;
      name: string;
      url?: string;
      statePath?: string;
    }[];
  }[];
}

const api = Router();
api.use(json());

const serviceStates = existsSync(join(process.cwd(), 'cache.json')) ? JSON.parse(readFileSync(join(process.cwd(), 'cache.json'), {encoding: 'utf-8'})) : {} as Cache;
const config = JSON.parse(readFileSync(join(process.cwd(), 'config.json'), {encoding: 'utf-8'})) as Config;
const serviceStatePaths: { [service: string]: string } = config.groups
  .map(g => g.services).reduce((x, y) => x.concat(y), [])
  .filter(s => s.statePath)
  .reduce((services, service) => {
    services[service.id] = service.statePath;
    return services;
  }, {});

let cache: CurrentStatus;
updateCache();

api.post('/update/health', (req, res) => {
  const token = req.query.token;
  if (token !== config.authToken) {
    return res.status(401).send('invalid token');
  }
  const serviceId = req.query.service as string;
  let services: { id: string, state: string }[] = [];
  if (serviceId) {
    services = [{id: serviceId, state: JSONPath({path: serviceStatePaths[serviceId], json: req.body, wrap: false})}];
  } else if (config.servicesPath && config.idPath && config.statePath) {
    services = JSONPath({path: config.servicesPath, json: req.body})
      .map(s => ({
          id: JSONPath({path: config.idPath, json: s, wrap: false}),
          state: JSONPath({path: config.statePath, json: s, wrap: false})
      }));
  }

  services.forEach(s => {
    if (config.stateValues.operational.includes(s.state)) {
      serviceStates[s.id] = 'operational';
    } else if (config.stateValues.maintenance.includes(s.state)) {
      serviceStates[s.id] = 'maintenance';
    } else {
      serviceStates[s.id] = 'outage';
    }
  });

  updateCache();

  writeFileSync('cache.json', JSON.stringify(serviceStates), {encoding: 'utf-8'});

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
        state: serviceStates[service.id] || 'operational'
      };
    });
    return {
      id: group.id,
      name: group.name,
      url: group.url,
      state: calculateOverallState(services.map(s => s.state)),
      services: services
    };
  });
  cache = {
    state: calculateOverallState(groups.map(g => g.state)),
    groups: groups
  };
}

function calculateOverallState(states: State[]): State {
  return states.includes('outage') ? 'outage' : states.includes('maintenance') ? 'maintenance' : 'operational';
}

export {api};
