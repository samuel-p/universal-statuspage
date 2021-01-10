import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {Observable, of} from 'rxjs';
import {CurrentStatus, MetaInfo, UptimeStatus} from '../_data/data';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {isPlatformBrowser} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly api;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.api = isPlatformBrowser(platformId) ? '/api' : environment.serverUrl + '/api';
  }

  public getServiceStates(): Observable<CurrentStatus> {
    return this.http.get<CurrentStatus>(this.api + '/status');
  }

  public getServiceUptime(id: string): Observable<UptimeStatus> {
    return this.http.get<UptimeStatus>(this.api + '/uptime', {params: {service: id}});
  }

  public getMetaInfo(): Observable<MetaInfo> {
    return this.http.get<MetaInfo>(this.api + '/info');
  }
}
