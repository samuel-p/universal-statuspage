export type State = 'operational' | 'outage' | 'maintenance';   // ok, alerting, paused

export interface ApiResponse {
  state: State;
  groups: Group[];
}

export interface Group {
  id: string;
  name: string;
  state: State;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  url: string;
  state: State;
}
