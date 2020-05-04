import {Injectable} from '@angular/core';
import {Observable, of} from "rxjs";
import {ApiResponse} from "../_data/data";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor() {
  }

  public getServiceStates(): Observable<ApiResponse> {
    return of({
      state: "maintenance",
      groups: [{
        id: 'default',
        name: 'Some Group',
        state: "outage",
        services: [{
          id: 'nextcloud',
          name: 'Nextcloud',
          url: "https://sp-codes.de",
          state: "operational"
        }, {
          id: 'synapse',
          name: 'Synapse',
          url: "https://sp-codes.de",
          state: "outage"
        }, {
          id: 'searx',
          name: 'Searx',
          url: "https://sp-codes.de",
          state: "maintenance"
        }]
      }, {
        id: 'test',
        name: 'Test',
        state: "operational",
        services: [{
          id: 'nextcloud',
          name: 'Nextcloud',
          url: "https://sp-codes.de",
          state: "operational"
        }, {
          id: 'synapse',
          name: 'Synapse',
          url: "https://sp-codes.de",
          state: "operational"
        }]
      }]
    });
  }
}
