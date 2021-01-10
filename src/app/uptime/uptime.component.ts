import {Component, Input, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import {UptimeStatus} from '../_data/data';
import {ApiService} from '../_service/api.service';
import {catchError} from 'rxjs/operators';
import {StorageService} from '../_service/storage.service';

@Component({
  selector: 'app-uptime',
  templateUrl: './uptime.component.html',
  styleUrls: ['./uptime.component.scss']
})
export class UptimeComponent implements OnInit {
  @Input() id: string;
  readonly stateClasses = {
    'operational': 'fas fa-fw fa-heart operational mr-2',
    'outage': 'fas fa-fw fa-heart-broken outage mr-2',
    'maintenance': 'fas fa-fw fa-heartbeat maintenance mr-2'
  };
  uptime$: Observable<UptimeStatus>;
  error: string;
  expanded: boolean;

  constructor(private api: ApiService, private storage: StorageService) {
  }

  ngOnInit(): void {
    if (!this.id) {
      throw new Error('please pass a service id!');
    }
    let value = this.storage.getValue('show-events-' + this.id);
    console.log(value, typeof value);
    if (typeof value !== 'boolean') {
      value = false;
    }
    this.expanded = value;
    this.uptime$ = this.api.getServiceUptime(this.id)
      .pipe(catchError(err => {
        if (err.status === 404) {
          this.error = 'No uptime information available.';
        } else {
          this.error = 'An unexpected error occurred: ' + err.error;
        }
        return of(null);
      }));
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
    this.storage.setValue('show-events-' + this.id, this.expanded);
  }
}
