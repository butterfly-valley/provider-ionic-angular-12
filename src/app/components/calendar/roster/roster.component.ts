import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, FullCalendarComponent} from '@fullcalendar/angular';
import {CalendarComponent} from '../../popover/calendar/calendar.component';
import {delay, distinctUntilChanged, take} from 'rxjs/operators';
import {ViewConfigPopoverComponent} from '../../popover/view-config-popover/view-config-popover.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import {alertPosition, isIos, mobile, tablet} from '../../../app.component';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {PopoverController} from '@ionic/angular';
import {Employee} from '../../../store/models/provider.model';
import {RosterService} from '../../../services/user/roster.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';




@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.scss'],
})
export class RosterComponent implements OnInit, OnDestroy {
  @Input() subdivision: Employee[];
  @Input() all;
  @Input() employeeId;
  @Input() employee: Employee;
  @Input() subdivisionId;
  @Input() divisionId;
  subdivisionName;
  @Input() index: number;
  @Input() name: string;
  @Input() preferredView;
  @Input() anonymous;
  @Input() sharedView;
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


  constructor(public fullcalendarService: FullcalendarService,
              private translate: LocalizationService,
              private auth: AuthService,
              private popoverController: PopoverController,
              public rosterService: RosterService,
              private dateTimeUtil: DateTimeUtilService,
              private alert: AlertService,
              private toast: ToastService) { }

  ngOnInit() {


    if (!this.employeeId && this.subdivision && this.subdivision[0] && this.subdivision[0].subdivisionId) {
      this.subdivisionId = this.subdivision[0].subdivisionId;
    }

    if (this.subdivision &&  this.subdivision[0] && this.subdivision[0].subdivision && this.subdivision[0].division) {
      this.subdivisionName = this.subdivision[0].subdivision ;
    }

    if (this.employee)  {
      this.subdivision = null;
      this.subdivisionId = null;
      this.subdivisionName = null;
      this.employeeId = this.employee.id;
    }

    if (this.preferredView && this.preferredView.value) {
      this.fullcalendarService.rosterView$.next(JSON.parse(this.preferredView.value));
    } else {
      this.fullcalendarService.rosterView$.next('dayGridWeek');
      if (this.tablet) {
        this.fullcalendarService.rosterView$.next('dayGrid3Day');
      }

      if (this.mobile && !this.tablet) {
        this.fullcalendarService.rosterView$.next('dayGridDay');
      }

    }

    this.fullCalendarOptions = this.fullCalendarOptionsForEmployeeSchedule();


    setTimeout(() => {
      const rosters = this.fullcalendarService.rosters$.value;

      if (this.fullCalendar.getApi() && this.fullCalendar.getApi().currentData) {
        rosters.push(this.fullCalendar);
      }
      this.fullcalendarService.rosters$.next(rosters);

    }, 300);

    this.subdivisionEvents$.subscribe(
        value => {
          if (value && value.length > 0) {
            this.fullCalendar.getApi().render();
          }
        }
    );


  }

  ngOnDestroy() {
    this.fullcalendarService.next$.unsubscribe();
    this.fullcalendarService.previous$.unsubscribe();

  }


  /* fullcalendar options*/

  fullCalendarOptionsForEmployeeSchedule(): CalendarOptions {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const todayDate = today.getFullYear() + '-' + this.dateTimeUtil.addZero(today.getMonth()) + '-' + '01';
    const self = this;


    const defaultDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dateRange = {
      start: todayDate,
      end: '2030-12-31'
    };

    async function popover(el) {
      let cssClass = 'calendar-popover';
      if (mobile && !tablet) {
        cssClass = 'calendar-popover-mobile';
      }
      const calendarPopover = await self.popoverController.create({
        component: CalendarComponent,
        cssClass,
        event: el,
        mode: 'ios',
        componentProps: {
          rosters: self.fullcalendarService.rosters$.value,
        }
      });

      return await calendarPopover.present();
    }



    // tslint:disable-next-line:no-shadowed-variable
    async function optionsPopover(el) {
      let cssClass = 'option-popover';
      if (mobile && !tablet) {
        cssClass = 'option-popover-mobile';
      }

      // tslint:disable-next-line:no-shadowed-variable
      const popover = await self.popoverController.create({
        component: ViewConfigPopoverComponent,
        translucent: true,
        cssClass,
        mode: 'ios',
        event: el,
        componentProps: {
          rosters: self.fullcalendarService.rosters$.value,
        }
      });
      return await popover.present();
    }


    return  {
      events(fetchInfo, successCallback, failureCallback) {
        self.isLoading = true;
        if (!self.anonymous) {
          if (self.employee) {
            self.employeeId = self.employee.id;
          }

          if (!self.subdivision) {
            self.fullcalendarService.populateRoster(fetchInfo, successCallback, self.employeeId, self.all, self.subdivisionId, self.divisionId);
            self.isLoading = false;
          } else {
            // hide subdivision calendar if there is no events in it to save space
            self.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).pipe(delay(100)).subscribe(async token => {
              if (token) {
                self.fullcalendarService.fetchAllRosters(fetchInfo.start, fetchInfo.end, token, undefined, undefined, self.subdivisionId, undefined).subscribe(events => {
                      if (events) {
                        events.forEach(
                            event => {
                              self.fullcalendarService.rosterBeforeMount(event);
                            }
                        );
                        if (events.length > 0) {
                          successCallback(events);
                          setTimeout(() => {
                            self.hideCalendar = false;
                            self.fullCalendar.getApi().setOption('height', 'auto');
                          }, 100);
                        } else {
                          self.fullCalendar.getApi().setOption('height', '30px');
                          self.hideCalendar = true;
                        }
                        self.isLoading = false;
                      }
                      self.isLoading = false;
                    }
                );
              }
            });
          }

        } else {
          if (self.employee) {
            self.employeeId = self.employee.id;
          }
          self.fullcalendarService.fetchAnonymousRoster(fetchInfo.start, fetchInfo.end, self.employeeId, self.subdivisionId, self.divisionId).subscribe(events => {
                if (events) {
                  events.forEach(
                      event => {
                        self.fullcalendarService.rosterBeforeMount(event);
                      }
                  );

                  setTimeout(() => {
                    successCallback(events);
                  }, 40);

                  if (events.length > 0) {
                    self.fullCalendar.getApi().render();
                    setTimeout(() => {
                      self.hideCalendar = false;
                      self.fullCalendar.getApi().setOption('height', 'auto');

                    }, 100);
                  } else {
                    if (self.subdivision) {
                      self.fullCalendar.getApi().setOption('height', '30px');
                    }
                    self.hideCalendar = true;
                  }
                  self.isLoading = false;
                }
                self.isLoading = false;
              }
          );
          self.isLoading = false;
        }
      },
      async eventClick(event) {
        await self.fullcalendarClick(event);
      },
      allDaySlot: false,
      initialView: self.fullcalendarService.rosterView$.value,
      initialDate: defaultDate,
      height: 'auto',
      customButtons: {
        dayButton: {
          text: ' ',
          icon: 'search',
          click(ev, element: HTMLElement): void {
            popover(element);
          }
        },
        optionsButton: {
          text: self.translate.getFromKey('sched-options'),
          click(ev, element: HTMLElement): void {
            optionsPopover(ev);
          }
        },
        prevButton: {
          text: '',
          icon: 'chevron-left',
          click(ev, element: HTMLElement): void {
            self.prevRoster();
          }
        },
        nextButton: {
          text: '',
          icon: 'chevron-right',
          click(ev, element: HTMLElement): void {
            self.nextRoster();
          }
        }
      },
      dayHeaders: (self.index !== 0 && self.subdivisionId !== null) || (self.employee && !self.employee.subdivisionId),
      headerToolbar: {
        left: self.index === 0 ? 'prevButton,nextButton,dayButton' : '',
        center: self.index === 0 ?  'title' : '',
        right: self.index === 0 ?  'optionsButton' : ''
      },
      // @ts-ignore
      slotLabelFormat: self.fullcalendarService.eventTimeFormat(),
      plugins: [dayGridPlugin],
      visibleRange: dateRange,
      locale: self.fullcalendarService.getFullcalendarLocale(this.translate),
      views: {
        dayGrid3Day: {
          type: 'dayGrid',
          duration: { days: 3 },
          buttonText: '3 ' + this.translate.getFromKey('days-calendar')
        },
        dayGrid31Day: {
          type: 'dayGrid',
          duration: { days: 31 },
          buttonText: '31 ' + this.translate.getFromKey('days-calendar'),
          dayHeaderFormat: {weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true}
        }
      },
      fixedWeekCount: false,
      // @ts-ignore
      eventTimeFormat: self.fullcalendarService.eventTimeFormat(),
      eventContent(arg, createElement) {
        const arrayOfDomNodes = self.fullcalendarService.setEventContent(arg);
        return { domNodes: arrayOfDomNodes };

      },

      eventDidMount(el) {
        self.fullcalendarService.rosterAfterMount(el, today);
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
        if (self.fullcalendarService.copiedSlots.length > 0) {
          const date = dateClickInfo.date;
          await self.pasteSlots(date);

        }
      }
    };
  }

  async pasteSlots(date: Date) {

    const localDate = date.getFullYear() + '-' + this.dateTimeUtil.addZero(date.getMonth() + 1) + '-' + this.dateTimeUtil.addZero(date.getDate());
    const event = this.fullcalendarService.copiedSlots[0].event.extendedProps;
    const copiedSlots = this.fullcalendarService.copiedSlots;

    await this.alert.presentAlert(
        this.dateTimeUtil.showDateInterval(this.translate.getLocale(), date, copiedSlots.length),
        '',
        this.translate.getFromKey('submit') + ' ' + this.fullcalendarService.copiedSlots.length + ' ' + this.translate.getFromKey('slots') + '?',
        [
          {
            text: this.translate.getFromKey('close'),
            role: 'cancel'

          },
          {
            text: this.translate.getFromKey('submit'),
            handler: () => {
              this.isLoading = true;
              this.pasteSlotSub$ = this.auth.getCurrentToken().subscribe(
                  token => {
                    if (token) {
                      const pasteForm = {
                        size: this.fullcalendarService.copiedSlots.length,
                        date: localDate,
                        slotId: event.slotId,
                        subdivisionId: this.subdivision ? this.subdivision[0].subdivisionId : 0,
                        employeeId: !this.subdivision ? this.employeeId : 0
                      };

                      this.fullcalendarService.pasteSlot(token, pasteForm).subscribe(
                          async response => {
                            this.isLoading = false;
                            switch (response.message) {
                              case 'bindingError':
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                                  text: this.translate.getFromKey('close'),
                                  role: 'cancel'
                                }]);
                                break;
                              case 'invalidSlot':
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-invalid-timing'), [   {
                                  text: this.translate.getFromKey('close'),
                                  role: 'cancel'
                                }]);
                                break;
                              case 'error':
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                                  text: this.translate.getFromKey('close'),
                                  role: 'cancel'
                                }]);
                                break;
                              default:
                                await this.toast.presentToast(this.translate.getFromKey('roster-update-success'), alertPosition, 'success', 2000);
                                this.fullCalendar.getApi().refetchEvents();
                                this.fullcalendarService.copiedSlots = [];
                            }

                          }, async error => {
                            this.isLoading = false;
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'
                            }]);
                          }
                      );

                    }
                  });

            }
          }
        ]
        , 'available-alert');
  }

  async fullcalendarClick(event: any) {
    if (!this.sharedView) {
      this.auth.userAuthorities$.pipe(take(1)).subscribe(
          async authorities => {

            const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

            const style = event.el.style;
            const timeOff = event.event.extendedProps.timeOff;

            if (style.opacity !== '0.5') {
              if (!timeOff) {
                this.fullcalendarService.selectedSlots.push(event);
              } else {
                this.fullcalendarService.selectedTimeOffSlots.push(event);
              }
              style.opacity = '0.5';
            } else {
              if (!timeOff) {
                this.fullcalendarService.selectedSlots = this.fullcalendarService.selectedSlots.filter(item => item.event.start.toUTCString() !== event.event.start.toUTCString());
              } else {
                this.fullcalendarService.selectedTimeOffSlots = this.fullcalendarService.selectedTimeOffSlots.filter(item => item.event.start.toUTCString() !== event.event.start.toUTCString());
              }
              style.opacity = '1';
            }

          }
      );
    } else {
      await this.fullcalendarService.showSlotInfo(event);
    }

  }


  nextRoster() {
    const rosters = this.fullcalendarService.rosters$.value;
    rosters.forEach(
        roster => {
          roster.getApi().next();
        }
    );
  }

  prevRoster() {
    const rosters = this.fullcalendarService.rosters$.value;
    rosters.forEach(
        roster => {
          roster.getApi().prev();
        }
    );
  }

  private setShareLink(): string {
    let link = 'https://provider.bookanapp.com/roster?';

    if (this.employeeId) {
      link = link + 'employeeId=' + this.employeeId;
    }

    if (this.employee && !this.employeeId) {
      link = link + 'employeeId=' + this.employee.id;
    }

    if (this.subdivisionId) {
      link = link + 'subdivisionId=' + this.subdivisionId;
    }

    return link;
  }


  async editRoster() {

    if (this.employee) {
      await this.rosterService.editRoster(this.employee);
    }

  }

  async shareRoster(name: string) {
    await this.rosterService.shareRoster(name, this.setShareLink());
  }

}
