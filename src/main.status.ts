import {json, Router} from 'express';
import {CurrentStatus, State, UptimeStatus} from './app/_data/data';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {JSONPath} from 'jsonpath-plus';
import * as dayjs from 'dayjs';
import {Dayjs} from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as isBetween from 'dayjs/plugin/isBetween';
import {CronJob} from 'cron';

dayjs.extend(utc);
dayjs.extend(isBetween);

interface Cache {
  [id: string]: State;
}

interface Config {
  authToken: string;
  title: string;
  description: string;
  translations?: {
    [lang: string]: {
      title: string;
      description: string;
    }
  },
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
let uptimeStates = existsSync(join(process.cwd(), 'uptime.json')) ? JSON.parse(readFileSync(join(process.cwd(), 'uptime.json'), {encoding: 'utf-8'})) : {} as { [id: string]: UptimeStatus; };
// init serviceStates and uptimeStates
config.groups
  .map(g => g.services).reduce((x, y) => x.concat(y), [])
  .map(s => s.id).filter(id => !serviceStates[id])
  .forEach(id => serviceStates[id] = 'operational');
for (let id in serviceStates) {
  if (serviceStates.hasOwnProperty(id)) {
    updateServiceState(id, serviceStates[id]);
  }
}
updateCache();

api.post('/update/health', (req, res) => {
  const token = req.query.token;
  if (token !== config.authToken) {
    return res.status(401).send('invalid token');
  }
  const serviceId = req.query.service as string;
  if (!config.groups
    .map(g => g.services).reduce((x, y) => x.concat(y), [])
    .map(s => s.id).includes(serviceId)) {
    // TODO remove old caches
    return res.send('OK');
  }
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
      updateServiceState(s.id, 'operational');
    } else if (config.stateValues.maintenance.includes(s.state)) {
      updateServiceState(s.id, 'maintenance');
    } else {
      updateServiceState(s.id, 'outage');
    }
  });

  updateCache();
  persistCache();

  return res.send('OK');
});

api.get('/status', (req, res) => {
  return res.json(cache);
});

api.get('/uptime', (req, res) => {
  const serviceId = req.query.service as string;
  const uptime = uptimeStates[serviceId];
  if (uptime) {
    return res.json(uptime);
  }
  return res.sendStatus(404);
});

api.get('/badge', (req, res) => {
  const serviceId = req.query.service as string;
  if (!serviceId) {
    return res.json({
      'schemaVersion': 1,
      'label': 'sp-status',
      'message': 'service not provided',
      'isError': true
    });
  }
  const service = cache.groups
    .map(g => g.services).reduce((x, y) => x.concat(y), [])
    .find(s => s.id === serviceId);
  if (!service) {
    return res.json({
      'schemaVersion': 1,
      'label': 'sp-status',
      'message': 'service not found',
      'isError': true
    });
  }
  const label = req.query.label || service.name;
  let message;
  let color;
  switch (service.state) {
    case 'operational':
      message = req.query.operational || service.state;
      color = '#7ed321';
      break;
    case 'outage':
      message = req.query.outage || service.state;
      color = '#ff6f6f';
      break;
    case 'maintenance':
      message = req.query.maintenance || service.state;
      color = '#f7ca18';
      break;
  }
  return res.json({
    'schemaVersion': 1,
    'label': label,
    'message': message,
    'color': color
  });
});

api.get('/info', (req, res) => {
  return res.json({
    title: config.title,
    description: config.description,
    translations: config.translations
  });
});

function updateServiceState(id: string, state: string) {
  if (!uptimeStates[id]) {
    uptimeStates[id] = {days: [], events: []};
  }
  if (serviceStates[id] === state) {
    return;
  }
  serviceStates[id] = state;
  if (uptimeStates[id].events.length === 0 && state !== 'operational' ||
    uptimeStates[id].events.length > 0 && uptimeStates[id].events[0].state !== state) {
    uptimeStates[id].events.unshift({state: state, date: new Date()});
    console.log(`${id} changed to ${state}`);
  }
}

function updateCache(): void {
  updateUptime();

  const groups = config.groups.map(group => {
    const services = group.services.map(service => {
      const uptime = uptimeStates[service.id];
      return {
        id: service.id,
        name: service.name,
        url: service.url,
        state: serviceStates[service.id] || 'operational',
        uptime: uptime ? uptime.days30 : 100
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

function updateUptime() {
  const now = dayjs.utc();
  const today = now.startOf('d');
  const eventLimit = now.subtract(7, 'd');
  for (const id in uptimeStates) {
    if (uptimeStates.hasOwnProperty(id)) {
      const uptime = uptimeStates[id] as UptimeStatus;
      if (uptime.days.length < 90) {
        for (let i = 0; i < 90; i++) {
          uptime.days.push({date: today.subtract(90 - i, 'd').toDate(), uptime: 100});
        }
      }
      if (today.diff(dayjs.utc(uptime.days[uptime.days.length - 1].date), 'd') >= 1) {
        uptime.days.push({date: today.toDate(), uptime: 0});
      }
      if (uptime.days.length > 90) {
        uptime.days.splice(0, uptime.days.length - 90);
      }
      for (let i = uptime.days.length - 3; i < uptime.days.length; i++) {
        const start = dayjs.utc(uptime.days[i].date);
        let end = start.add(1, 'd');
        if (end.isAfter(now)) {
          end = now;
        }
        uptime.days[i].uptime = calculateUptime(start, end, uptime.events);
      }
      uptime.hours24 = calculateUptime(now.subtract(24, 'h'), now, uptime.events);
      uptime.days7 = uptime.days.slice(uptime.days.length - 7, uptime.days.length).map(e => e.uptime).reduce((a, b) => a + b) / 7;
      uptime.days30 = uptime.days.slice(uptime.days.length - 30, uptime.days.length).map(e => e.uptime).reduce((a, b) => a + b) / 30;
      uptime.days90 = uptime.days.slice(uptime.days.length - 90, uptime.days.length).map(e => e.uptime).reduce((a, b) => a + b) / 90;
      uptime.events = uptime.events.filter(e => dayjs.utc(e.date).isAfter(eventLimit));
      if (uptime.events.length > 0 && uptime.events[uptime.events.length - 1].state === 'operational') {
        uptime.events.pop();
      }
    }
  }
}

function calculateUptime(start: Dayjs, end: Dayjs, events: { state: State; date: Date; }[]): number {
  if (events.filter(event => dayjs.utc(event.date).isBetween(start, end)).length == 0) {
    const lastEvent = events.filter(event => dayjs.utc(event.date).isBefore(start))[0];
    if (lastEvent && lastEvent.state !== 'operational') {
      return 0;
    }
    return 100;
  }
  let uptimeMillis = 0;
  let newestEventDate;
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    const eventDate = dayjs.utc(event.date);
    const lastEvent = events[i + 1];
    let lastEventDate = lastEvent ? dayjs.utc(lastEvent.date) : start;
    if (lastEventDate.isBefore(start)) {
      lastEventDate = start;
    }
    if (eventDate.isBetween(start, end)) {
      if (event.state === 'operational') {
        newestEventDate = eventDate;
      } else if (!lastEvent || lastEvent.state === 'operational') {
        newestEventDate = null;
        uptimeMillis += eventDate.diff(lastEventDate, 'ms');
      }
    }
  }
  if (newestEventDate) {
    uptimeMillis += end.diff(newestEventDate, 'ms');
  }
  return uptimeMillis / end.diff(start, 'ms') * 100;
}

function calculateOverallState(states: State[]): State {
  return states.includes('outage') ? 'outage' : states.includes('maintenance') ? 'maintenance' : 'operational';
}

function persistCache() {
  writeFileSync('cache.json', JSON.stringify(serviceStates), {encoding: 'utf-8'});
  writeFileSync('uptime.json', JSON.stringify(uptimeStates), {encoding: 'utf-8'});
}

new CronJob('0 * * * * *', () => updateCache(), null, true, 'UTC').start();
new CronJob('0 0 * * * *', () => persistCache(), null, true, 'UTC').start();

export {api};
