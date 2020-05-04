import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../_service/api.service";
import {Group} from "../_data/data";
import {interval, Subject} from "rxjs";
import {flatMap, startWith, takeUntil} from "rxjs/operators";
import {Meta} from "@angular/platform-browser";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {
  readonly stateClasses = {
    "operational": 'fas fa-fw fa-heart operational mr-2',
    "outage": 'fas fa-fw fa-heart-broken outage mr-2',
    "maintenance": 'fas fa-fw fa-heartbeat maintenance mr-2'
  };

  destroyed$ = new Subject();
  groups: Group[];
  lastUpdated: Date;

  constructor(private api: ApiService, @Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    interval(30000).pipe(
      startWith(0),
      takeUntil(this.destroyed$),
      flatMap(() => this.api.getServiceStates())
    ).subscribe(response => {
      const favicon: HTMLLinkElement = document.getElementById('favicon') as HTMLLinkElement;
      favicon.href = `favicon-${response.state}.ico`;
      this.groups = response.groups;
      this.lastUpdated = new Date();
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
