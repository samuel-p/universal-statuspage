import {Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {ApiService} from '../_service/api.service';
import {Group} from '../_data/data';
import {interval, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {StorageService} from '../_service/storage.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {
  readonly stateClasses = {
    'operational': 'fas fa-fw fa-heart operational mr-2',
    'outage': 'fas fa-fw fa-heart-broken outage mr-2',
    'maintenance': 'fas fa-fw fa-heartbeat maintenance mr-2'
  };

  destroyed$ = new Subject();
  groups: Group[];
  lastUpdated: Date;
  expandedCache: { [id: string]: boolean };

  constructor(private api: ApiService, private storage: StorageService,
              @Inject(PLATFORM_ID) private platformId: Object,
              @Inject(DOCUMENT) private document: Document) {
    let cache = this.storage.getValue('expanded');
    if (typeof cache !== 'object') {
      cache = null;
    }
    this.expandedCache = cache || {};
  }

  ngOnInit(): void {
    this.update();
    if (isPlatformBrowser(this.platformId)) {
      interval(30000).pipe(takeUntil(this.destroyed$)).subscribe(() => this.update());
    }
  }

  private update() {
    this.api.getServiceStates().subscribe(response => {
      if (isPlatformBrowser(this.platformId)) {
        const favicon: HTMLLinkElement = document.getElementById('favicon') as HTMLLinkElement;
        favicon.href = `favicon-${response.state}.ico`;
      }
      this.groups = response.groups;
      this.lastUpdated = new Date();
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  saveExpandedCache() {
    this.storage.setValue('expanded', this.expandedCache);
  }
}
