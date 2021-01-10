export type State = 'operational' | 'outage' | 'maintenance';

export interface CurrentStatus {
  state: State;
  groups: Group[];
}

export interface Group {
  id: string;
  name: string;
  url?: string;
  state: State;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  url?: string;
  state: State;
  uptime: number;
}

export interface MetaInfo {
  title: string;
  description: string;
  translations?: {
    [lang: string]: {
      title: string;
      description: string;
    }
  }
}

export interface UptimeStatus {
  hours24: number;
  days7: number;
  days30: number;
  days90: number;
  days: {
    date: Date;
    uptime: number;
  }[];
  events: {
    state: State;
    date: Date;
  }[];
}
