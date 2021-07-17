import {Component, Input} from '@angular/core';
import {LocalizationService} from "../../services/localization/localization.service";

@Component({
  selector: 'app-timepicker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.scss'],
})
export class TimepickerComponent {
  @Input() formControlName: string;

  constructor(private translate: LocalizationService) { }

  timePickerFormat() {
    if (this.translate.getLocale() === 'en') {
      return 'h:mm A';
    } else {
      return 'HH:mm';
    }
  }

}
