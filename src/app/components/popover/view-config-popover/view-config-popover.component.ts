import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FullCalendarComponent} from "@fullcalendar/angular";
import {mobile} from "../../../app.component";
import {PickerController, PopoverController} from "@ionic/angular";
import {LocalizationService} from "../../../services/localization/localization.service";
import {PickerService} from "../../../services/overlay/picker.service";
import {LocalStorageService} from "../../../services/localstorage/local-storage.service";
import {FullcalendarService} from '../../../services/user/fullcalendar.service';

@Component({
  selector: 'app-view-config-popover',
  templateUrl: './view-config-popover.component.html',
  styleUrls: ['./view-config-popover.component.scss'],
})
export class ViewConfigPopoverComponent implements OnInit {
  @Input() fullcalendar: FullCalendarComponent;
  @Input() freeSchedule: boolean;
  @Input() rosters: FullCalendarComponent[];
  views;

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

  mobile = mobile;

  /* timepicker html element*/
  @ViewChild('startTimePicker', {static: false}) startTimePicker;
  /* timepicker html element*/
  @ViewChild('endTimePicker', {static: false}) endTimePicker;

  constructor(     private pickerController: PickerController,
                   private translate: LocalizationService,
                   private popoverController: PopoverController,
                   private pickerService: PickerService,
                   private localStorage: LocalStorageService,
                   private fullCalendarService: FullcalendarService) { }

  ngOnInit() {

    this.views = this.freeSchedule ? [
      'timeGridDay', 'timeGrid3Day', 'timeGridWeek'
    ] : this.rosters ? [
      'dayGridDay', 'dayGrid3Day', 'dayGridWeek', 'dayGrid31Day', 'dayGridMonth',

    ] : [
      'timeGridDay', 'dayGridDay', 'timeGrid3Day', 'dayGrid3Day', 'timeGridWeek', 'dayGridWeek',
      'dayGridMonth',
    ];

  }

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
    if (this.fullcalendar) {
      await this.updateSlotDuration(value);
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



  async updateSlotDuration(minutesPerSlot: string) {
    this.fullcalendar.getApi().setOption('slotDuration', '00:' + minutesPerSlot  + ':00');
    await this.popoverController.dismiss();
  }

  async updateCalendar(option,  value) {
    this.fullcalendar.getApi().setOption(option, value);
    await this.popoverController.dismiss();
  }

  async selectStart(ev: any) {
    let value = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
    }

    await this.localStorage.writeObject('BOOKanAPPPreferredStart', value);
    if (this.fullcalendar) {
      await this.updateCalendar('slotMinTime', value);
    }
  }

  async selectEnd(ev: any) {
    let value = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
    }

    await this.localStorage.writeObject('BOOKanAPPPreferredEnd', value);
    if (this.fullcalendar) {
      await this.updateCalendar('slotMaxTime', value);
    }
  }

  viewName(name) {
    if (name === 'timeGridDay') {
      return 1 + ' ' + this.translate.getFromKey('day');
    }

    if (name === 'dayGridDay') {
      if (this.rosters) {
        return 1 + ' ' + this.translate.getFromKey('day');
      }
      return 1 + ' ' + this.translate.getFromKey('day')  + ' (' + this.translate.getFromKey('no-hours') + ')';
    }


    if (name === 'timeGrid3Day') {
      return 3 + ' ' + this.translate.getFromKey('days');
    }

    if (name === 'dayGrid3Day') {
      if (this.rosters) {
        return 3 + ' ' + this.translate.getFromKey('days');
      }
      return 3 + ' ' + this.translate.getFromKey('days') + ' (' + this.translate.getFromKey('no-hours') + ')';
    }

    if (name === 'dayGrid31Day') {
      if (this.rosters) {
        return 31 + ' ' + this.translate.getFromKey('days');
      }
      return 31 + ' ' + this.translate.getFromKey('days') + !this.rosters ? ' (' + this.translate.getFromKey('no-hours') + ')' : '';
    }

    if (name === 'timeGridWeek') {
      return this.translate.getFromKey('week');
    }

    if (name === 'dayGridMonth') {
      return this.translate.getFromKey('month-view')
    }

    if (name === 'dayGridWeek') {
      if (this.rosters) {
        return this.translate.getFromKey('week');
      }
      return this.translate.getFromKey('week') + ' (' + this.translate.getFromKey('no-hours') + ')';
    }

    // if (name === 'listWeek') {
    //   return this.translate.getFromKey('week-list')
    // }

  }

  async selectView(ev: any) {
    let value = ev.value;
    if (ev.srcElement) {
      value = ev.srcElement.value;
    }

    if (!this.rosters) {
      await this.localStorage.writeObject('BOOKanAPPPreferredView', value);
      await this.fullcalendar.getApi().changeView(value);
    } else {
      await this.localStorage.writeObject('BOOKanAPPPreferredRosterView', value);
      this.fullCalendarService.rosterView$.next(value);
      this.rosters.forEach(
          async roster => {
            await roster.getApi().changeView(value);
          }
      );
    }
    await this.popoverController.dismiss();
  }
}
