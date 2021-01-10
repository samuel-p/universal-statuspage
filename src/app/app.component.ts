import {Component, Inject, Injector, OnInit, PLATFORM_ID} from '@angular/core';
import {ApiService} from './_service/api.service';
import {Title} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from './_service/storage.service';
import {isPlatformServer} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title: string;
  description: string;
  translations: { [lang: string]: { title: string; description: string } };

  private supportedLanguages = ['en', 'de'];

  constructor(private translate: TranslateService, private api: ApiService,
              private storage: StorageService, private htmlTitle: Title,
              private injector: Injector, @Inject(PLATFORM_ID) private platformId: Object) {
    this.translate.setDefaultLang('en');
    if (isPlatformServer(platformId)) {
      const request = this.injector.get<any>(<any> 'REQUEST');
      const requestLanguage = request.acceptsLanguages(this.supportedLanguages) || 'en';
      this.translate.use(requestLanguage);
      return;
    }
    let language = this.storage.getValue('language') || this.translate.getBrowserLang();
    if (language ! in this.supportedLanguages) {
      language = 'en';
    }
    translate.use(language);
  }

  ngOnInit(): void {
    this.api.getMetaInfo().subscribe(info => {
      this.title = info.title;
      this.description = info.description;
      this.translations = info.translations || {};
      this.htmlTitle.setTitle(this.title);
    });
  }

  getLanguage(): string {
    return this.translate.currentLang;
  }

  setLanguage(language: string): void {
    this.translate.use(language);
    this.storage.setValue('language', language);
  }
}
