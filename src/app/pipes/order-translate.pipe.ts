import { Pipe }             from '@angular/core';
import { PipeTransform }    from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orderTranslate'
})
export class OrderTranslatePipe implements PipeTransform
{
  constructor(private translate : TranslateService) {}

  transform(array: Array<string>): Array<string>
  {
    array.sort((a: any, b: any) =>
    {
      if (this.translate.instant(a) < this.translate.instant(b))
        return -1;
      else if (this.translate.instant(a) > this.translate.instant(b))
        return 1;
      else
        return 0;
    });
    return array;
  }
}