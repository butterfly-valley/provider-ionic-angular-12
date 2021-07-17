import {Directive, Input} from '@angular/core';

@Directive({
  selector: '[appStickyCalendarHeader]'
})
export class StickyCalendarHeaderDirective {
  @Input('appStickyCalendarHeader') calendarHeader: any;

  constructor() { }

}
