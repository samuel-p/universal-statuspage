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
  statePath: string;
  stateValues: {
    operational: string[];
    maintenance: string[];
  };
  groups: {
    id: string;
    name: string;
    services: {
      id: string;
      name: string;
      url: string;
      statePath?: string;
      stateValues?: {
        operational?: string[];
        maintenance?: string[];
      };
    }[];
  }[];
}

interface StateKey {
  statePath: string;
  stateValues: {
    operational: string[];
    maintenance: string[];
  };
}

const api = Router();
api.use(json());

const serviceStates = existsSync(join(process.cwd(), 'cache.json')) ? JSON.parse(readFileSync(join(process.cwd(), 'cache.json'), {encoding: 'utf-8'})) : {} as Cache;
const config = JSON.parse(readFileSync(join(process.cwd(), 'config.json'), {encoding: 'utf-8'})) as Config;
const stateKeys: { [service: string]: StateKey } = config.groups
  .map(g => g.services).reduce((x, y) => x.concat(y), [])
  .reduce((services, service) => {
    services[service.id] = {
      statePath: service.statePath || config.statePath,
      stateValues: {
        operational: service.stateValues ? service.stateValues.operational || config.stateValues.operational : config.stateValues.operational,
        maintenance: service.stateValues ? service.stateValues.maintenance || config.stateValues.maintenance : config.stateValues.maintenance,
      }
    };
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
  const keys = stateKeys[serviceId];
  const state = JSONPath({path: keys.statePath, json: req.body, wrap: false});

  if (keys.stateValues.operational.includes(state)) {
    serviceStates[serviceId] = 'operational';
  } else if (keys.stateValues.maintenance.includes(state)) {
    serviceStates[serviceId] = 'maintenance';
  } else {
    serviceStates[serviceId] = 'outage';
  }

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
