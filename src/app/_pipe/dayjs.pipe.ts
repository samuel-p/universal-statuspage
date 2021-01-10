import { Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import * as localizedFormat from 'dayjs/plugin/localizedFormat';
import {TranslateService} from '@ngx-translate/core';
import 'dayjs/locale/de';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

@Pipe({
  name: 'dayjs',
  pure: false
})
export class DayjsPipe implements PipeTransform {
  constructor(private translate: TranslateService) {
  }

  transform(value: string | Date, method: string, ...args: any[]): string {
    const date = dayjs.utc(value);
    switch (method) {
      case 'to':
        const to = args[0] ? dayjs.utc(args[0]) : dayjs.utc();
        const suffix = args.length > 1 && args[1] === true;
        return date.locale(this.translate.currentLang).to(to, !suffix);
      case 'from':
        const from = args[0] ? dayjs.utc(args[0]) : dayjs.utc();
        return date.locale(this.translate.currentLang).from(from);
      case 'format':
        return date.local().locale(this.translate.currentLang).format(args[0]);
    }
    throw new Error('please pass a method to use!');
  }
}
