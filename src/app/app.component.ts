import {Component, OnInit} from '@angular/core';
import {ApiService} from "./_service/api.service";
import {Observable} from "rxjs";
import {MetaInfo} from "./_data/data";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title: string;
  description: string;

  constructor(private api: ApiService, private htmlTitle: Title) {
  }

  ngOnInit(): void {
    this.api.getMetaInfo().subscribe(info => {
      this.title = info.title;
      this.description = info.description;
      this.htmlTitle.setTitle(this.title);
    })
  }
}
