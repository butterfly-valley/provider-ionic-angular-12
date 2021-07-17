import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {AppointmentService} from "../../../services/user/appointment.service";
import {alertPosition, dateClass, mobile, tablet} from "../../../app.component";
import {DateAdapter} from "@angular/material/core";
import {LocalizationService} from "../../../services/localization/localization.service";
import {FullcalendarService} from "../../../services/user/fullcalendar.service";
import {distinctUntilChanged} from "rxjs/operators";
import {BehaviorSubject, interval, Subscription} from "rxjs";
import {AuthService} from "../../../services/auth/auth.service";
import {CalendarEvent} from "../../../services/search/search.service";
import {DateTimeUtilService} from "../../../services/util/date-time-util.service";
import {ToastService} from "../../../services/overlay/toast.service";
import * as moment from 'moment';

@Component({
  selector: 'app-slot-picker',
  templateUrl: './slot-picker.component.html',
  styleUrls: ['./slot-picker.component.scss'],
})
export class SlotPickerComponent implements OnDestroy{
  @Input() scheduleId: string;

  mobile = mobile;
  tablet = tablet;
  isLoading = false;
  selectedDate: any;
  fetchSlotsSub$: Subscription;
  slot$ = new BehaviorSubject<CalendarEvent[]>(null);
  note = this.translate.getFromKey('provider-restriction');
  locale = this.translate.getLocale();

  constructor(private modalService: ModalService,
              private appointmentService: AppointmentService,
              private dateAdapter: DateAdapter<any>,
              public translate: LocalizationService,
              private fullcalendarService: FullcalendarService,
              private auth: AuthService,
              private dateTimeUtilService: DateTimeUtilService,
              private toastService: ToastService) {

    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  ngOnDestroy() {
    this.dismiss();
  }

  /* dismiss current modal*/
  async dismiss() {
    if (this.fetchSlotsSub$) {
      this.fetchSlotsSub$.unsubscribe();
    }
    await this.modalService.dismissSlotPickerModal();
  }


  async selectedDateChange(date: Date) {
    this.isLoading = true;
    this.selectedDate = date;
    this.fetchSlotsSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(async token => {
          this.fullcalendarService.fetchEvents(this.selectedDate, this.selectedDate, token, this.scheduleId).subscribe(
              response => {
                const slots = [];

                response.forEach(
                    item => {
                      item.momentDateTime = moment.utc(item.dateTime + '.491Z');
                      slots.push(item);
                    }
                )

                this.slot$.next(slots.sort((a, b) => a.momentDateTime.valueOf() - b.momentDateTime.valueOf()));
                this.isLoading = false;
              }
          );

        }, async error => {
          this.fetchSlotsSub$.unsubscribe();
          this.isLoading = false;
        }
    );

  }

  back() {
    this.selectedDate = undefined;
    this.slot$.next(null);
  }

  showDescription(calEvent: any) {
    const time = this.dateTimeUtilService.showTime(this.locale, calEvent.dateTime, calEvent.duration);
    const codedDescription = calEvent.description;
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const totalSpots = this.translate.getFromKey('sched-total-spots');
    const availableSpots = this.translate.getFromKey('sched-available');
    let bookedServices = '';
    if (calEvent.bookedServices) {
      bookedServices = ' |  ' + calEvent.bookedServices;
    }
    let description = '';
    if (codedDescription.includes('###')) {
      const decodedDescription = codedDescription.split('###');
      if (decodedDescription[0] !== 'my-client') {
        description = '<div style="display: flex; align-items: center; justify-content: center"><img style="margin-right: 3px; vertical-align: middle; border-radius: 50%!important;height: 20px; width: 20px; object-fit: cover;" src="/assets/logo/ios-logo.png">' + '  '
            + codedDescription.split("###")[1] + bookedServices + '</div>';
      } else {
        description = '<div style="display: flex; align-items: center; justify-content: center">' + codedDescription.split("###")[1] + bookedServices + '</div>';
      }
    } else if (calEvent.start > today) {
      description = this.translate.getFromKey(codedDescription);
    }

    let numberOfSpots;
    const calNumberOfSpotsLeft = calEvent.spotsLeft;
    const calNumberOfSpots = calEvent.numberOfSpots;
    const multipleSpots = calEvent.multipleSpots;
    if (multipleSpots) {
      if (description !== null) {
        description = description + '<br/>' + totalSpots + ': ' + calNumberOfSpots;
      } else {
        description = calEvent.totalSpots + ': ' + calNumberOfSpots;
      }
      numberOfSpots = '<br/>' + availableSpots + ': ' + calNumberOfSpotsLeft;
    } else {
      numberOfSpots = '';
    }

    return time +  description + numberOfSpots;
  }

  showAppointmentDetails(calEvent: any, simple?: boolean) {
    const description = this.showDescription(calEvent);

    const remark = this.showRemark(calEvent);

    if (simple) {
      return description + remark + this.showRestriction(calEvent);
    }
    return description + remark + this.showRestriction(calEvent);
  }

  showRemark(calEvent: any) {
    let remark = '';
    if (calEvent.remark) {
      remark = '<div>' + this.translate.getFromKey('sched-remark') + ': ' + calEvent.remark + '</div>';
    }

    return remark;
  }

  showRestriction(calEvent: any) {
    let restriction = '';
    if (calEvent.restriction) {
      restriction = '<div>' + this.translate.getFromKey('provider-restriction') + ': ' + calEvent.restriction + '</div>';
    }

    return restriction;
  }


  showDate() {
    return this.dateTimeUtilService.showUTCDate(this.locale, this.selectedDate);
  }

  async addSlot(slot: CalendarEvent) {
    const currentSlots = this.appointmentService.additionalSlots$.value;
    if (currentSlots.filter(s => s.dateTime === slot.dateTime).length < 1) {
      currentSlots.push(slot);
      this.appointmentService.additionalSlots$.next(currentSlots);
      await this.dismiss();
    } else {
      await this.toastService.presentToast(this.translate.getFromKey('additional-slot-same'), alertPosition, 'danger', 4000);

    }

  }

  dateClass() {
    return dateClass();
  }

  filterByDateTime(a, b) {

  }
}
