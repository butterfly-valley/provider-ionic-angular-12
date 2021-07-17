import {Component, Input} from '@angular/core';
import {LocalizationService} from "../../../services/localization/localization.service";
import {DateAdapter} from "@angular/material/core";
import {PopoverController} from "@ionic/angular";
import {GotodateService} from "../../../services/user/gotodate.service";
import {dateClass} from "../../../app.component";
import {FullCalendarComponent} from '@fullcalendar/angular';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent {
  selectedDate: any;
  @Input() rosters: FullCalendarComponent[];

  constructor(private translate: LocalizationService,
              private dateAdapter: DateAdapter<any>,
              private gotodateService: GotodateService,
              private popoverController: PopoverController) {
    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }


  async selectedDateChange(date: Date) {
    this.selectedDate = date;
    // this.setCorrectView(this.gotodateService.currentFullcalendar.getApi().view.viewSpec.type);
    if (!this.rosters) {
      this.gotodateService.currentFullcalendar.getApi().gotoDate(date);
    } else {
      this.rosters.forEach(
          roster => {
            roster.getApi().gotoDate(date);
          }
      )
    }
    await this.popoverController.dismiss();
  }

  private setCorrectView(currentView: string) {
    let view = 'timeGridDay';

    if (currentView.includes('list')) {
      view = 'listDay'
    }

    if (currentView.includes('dayGrid')) {
      view = 'dayGridDay'
    }

    this.gotodateService.currentFullcalendar.getApi().changeView(view);
  }

  dateClass() {
    return dateClass();
  }
}
