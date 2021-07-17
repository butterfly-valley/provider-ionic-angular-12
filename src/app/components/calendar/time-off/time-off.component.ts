import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, FullCalendarComponent} from '@fullcalendar/angular';
import {CalendarComponent} from '../../popover/calendar/calendar.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import {isIos, mobile, tablet} from '../../../app.component';
import {Employee} from '../../../store/models/provider.model';
import {BehaviorSubject, Subscription} from 'rxjs';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {PopoverController} from '@ionic/angular';
import {RosterService} from '../../../services/user/roster.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {EmployeeProfileService} from '../../../services/user/employee-profile.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {TimeoffRequestComponent} from '../../modals/employee/timeoff-request/timeoff-request.component';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-time-off',
  templateUrl: './time-off.component.html',
  styleUrls: ['./time-off.component.scss'],
  animations: [
    trigger(
        'enterAnimation', [
          state('void', style({ opacity: 0 })),
          state('*', style({ opacity: 1 })),
          transition(':enter', animate('800ms ease-out')),
          transition(':leave', animate('800ms ease-in')),
        ]
    )
  ],
})
export class TimeOffComponent implements OnInit {
  @Input() employee: Employee;
  @Input() subdivisionId: string | undefined;
  @Input() divisionId: string | undefined;
  @Input() all: boolean;
  @Input() index: number;
  @Input() initialDate: Date;
  @Input() month: string;
  @Input() year: number;
  tablet = tablet;
  mobile = mobile;
  isIos = isIos;
  isLoading = false;

  /*get access to fullcalendar element*/
  private fullCalendar: FullCalendarComponent;

  @ViewChild('fullCalendar', {static: false}) set content(content: FullCalendarComponent) {
    this.fullCalendar = content;
  }

  @ViewChild('external', {static: false}) external: ElementRef;
  pasteSlotSub$: Subscription;


  fullCalendarOptions: CalendarOptions;
  currentViewTitle: string;
  hideCalendar = false;
  subdivisionEvents$ = new BehaviorSubject<any[]>([]);
  deleteSlots$: Subscription;


  constructor(public fullcalendarService: FullcalendarService,
              private translate: LocalizationService,
              private auth: AuthService,
              private popoverController: PopoverController,
              public employeeProfileService: EmployeeProfileService,
              public rosterService: RosterService,
              private modalService: ModalService,
              private dateTimeUtil: DateTimeUtilService,
              private alert: AlertService,
              private toast: ToastService) { }

  ngOnInit() {
    setTimeout(() => {
      this.fullCalendarOptions = this.fullCalendarOptionsForEmployeeSchedule();
      this.employeeProfileService.timeOffCalendar$.next(this.fullCalendar);
      this.fullCalendar.getApi().gotoDate(this.year + '-' + this.month + '-01');
    }, 1);
  }

  /* fullcalendar options*/
  fullCalendarOptionsForEmployeeSchedule(): CalendarOptions {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const self = this;
    const dateRange = {
      start: this.year + '-' + this.month + '-01',
      end: '2030-12-31'
    };

    async function popover(el) {
      let cssClass = 'calendar-popover';
      if (mobile && !tablet) {
        cssClass = 'calendar-popover-mobile';
      }

      const calendars = [];

      calendars.push(self.fullCalendar);

      const calendarPopover = await self.popoverController.create({
        component: CalendarComponent,
        cssClass,
        event: el,
        mode: 'ios',
        componentProps: {
          rosters: calendars,
        }
      });

      return await calendarPopover.present();
    }


    return  {
      events(fetchInfo, successCallback, failureCallback) {
        self.fullcalendarService.populateRoster(fetchInfo, successCallback, self.employee.id, self.all, self.subdivisionId, self.divisionId, true);
      },
      async eventClick(event) {
        await self.fullcalendarClick(event);
      },
      allDaySlot: false,
      views: {
        dayGridYear: {
          type: 'dayGrid',
          duration: { days: 365 },
          buttonText: '3 ' + this.translate.getFromKey('days-calendar'),
          dayHeaderFormat: {weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true}
        }
      },
      titleFormat: {month: 'long'},
      initialView: 'dayGridMonth',
      height: 'auto',
      customButtons: {
        dayButton: {
          text: ' ',
          icon: 'search',
          click(ev, element: HTMLElement): void {
            popover(element);
          }
        }
      },
      dayHeaders: true,
      headerToolbar: {
        left: '',
        center: 'title',
        right: ''
      },
      // @ts-ignore
      slotLabelFormat: self.fullcalendarService.eventTimeFormat(),
      plugins: [dayGridPlugin],
      visibleRange: dateRange,
      locale: self.fullcalendarService.getFullcalendarLocale(this.translate),
      fixedWeekCount: false,
      // @ts-ignore
      eventTimeFormat: self.fullcalendarService.eventTimeFormat(),
      eventContent(arg, createElement) {
        const arrayOfDomNodes = self.fullcalendarService.setEventContent(arg);
        return { domNodes: arrayOfDomNodes };

      },

      eventDidMount(el) {
        self.fullcalendarService.rosterAfterMount(el, today, true);
      },
      eventMouseEnter(ev) {
        self.fullcalendarService.createTooltip(ev, true);
      },
      eventMouseLeave(ev) {
        if (!self.mobile) {
          const tooltips = document.body.getElementsByClassName('tooltip-span');
          while (tooltips.length > 0) {
            tooltips[0].parentNode.removeChild(tooltips[0]);
          }
        }
      },
      async dateClick(dateClickInfo) {
        const date = dateClickInfo.date;
        // await self.pasteSlots(date);


        let cssClass = '';
        if (!mobile) {
          cssClass = 'timeOff-request-modal';
        }


        await self.modalService.openTimeOffRequestModal(TimeoffRequestComponent, cssClass, self.employee, date);
      }
    };
  }

  async fullcalendarClick(event: any) {


    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    // tslint:disable-next-line:no-shadowed-variable
    const style = event.el.style;

    const slotEmployeeId = event.event.extendedProps.employeeId;

    if (this.employee.id === slotEmployeeId) {

      if (event.event.start >= today) {
        if (style.opacity !== '0.5') {
          this.employeeProfileService.selectedSlots.push(event);
          style.opacity = '0.5';
        } else {
          this.employeeProfileService.selectedSlots = this.employeeProfileService.selectedSlots.filter(item => item.event.start.toUTCString() !== event.event.start.toUTCString());
          style.opacity = '1';
        }
      }
    }


  }

  async deleteTimeOffRequests() {

    if (this.employeeProfileService.selectedSlots.length > 0) {
      const ids = [];
      this.employeeProfileService.selectedSlots.forEach(
          slot => ids.push(slot.event.extendedProps.slotId.toString())
      );

      await this.alert.presentAlert(
          null,
          null,
          this.translate.getFromKey('roster-delete-slots-sure'),
          [
            {
              text: this.translate.getFromKey('close'),
              role: 'cancel'

            },
            {
              cssClass: 'actionsheet-delete',
              text: this.translate.getFromKey('delete'),
              handler: () => {
                this.deleteSlots$ = this.auth.getCurrentToken().subscribe(async token => {
                      if (token) {
                        this.employeeProfileService.deleteTimeOffRequest(token, ids).subscribe(
                            async response => {
                              this.isLoading = false;
                              if (response.message) {
                                switch (response.message) {
                                  case 'bindingError':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [{
                                      text: this.translate.getFromKey('close'),
                                      role: 'cancel'
                                    }]);
                                    break;
                                  case 'invalidSlot':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-slot-invalid'), [{
                                      text: this.translate.getFromKey('close'),
                                      role: 'cancel'
                                    }]);
                                    break;
                                  default:
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [{
                                      text: this.translate.getFromKey('close'),
                                      role: 'cancel'
                                    }]);
                                }
                              } else {
                                if (response.id) {
                                  await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                                  this.employeeProfileService.timeOffCalendar$.value.getApi().refetchEvents();
                                  this.employeeProfileService.employee$.next(response);
                                  this.setOpacityBack();

                                }
                              }
                            }, async error => {
                              this.isLoading = false;
                              await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [{
                                text: this.translate.getFromKey('close'),
                                role: 'cancel'
                              }]);
                            }
                        );
                      } else {
                        this.isLoading = false;
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [{
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'
                        }]);
                      }
                    }, async error => {
                      this.isLoading = false;
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [{
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'
                      }]);
                    }
                );


              }

            }

          ]
      );


    }
  }

  private setOpacityBack() {
    this.employeeProfileService.selectedSlots.forEach(
        event => {
          event.el.style.opacity = 1;
        }
    );

    this.employeeProfileService.selectedSlots = [];
  }

}
