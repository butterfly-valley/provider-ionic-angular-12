import {Injectable} from '@angular/core';
import ptLocale from '@fullcalendar/core/locales/pt';
import ruLocale from '@fullcalendar/core/locales/ru';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {BASE_URL, mobile, tablet} from '../../app.component';
import {LocalizationService} from '../localization/localization.service';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {LocalStorageService} from '../localstorage/local-storage.service';
import {PopoverController} from '@ionic/angular';
import {BehaviorSubject} from 'rxjs';
import {delay, distinctUntilChanged, take} from 'rxjs/operators';
import {DateTimeUtilService} from '../util/date-time-util.service';
import {AuthService} from '../auth/auth.service';
import {InfoComponent} from '../../components/popover/info/info.component';
import {AlertService} from '../overlay/alert.service';

@Injectable({
  providedIn: 'root'
})
export class FullcalendarService {
  mobile = mobile;
  tablet = tablet;
  BASE_URL = 'http://localhost:8086' + '/provider/schedule';
  ROSTER_BASE_URL = 'http://localhost:8087' + '/employee/roster';
  AUTH_HEADER = 'Bearer ';

  startDate: Date;
  endDate: Date;

  scheduleIsLoading = false;

  multipleFullcalendars: FullCalendarComponent[] = [];
  fullCalendar$ = new BehaviorSubject<FullCalendarComponent>(null);

  preferredStart;
  preferredEnd;
  preferredSlotDuration;
  preferredView;
  calendarEvents: any[];
  slotsLoading = false;
  freeSchedule: boolean;

  next$ = new BehaviorSubject<number>(0);
  previous$ = new BehaviorSubject<number>(0);
  group$ = new BehaviorSubject<boolean>(false);
  rosters$ = new BehaviorSubject<FullCalendarComponent[]>([]);
  enteredRosterPage = false;
  rosterView$ = new BehaviorSubject<string>(null);
  selectedSlots = [];
  selectedTimeOffSlots = [];
  copiedSlots = [];


  constructor(private http: HttpClient,
              private translate: LocalizationService,
              private localStorage: LocalStorageService,
              private popController: PopoverController,
              private auth: AuthService,
              private popoverController: PopoverController,
              private dateTimeUtil: DateTimeUtilService,
              private alert: AlertService) {}

  fetchEvents(start: Date, end: Date, token: string, scheduleId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const date = new Date();
    return this.http.get<any[]>(this.BASE_URL + '/view/slotless/schedule.json?scheduleId=' + scheduleId
        + '&start=' + start.toISOString() + '&end=' + end.toISOString()
        + '&offset=' + date.getTimezoneOffset(), {headers: tokenHeaders});
  }

  fetchAllRosters(start: Date, end: Date, token: string, employeeId?: string, all?: boolean, subdivisionId?: string, divisionId?: string, showTimeOff?: boolean) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const date = new Date();
    let params = new HttpParams();
    params = params.append('start', start.toISOString());
    params = params.append('end', end.toISOString());
    params = params.append('offset', date.getTimezoneOffset().toString());

    if (employeeId) {
      params = params.append('employeeId', String(employeeId));
    }
    if (subdivisionId) {
      params = params.append('subdivisionId', String(subdivisionId));
    }
    if (divisionId) {
      params = params.append('divisionId', String(divisionId));
    }
    if (all) {
      params = params.append('all', 'true');
    }
    if (showTimeOff) {
      params = params.append('showTimeOff', 'true');
    }
    return this.http.get<any[]>( this.ROSTER_BASE_URL + '/display', {headers: tokenHeaders, params: params});
  }

  fetchAnonymousRoster(start: Date, end: Date, employeeId?, subdivisionId?, divisionId?) {
    const date = new Date();
    let params = new HttpParams();
    params = params.append('start', start.toISOString());
    params = params.append('end', end.toISOString());
    params = params.append('offset', date.getTimezoneOffset().toString());

    if (employeeId) {
      params = params.append('employeeId', String(employeeId));
    }
    if (subdivisionId) {
      params = params.append('subdivisionId', String(subdivisionId));
    }
    if (divisionId) {
      params = params.append('divisionId', String(divisionId));
    }

    return this.http.get<any[]>( 'http://localhost:8087/roster/display', {params: params});
  }



  populateEvents(fetchInfo: any, successCallback: any, scheduleId: string) {
    this.slotsLoading = true;
    // tslint:disable-next-line:no-shadowed-variable
    this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).pipe(delay(100)).subscribe(async token => {
      if (token) {
        this.fetchEvents(fetchInfo.start, fetchInfo.end, token, scheduleId).subscribe(events => {
              if (events) {
                events.forEach(
                    event => {
                      const description = this.showAppointmentDetails(event);
                      this.eventBeforeMount(event, description, this.translate.getFromKey('sched-available'), this.translate.getFromKey('sched-unavailable-book'));
                    }
                );
                successCallback(events);
                this.slotsLoading = false;
              }
              this.slotsLoading = false;
            }, async error => {
              this.slotsLoading = false;
              await  this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('schedule-load-error'), [this.translate.getFromKey('close')]);
            }
        );
      }
    });
  }

  populateRoster(fetchInfo: any, successCallback: any, employeeId?: string, all?: boolean, subdivisionId?: string, divisionId?: string, showTimeOff?: boolean) {
    this.slotsLoading = true;
    // tslint:disable-next-line:no-shadowed-variable
    this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).pipe(delay(100)).subscribe(async token => {
      if (token) {
        this.fetchAllRosters(fetchInfo.start, fetchInfo.end, token, employeeId, all, subdivisionId, divisionId, showTimeOff).subscribe(events => {
              if (events) {
                events.forEach(
                    event => {
                      this.rosterBeforeMount(event);
                    }
                );
                successCallback(events);
              }
              this.slotsLoading = false;

            }, async error => {
              this.slotsLoading = false;
              await  this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('schedule-load-error'), [this.translate.getFromKey('close')]);
            }
        );
      }
    });
  }

  populateAnonymousRoster(fetchInfo: any, successCallback: any, employeeId?: string, all?: boolean, subdivisionId?: string, divisionId?: string) {
    this.slotsLoading = true;
    // tslint:disable-next-line:no-shadowed-variable
    this.fetchAnonymousRoster(fetchInfo.start, fetchInfo.end, employeeId).subscribe(events => {
          if (events) {
            events.forEach(
                event => {
                  // const description = this.showRosterDetails(event);
                  this.rosterBeforeMount(event);
                }
            );
            successCallback(events);
            this.slotsLoading = false;
          }
          this.slotsLoading = false;
        }
    );
  }

  setEventContent(arg: any) {
    let arrayOfDomNodes = [];
    const locale = this.translate.getLocale();
    // title event
    const timeEvent = document.createElement('div');
    const range = arg.event._instance.range;

    if (!arg.event.extendedProps.timeOff) {
      timeEvent.innerHTML = this.dateTimeUtil.showLocalTimeFromDate(locale, range.start) + ' - ' + this.dateTimeUtil.showLocalTimeFromDate(locale, range.end);
    } else {
      timeEvent.innerHTML = this.translate.getFromKey('time-off');
    }
    // @ts-ignore
    timeEvent.classList = 'fc-event-time';

    const titleEvent = document.createElement('div');
    if (arg.event._def.title) {

      titleEvent.innerHTML = arg.event._def.title;
      // @ts-ignore
      titleEvent.classList = 'fc-event-title';
    }

    arrayOfDomNodes = [timeEvent, titleEvent ];

    return arrayOfDomNodes;
  }


  eventBeforeMount(event: any, description: string, availableSlot: string, unavailable: string) {
    event.slotDuration = event.duration;

    const multipleSpots = event.multipleSpots;
    const spotsLeft = event.spotsLeft;
    if (event.title === 'hasBooking') {
      event.title = description;
      event.color = 'var(--ion-color-secondary)';
      event.available = 'hasBooking';
    } else if (event.title === 'true' && !multipleSpots) {
      event.title = availableSlot;
      event.color = 'var(--ion-color-success)';
      event.available = 'true';
    } else if (event.title === 'true' && multipleSpots) {
      event.title = description;
      event.color = 'var(--ion-color-success)';
      event.available = 'true';
    } else if (multipleSpots && spotsLeft === 0) {
      event.title = description;
      event.color = 'var(--ion-color-secondary)';
      event.available = 'hasBooking';
    } else  {
      event.title = unavailable;
      event.color = 'var(--ion-color-danger)';
      event.available = 'false';
    }
  }

  rosterBeforeMount(event: any) {
    const color = event.slotColor;
    event.time = '';
    if (color) {
      event.color = color;
    } else {
      event.color = 'var(--ion-color-success)';

    }

    if (event.timeOff) {

      if (this.dateTimeUtil.dateIsBeforeToday(event.start)) {
        event.today = false;
      } else {
        event.today = true;
      }


    }

    event.title = this.showRosterDetails(event);

  }


  rosterAfterMount(el: any, today: Date, showTimeOff?: boolean) {
    const container = el.el;
    container.style.color = 'white';

    if (showTimeOff) {
      const props = el.event._def.extendedProps;
      const denied = props.denied;
      const approved = props.approved;


      if (props.today) {

        if (denied) {
          container.style.background = 'var(--ion-color-danger)';
        }

        if (approved) {
          container.style.background = 'var(--ion-color-success)';
        }

        if (!denied && !approved) {
          container.style.background = 'var(--ion-color-warning)';
        }
      } else {
        container.style.background = 'gray';
      }


    } else {
      const color = el.event.extendedProps.slotColor;
      if (!color) {
        container.style.backgroundColor = 'var(--ion-color-success)';
        if (el.event.start < today) {
          container.style.background = 'var(--ion-color-dark)';
          container.style.opacity = '0.5';
        }
      } else {
        container.style.background = color;
      }

    }
    // container.style.color = 'white';

  }



  eventsAfterMount(el: any, today: Date) {
    const event = el.event.extendedProps;
    const container = el.el;
    container.style.color = 'white';

    const available = event.available;
    const multipleSpots = event.multipleSpots;
    const spotsLeft = event.spotsLeft;
    if (available === 'hasBooking') {
      container.style.backgroundColor = 'var(--ion-color-secondary)';
    } else if (available === 'true' && !multipleSpots) {
      container.style.backgroundColor = 'var(--ion-color-success)';
      if  (el.event.start < today) {
        container.style.background = 'var(--ion-color-dark)';
        container.style.opacity = '0.5';
      }
    } else if (available === 'true' && multipleSpots) {
      container.style.backgroundColor = 'var(--ion-color-success)';
      if  (el.event.start < today) {
        container.style.background = 'var(--ion-color-dark)';
        container.style.opacity = '0.5';
      }
    } else if (multipleSpots && spotsLeft === 0) {
      container.style.backgroundColor = 'var(--ion-color-secondary)';
    } else if (available === 'false') {
      container.style.backgroundColor = 'var(--ion-color-danger)';
      if  (el.event.start < today) {
        container.style.background = 'var(--ion-color-dark)';
        container.style.opacity = '0.5';
      }
    } else {
      container.style.backgroundColor = 'var(--ion-color-primary)';
      if  (el.event.start < today) {
        container.style.background = 'var(--ion-color-dark)';
        container.style.opacity = '0.5';
      }
    }

    container.style.color = 'white';
  }


  showDescription(data: any, showTime?: string) {
    const codedDescription = data.description;
    let bookedServices = '';
    if (data.bookedServices) {
      bookedServices = ' |  ' + data.bookedServices;
    }
    let description = '';

    if (showTime) {
      description = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + showTime + '</p>';
    }

    let booked = '';
    const appointments = data.multipleSpotInfo;
    if (appointments && appointments.length > 0) {
      booked = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + this.translate.getFromKey('pricing-2') + ': ' + appointments.length + '</p>';
    }

    description = description + booked;

    if (codedDescription && codedDescription.includes('###')) {
      const decodedDescription = codedDescription.split('###');
      if (decodedDescription[0] !== 'my-client') {
        description = description +  '<div style="display: flex; align-items: center; width: 100%; justify-content: center">' +
            '<img style="margin-right: 3px; vertical-align: middle; border-radius: 50%!important;height: 20px; width: 20px; object-fit: cover;" src="/assets/logo/ios-logo.png">' + '  '
            + '<span class="long-text">' + codedDescription.split('###')[1] + bookedServices + '</span></div>';
      } else {
        description = description +   '<div style="display: flex; align-items: center; justify-content: center" class="long-text">' + codedDescription.split('###')[1] + bookedServices + '</div>';
      }
    }
    // else {
    //   // description = description + '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + this.translate.getFromKey(codedDescription) + '</p>';
    // }

    let numberOfSpots;
    const calNumberOfSpotsLeft = data.spotsLeft;
    const calNumberOfSpots = data.numberOfSpots;
    const multipleSpots = data.multipleSpots;

    if (multipleSpots) {
      if (description !== null) {
        description = description + this.translate.getFromKey('sched-total-spots') + ': ' + calNumberOfSpots;
      } else {
        description = this.translate.getFromKey('sched-total-spots') + ': ' + calNumberOfSpots;
      }

      numberOfSpots = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + this.translate.getFromKey('sched-available') + ': ' + calNumberOfSpotsLeft + '</p>';
    } else {
      numberOfSpots = '';
    }


    return description + numberOfSpots;
  }

  showRemark(data: any) {
    let remark = '';
    if (data.remark) {
      remark = '<i class="long-text">' + this.translate.getFromKey('sched-remark') + ': ' + data.remark + '</i>';
    }

    return remark;
  }

  showRestriction(data: any) {
    let restriction = '';
    if (data.restriction) {
      restriction = '<div>' + this.translate.getFromKey('provider-restriction') + ': ' + data.restriction + '</div>';
    }

    return restriction;
  }

  showDuration(data: any, today: Date) {
    let duration = '';


    const shortHourMessage = this.translate.getFromKey('hour-short');
    const shortMinuteMessage = this.translate.getFromKey('minute-short');

    if ((data.duration !== null || data.slotDuration !== null) && (data.title === 'true' || data.title === 'hasBooking')) {
      let hourAndMinutes;
      let eventDuration = data.duration;

      if (!eventDuration) {
        eventDuration = data.slotDuration;
      }

      if (eventDuration < 60) {
        hourAndMinutes = eventDuration + shortMinuteMessage;
      } else {
        const hours = (eventDuration / 60);
        const rhours = Math.floor(hours);
        const minutes = (hours - rhours) * 60;
        const rminutes = Math.round(minutes);
        if (rminutes === 0) {
          hourAndMinutes = rhours + shortHourMessage;
        } else {
          hourAndMinutes = rhours + shortHourMessage + rminutes + shortMinuteMessage;
        }
      }
      if (data.title === 'hasBooking') {
        duration = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + this.translate.getFromKey('duration') + ': ' + hourAndMinutes + '</p>';
      } else if (data.start > today) {
        duration = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + this.translate.getFromKey('provider-available-minutes') + ': ' + hourAndMinutes + '</p>';
      }
    }

    return duration;
  }


  showAppointmentDetails(calEvent: any, time?: string) {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const description = this.showDescription(calEvent, time);
    const remark = this.showRemark(calEvent);
    return description + this.showDuration(calEvent, today) + remark + this.showRestriction(calEvent);
  }

  showRosterDetails(data: any, showTooltip?: boolean) {
    let description = '';
    const locale = this.translate.getLocale();

    if (!data.timeOff) {
      let published = '';
      if (!data.published && !showTooltip) {
        published = '<ion-icon style="height: 18px; width: 18px; color: var(--ion-color-warning)!important" name="alert-circle-outline"></ion-icon>';
      }
      let start = this.dateTimeUtil.showLocalTimeFromDateString(locale, data.start);
      let end = this.dateTimeUtil.showLocalTimeFromDateString(locale, data.end);

      if (showTooltip) {
        start = this.dateTimeUtil.showLocalTimeFromIsoDateString(locale, data.start.toISOString());
        end = this.dateTimeUtil.showLocalTimeFromIsoDateString(locale, data.end.toISOString());

      }
      description = '<p style=" margin-bottom: 0!important;font-size: 1em!important;" class="align-content">' + published + start + '</p>' + '-' +
          '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + end + '</p>';


      if (!data.published && showTooltip) {
        description = description + '<p class="info-div" style="color: var(--ion-color-warning)"><ion-icon name="alert-circle-outline"></ion-icon>' + '<b>' + this.translate.getFromKey('roster-unpublished') + '</b>' + '</p>';
      }
    }

    // if (data.name) {
    //   description = '<p style=" margin-bottom: 0!important;font-size: 1em!important;">' + data.name + '</p>';
    // }

    if (data.halfDay && data.timeOff) {
      description = description + '<p style=" margin-bottom: 0!important;font-size: 1em!important;">'  + this.translate.getFromKey('half-day') + '</p>';
    }

    if (!data.approved && data.timeOff && !data.denied) {
      description = description + '<p class="info-div" style="color: white"><ion-icon name="alert-outline"></ion-icon>' + '<b>' + this.translate.getFromKey('to-approve') + '</b>' + '</p>';
    }

    if (!data.approved && data.timeOff && data.denied) {
      description = description + '<p class="info-div" style="color: white"><ion-icon name="alert-circle-outline"></ion-icon>' + '<b>' + this.translate.getFromKey('denied') + '</b>' + '</p>';
    }

    if (data.approved && data.timeOff) {
      description = description + '<p class="info-div" style="color: white"><ion-icon name="checkmark-outline"></ion-icon><b>' + this.translate.getFromKey('approved') + '</b>' + '</p>';
    }

    if (data.note) {
      description = description + '<p class="info-div"><ion-icon name="information-circle"></ion-icon>' + '<i>' + data.note + '</i>' + '</p>';
    }


    return description;
  }




  /*set fullcalendar locale based on current one*/
  getFullcalendarLocale(translate: any) {
    if (translate.getLocale() === 'pt-PT') {
      return ptLocale;
    }

    if (translate.getLocale() === 'ru-RU') {
      return ruLocale;
    }
  }

  /*format event based on locale*/

  eventTimeFormat() {
    if (this.translate.getLocale() === 'en-US') {
      return {
        hour: '2-digit',
        minute: '2-digit',
        omitZeroMinute: false,
        meridiem: 'narrow'
      };
    } else {
      return {
        hour: '2-digit',
        minute: '2-digit',
        omitZeroMinute: false,
        meridiem: false
      };
    }
  }

  createTooltip(ev: any, roster?: boolean) {
    // create tooltip
    const calEvent = ev.event;
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    if (!calEvent.extendedProps.timeOff) {
      const listTitle = ev.el.getElementsByClassName('fc-list-item-title').item(0);
      if (calEvent.title !== 'closed' && !listTitle) {
        const tooltipSpan = document.createElement('SPAN');
        const parsedEvent = JSON.parse(JSON.stringify(calEvent.extendedProps));
        parsedEvent.title = calEvent.extendedProps.available;
        const locale = this.translate.getLocale();
        const time = this.dateTimeUtil.showLocalTimeFromDate(locale, calEvent.start) + ' - ' + this.dateTimeUtil.showLocalTimeFromDate(locale, calEvent.end);
        if (!roster) {
          tooltipSpan.innerHTML = this.showAppointmentDetails(parsedEvent, time);
        } else {
          tooltipSpan.innerHTML = this.showRosterDetails(calEvent, true);
        }
        tooltipSpan.classList.add('tooltip-span');
        tooltipSpan.classList.add('align-content');
        tooltipSpan.style.cssText = 'padding: 5px;background:#4A5472;position:absolute;z-index:10001; text-align: center; color: white; display: flex; flex-direction: column';
        document.body.appendChild(tooltipSpan);

        // tslint:disable-next-line:only-arrow-functions
        window.onmousemove = function (e) {
          tooltipSpan.style.top = e.pageY + 25 + 'px';
          tooltipSpan.style.left = e.pageX - 100 + 'px';
        };
      }
    }
  }

  onSelectSlot(arg: any) {
    return {
      start: this.dateTimeUtil.convertDateToStringUTC(arg.start),
      duration: this.dateTimeUtil.getDuration(arg.start, arg.end),
      dateTime: this.dateTimeUtil.convertDateToString(arg.start)
    };
  }


  refetchSlots() {
    this.fullCalendar$.subscribe(
        fullcalendar => {
          this.refetchSlotsForCalender(fullcalendar);
        }
    );
  }



  refetchSlotsForCalender(fullcalendar: FullCalendarComponent) {
    if (fullcalendar) {
      fullcalendar.getApi().refetchEvents();
    }
  }

  modifyRosterSlot(token: string, slotForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.ROSTER_BASE_URL + '/update/slot', slotForm, { headers: tokenHeaders});
  }

  deleteRosterSlot(token: string, slotForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.ROSTER_BASE_URL + '/delete/slot', slotForm, { headers: tokenHeaders});
  }

  async showSlotInfo(event: any) {
    let cssClass = 'calendar-popover';
    if (mobile && !tablet) {
      cssClass = 'calendar-popover-mobile';
    }

    const locale = this.translate.getLocale();
    const time = this.dateTimeUtil.showLocalTimeFromDate(locale, event.event.start) + ' - ' + this.dateTimeUtil.showLocalTimeFromDate(locale, event.event.end);
    const slotProps = event.event.extendedProps;

    let slotInfo = '<b style="color: var(--ion-color-dark);!important;">' + time + '</b>';

    if (slotProps.name) {
      slotInfo = slotInfo + '<p>' + slotProps.name + '</p>';
    }

    if (!slotProps.published) {
      slotInfo = slotInfo + '<p class="info-div" style="color: var(--ion-color-danger)"><ion-icon name="alert-circle-outline"></ion-icon>' + '<b>' + this.translate.getFromKey('roster-unpublished') + '</b>' + '</p>';
    }

    if (slotProps.note) {
      slotInfo = slotInfo + '<p class="align-content"><ion-icon name="information-circle-outline" color="primary"></ion-icon><i style="color: var(--ion-color-primary)">' + slotProps.note + '</i></p>';
    }

    const popover = await this.popoverController.create({
      component: InfoComponent,
      translucent: true,
      cssClass,
      mode: 'ios',
      event: event.jsEvent,
      componentProps: {
        info: slotInfo
      }
    });
    return await popover.present();

  }


  pasteSlot(token: string, pasteSlotForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.ROSTER_BASE_URL + '/paste/slot', pasteSlotForm, { headers: tokenHeaders});
  }

  approveTimeOff(token: string, slotForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.ROSTER_BASE_URL + '/approve/time-off', {idsToDelete: slotForm}, { headers: tokenHeaders});
  }

  denyTimeOff(token: string, slotForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.ROSTER_BASE_URL + '/deny/time-off', {idsToDelete: slotForm}, { headers: tokenHeaders});
  }
}
