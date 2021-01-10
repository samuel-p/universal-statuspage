import {BrowserModule} from '@angular/platform-browser';
import {NgModule, PLATFORM_ID} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {StatusComponent} from './status/status.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatListModule} from '@angular/material/list';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {MatTooltipModule} from '@angular/material/tooltip';
import {UptimeComponent} from './uptime/uptime.component';
import {DayjsPipe} from './_pipe/dayjs.pipe';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {isPlatformServer} from '@angular/common';
import {from, Observable} from 'rxjs';

export class TranslateUniversalLoader extends TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return from(import(`../assets/i18n/${lang}.json`));
  }
}

export function UniversalLoaderFactory(http: HttpClient, plattformId: Object) {
  if (isPlatformServer(plattformId)) {
    return new TranslateUniversalLoader();
  }
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    StatusComponent,
    UptimeComponent,
    DayjsPipe
  ],
  imports: [
    BrowserModule.withServerTransition({appId: 'serverApp'}),
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: UniversalLoaderFactory,
        deps: [HttpClient, PLATFORM_ID]
      }
    }),
    MatExpansionModule,
    MatListModule,
    MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
