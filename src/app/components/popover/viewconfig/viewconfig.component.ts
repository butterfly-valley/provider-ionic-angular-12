import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {PickerController, PopoverController} from '@ionic/angular';
import {LocalizationService} from '../../../services/localization/localization.service';
import {PickerService} from '../../../services/overlay/picker.service';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {mobile} from '../../../app.component';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';

@Component({
  selector: 'app-viewconfig',
  templateUrl: './viewconfig.component.html',
  styleUrls: ['./viewconfig.component.scss'],
})
export class ViewconfigComponent{

  /*choose the duration of the viewed interval*/
  minutesPerVacancyDesktop = [
    '5',
    '10',
    '15',
    '20',
    '25',
    '30',
    '45',
    '60'
  ];

  start = [
    '00:00',
    '01:00',
    '02:00',
    '03:00',
    '04:00',
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  end = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '24:00', 
  ];


  mobile = mobile;

  constructor(
      private pickerController: PickerController,
      private translate: LocalizationService,
      private fullcalendarService: FullcalendarService,
      private popoverController: PopoverController,
      private pickerService: PickerService,
      private localStorage: LocalStorageService) { }


  async selectMinutes(ev: any) {
    let value = ev.value;
    let valueToStore = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
      valueToStore = ev.srcElement.value;
    }
    if (value === '5') {
      value = '05';
    }
    await this.localStorage.writeObject('BOOKanAPPPreferredSlotDuration', valueToStore);
    if (this.fullcalendarService.multipleFullcalendars && this.fullcalendarService.multipleFullcalendars.length > 0) {
      this.fullcalendarService.multipleFullcalendars.forEach(
          async calendar => {
            await this.updateSlotDuration(value, calendar);
          }
      );

    }
  }



  async updateSlotDuration(minutesPerSlot: string, fullcalendar: FullCalendarComponent) {
    fullcalendar.getApi().setOption('slotDuration', '00:' + minutesPerSlot  + ':00');
    await this.popoverController.dismiss();
  }

  async updateInitialHour(hour: string, fullcalendar: FullCalendarComponent) {
    // fullcalendar.getApi().setOption('minTime', hour);
    await this.popoverController.dismiss();
  }

  async updateEndHour(hour: string, fullcalendar: FullCalendarComponent) {
    // fullcalendar.getApi().setOption('maxTime', hour);
    await this.popoverController.dismiss();
  }

  async selectStart(ev: any) {
    let value = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
    }

    await this.localStorage.writeObject('BOOKanAPPPreferredStart', value);
    if (this.fullcalendarService.multipleFullcalendars && this.fullcalendarService.multipleFullcalendars.length > 0) {
      this.fullcalendarService.multipleFullcalendars.forEach(
          async calendar => {
            await this.updateCalendar('minTime', value, calendar);
          }
      );
    }
  }

  async selectEnd(ev: any) {
    let value = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
    }

    await this.localStorage.writeObject('BOOKanAPPPreferredEnd', value);
    if (this.fullcalendarService.multipleFullcalendars && this.fullcalendarService.multipleFullcalendars.length > 0) {
      this.fullcalendarService.multipleFullcalendars.forEach(
          async calendar => {
            await this.updateCalendar('maxTime', value, calendar);
          }
      );
    }
  }


  convert24to12(time24: string) {
    if (this.translate.getLocale() === 'en-US') {
      let ts = time24;
      const H = +ts.substr(0, 2);
      let h: string | number = (H % 12) || 12;
      h = (h < 10) ? (h) : h;  // leading 0 at the left for 1 digit hours
      const ampm = H < 12 ? " AM" : " PM";
      ts = h + ts.substr(2, 3) + ampm;
      return ts;
    } else {
      return time24;
    }
  }

  private async updateCalendar(option,  value, fullcalendar) {
    fullcalendar.getApi().setOption(option, value);
    await this.popoverController.dismiss();
  }

}
