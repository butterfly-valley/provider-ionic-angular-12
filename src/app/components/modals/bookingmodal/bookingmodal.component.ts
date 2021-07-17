import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {CalendarEvent} from '../../../services/search/search.service';
import {FormGroup} from '@angular/forms';
import {BookingForm} from '../../forms/booking/booking-form.service';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {Router} from '@angular/router';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {alertPosition, isIos, mobile, tablet} from '../../../app.component';
import {LoadingService} from '../../../services/loading/loading.service';
import {CountryCode, CountryCodesService} from '../../../services/arrays/countrycodes.service';
import {PlatformDetectionService} from '../../../services/platformdetection/platformdetection.service';
import {AppointmentService} from '../../../services/user/appointment.service';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {CustomerService} from '../../../services/user/customer.service';
import {catchError, distinctUntilChanged, take} from 'rxjs/operators';
import {Customer} from '../../../store/models/user.model';
import {CountryISO} from 'ngx-intl-tel-input';
import {IonDatetime} from '@ionic/angular';
import {SlotPickerComponent} from '../slot-picker/slot-picker.component';


@Component({
  selector: 'app-bookingmodal',
  templateUrl: './bookingmodal.component.html',
  styleUrls: ['./bookingmodal.component.scss'],
})
export class BookingmodalComponent implements OnInit, OnDestroy {
  @Input() calEvent: CalendarEvent;
  @Input() locale: string;
  @Input() start;
  @Input() end;
  @Input() scheduleId;
  @Input() scheduleName;
  @Input() fullCalendar;
  @Input() duration;
  @Input() simplified;
  @Input() freeSchedule;


  @ViewChild('submitBtn', {static: false}) submitBtn;
  @ViewChild('timePicker', {static: false}) timePicker: IonDatetime;


  calendarEvent: CalendarEvent;

  bookingForm: FormGroup;

  bookingSub$: Subscription;

  /* check missed fields*/
  formSubmitted = false;

  /*load available Services*/
  serviceMap: Map<number, Map<string, string>>[] = [];

  isLoading = false;
  mobile = mobile;
  tablet = tablet;

  loadServices$: Subscription;

  countryCodes: CountryCode[];

  pickedServices = false;
  pickedInterval = false;
  customerIsLoading = false;

  phoneInterfaceOptions  = {
    cssClass: 'wide-alert',
    header: this.translate.getFromKey('dial-code')
  };
  ownCustomer$ = new BehaviorSubject<Customer[]>(null);
  customerPicked = false;
  pickedCustomerAvatar;


  preferredCountries = [CountryISO.Portugal,
    CountryISO.Mozambique,
    CountryISO.UnitedKingdom,
    CountryISO.Spain,
    CountryISO.UnitedStates];

  constructor(public dateTimeUtil: DateTimeUtilService,
              private bookingFormService: BookingForm,
              private storage: LocalStorageService,
              private toastService: ToastService,
              private router: Router,
              public translate: LocalizationService,
              public auth: AuthService,
              private loading: LoadingService,
              private countryCodeService: CountryCodesService,
              private platformService: PlatformDetectionService,
              public appointmentService: AppointmentService,
              private fullcalendarService: FullcalendarService,
              private modalService: ModalService,
              private customerService: CustomerService) {
  }

  ngOnInit() {


    this.calendarEvent = {...this.calEvent['extendedProps']};
    const slots = [];
    if (!this.calendarEvent.noDuration) {
      this.calendarEvent.id = this.calEvent.id;
      slots.push(this.calendarEvent);
    }

    if (!this.appointmentService.additionalSlots$.value || this.appointmentService.additionalSlots$.value.length < 1 ) {
      this.appointmentService.additionalSlots$.next(slots);
    }


    this.bookingForm = this.bookingFormService.getBookingForm(this.calendarEvent.multipleSpots ? '1' :  null, name, this.setInitialStart(),
        this.calEvent, this.scheduleId, this.calendarEvent.slotDuration.toString(), this.setInitialDate());

    /*populate service map*/
    this.calendarEvent.serviceTypeMap.forEach(service => {
      const map: Map<number, Map<string, string>> = new Map();
      Object.keys(service).forEach(key => {
        const secondMap: Map<string, string> = new Map();
        Object.keys(service[key]).forEach(secondKey => {
          secondMap.set(secondKey, service[key][secondKey]);
        });
        map.set(Number(key), secondMap);
      });

      this.serviceMap.push(map);
    });

    this.countryCodes = this.countryCodeService.getCodes();

    this.bookingForm.get('client').valueChanges.subscribe(
        value => {
          if (!this.customerPicked) {
            this.searchCustomers(value, false);
          }
        }
    );


  }

  ngOnDestroy(): void {
    if (this.bookingSub$) {
      this.bookingSub$.unsubscribe();
    }

    if (this.loadServices$) {
      this.loadServices$.unsubscribe();
    }

    if (mobile && isIos && this.freeSchedule) {
      this.fullcalendarService.refetchSlots();
    }

    this.dismiss();

  }


  searchCustomers(searchTerm: string, nullify: boolean) {
    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
        authorities => {
          if ((authorities.includes('ROLE_PRO') || (authorities.includes('ROLE_BUSINESS') || (authorities.includes('ROLE_ENTERPRISE')) && (authorities.includes('PROVIDER'))) || authorities.includes('CUSTOMERS'))) {
            this.customerIsLoading = true;
            if (searchTerm && searchTerm.toString().length > 1 && !nullify) {
              this.bookingSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                  token => {
                    if (token) {
                      this.customerService.searchOwnCustomers(token, searchTerm, true).pipe(
                          catchError((err) => {
                            this.isLoading = false;
                            return throwError(err);
                          })).subscribe(
                          response => {
                            this.ownCustomer$.next(response as Customer[]);
                            this.customerIsLoading = false;
                          }, error => {
                            this.ownCustomer$.next(null);
                          }
                      );
                    } else {
                      this.customerIsLoading = false;
                      this.ownCustomer$.next(null);
                    }
                  }
              );
            } else {
              this.customerIsLoading = false;
              this.ownCustomer$.next(null);
            }

          }
        }
    );

  }

  /* dismiss current modal*/
  async dismiss() {
    await this.modalService.dismissBookingModal();
  }

  /*display event date and time*/
  showDateAndTime() {
    return this.dateTimeUtil.showUTCTime(this.locale, this.calEvent['extendedProps'].dateTime, this.calEvent['extendedProps'].slotDuration);
  }

  showDurationOfServce(duration: string) {
    return this.dateTimeUtil.timeConvert(+duration);
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  async onSubmitBooking() {
    this.formSubmitted = true;
    if (this.bookingForm.valid) {
      this.isLoading = true;


      if (this.serviceMap && this.serviceMap.length === 1 && !this.pickedInterval) {
        const services = this.bookingForm.controls.serviceTypes.value;
        if (!services || services.length === 0) {
          const service = this.serviceMap[0];
          // tslint:disable-next-line:max-line-length
          const serviceToPush = service.values().next().value.keys().next().value + '###' + service.values().next().value.values().next().value;
          services.push(serviceToPush);
          this.bookingForm.controls.serviceTypes.setValue(services);
        }
      }

      if (this.appointmentService.additionalSlots$.value.length > 1) {
        const additionalSlots = [];
        const additionalDateTimes = [];
        this.appointmentService.additionalSlots$.value.forEach(slot => {
          additionalSlots.push(slot.id);
          additionalDateTimes.push(slot.dateTime);
        });
        this.bookingForm.controls.additionalSlots.setValue(additionalSlots);
        this.bookingForm.controls.additionalDateTimes.setValue(additionalDateTimes);
      }

      this.bookingSub$ = this.auth.getCurrentToken().subscribe(token => {
            if (token) {
              if (token !== 'invalid_token') {
                this.appointmentService.sendBookingRequest(this.bookingForm.value, token).subscribe(result => {
                  this.processBooking(result, token);
                },  error => {
                  this.toastService.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);
                  this.isLoading = false;
                });
              } else {
                this.toastService.presentToast(this.translate.getFromKey('session-expired'), alertPosition, 'danger', 6000);
                this.isLoading = false;
              }
            }
          }, async error => {
            this.isLoading = false;
            await this.toastService.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);

          }
      );

    } else {
      await this.toastService.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
      return;
    }


  }


  private async processBooking(result: any, token) {
    this.bookingSub$.unsubscribe();
    this.isLoading = false;
    if (result.message) {
      switch (result.message) {
        case 'invalidInterval':
          await this.toastService.presentToast(this.translate.getFromKey('sched-invalid-interval'), alertPosition, 'danger', 6000);
          break;
        case 'noDuration':
          await this.toastService.presentToast(this.translate.getFromKey('sched-noDurationMessage'), alertPosition, 'danger', 6000);
          break;
        case 'chooseServiceOrDuration':
          await this.toastService.presentToast(this.translate.getFromKey('sched-book-choose-service'), alertPosition, 'danger', 6000);
          break;
        case 'optimisticException':
          await this.toastService.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger', 6000);
          break;
        case 'schedError':
          await this.toastService.presentToast(this.translate.getFromKey('sched-schedErrorMessage'), alertPosition, 'danger', 6000);
          break;
        case 'existingCustomer':
          await this.toastService.presentToast(this.translate.getFromKey('customer-existingCustomer'), alertPosition, 'warning', 3000);
          this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
              this.router.navigate(['/user/management/schedule']));
          await this.dismiss();
          break;
        case 'emailSentError':
          await this.toastService.presentToast(this.translate.getFromKey('sched-emailSentError'), alertPosition, 'warning', 3000);
          this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
              this.router.navigate(['/user/management/schedule']));
          await this.dismiss();
          break;
        case 'appExists':
          await this.toastService.presentToast(this.translate.getFromKey('sched-appExists'), alertPosition, 'danger', 6000);
          break;
        case 'appExists-time':
          await this.toastService.presentToast(this.translate.getFromKey('sched-appExists-time'), alertPosition, 'danger', 6000);
          break;
        case 'invalidSlot':
          await this.toastService.presentToast(this.translate.getFromKey('sched-invalid-timing'), alertPosition, 'danger', 6000);
          break;
        default:
          const message = result.message;
          if (message.includes('###')) {
            if (!this.fullCalendar) {
              this.fullcalendarService.refetchSlots();
            } else {
              this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
            }
            await this.toastService.presentToast(this.translate.getFromKey('sched-overbooked-message'), alertPosition, 'warning', 6000);
          } else {
            if (!this.fullCalendar) {
              this.fullcalendarService.refetchSlots();
            } else {
              this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
            }
            // update number of active bookings
            this.auth.userStats$.pipe(distinctUntilChanged(), take(1)).subscribe(
                userStats => {
                  if (userStats) {
                    userStats.appointments = (+userStats.appointments + 1).toString();
                    this.auth.userStats$.next(userStats);
                  }
                }
            );

            this.appointmentService.additionalSlots$.next(null);
            await this.toastService.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);
          }
          await this.dismiss();
      }
    } else {
      this.isLoading = false;
    }
  }

  cancelServicesorInterval(event: any) {
    this.pickedInterval = event.detail.value === 'pickedInterval';
    this.bookingForm.get('serviceTypes').setValue([]);

    if (this.pickedInterval) {
      this.bookingForm.get('time').reset();
      this.bookingForm.get('start').setValue(this.setInitialStart());
      this.bookingForm.get('end').setValue(this.setInitialEnd());
      this.bookingForm.get('serviceTypes').setValue([]);

    } else {
      this.bookingForm.get('time').setValue(this.setInitialStart());
      this.bookingForm.get('start').reset();
      this.bookingForm.get('end').reset();
    }


  }

  addService(event: CustomEvent) {
    const checked = event.detail.checked;
    const value = event.detail.value;
    const services = this.bookingForm.controls.serviceTypes.value;
    if (checked) {
      services.push(value);
    } else {
      services.splice(services.indexOf(value), 1);
    }
    this.bookingForm.controls.serviceTypes.setValue(services);
  }

  pickCustomer(id: string, name: string, avatar: string) {
    this.customerPicked = true;
    this.bookingForm.controls.client.setValue(name);
    this.bookingForm.controls.customerId.setValue(id);
    this.pickedCustomerAvatar = avatar;

  }

  deselectCustomer() {
    this.customerPicked = false;
    this.bookingForm.controls.client.reset();
    this.bookingForm.controls.customerId.reset();
    this.pickedCustomerAvatar = undefined;
  }


  updateNumberInput(control: any, ev: number) {
    control.setValue(ev);
  }

  async pickSlots() {
    let cssClass = '';
    if (!mobile) {
      cssClass = 'slot-picker-modal';
    }
    await this.modalService.openSlotPickerModal(SlotPickerComponent, this.calendarEvent.scheduleId, cssClass);

  }

  removeSlot(slot: any) {
    const currentSlots = this.appointmentService.additionalSlots$.value;
    this.appointmentService.additionalSlots$.next(currentSlots.filter(s => s.dateTime !== slot.dateTime));

  }


  setInitialStart() {
    const slotStart = this.calEvent.start.toISOString().split('T')[1];

    return {
      hour: +slotStart.split(':')[0],
      minute: +slotStart.split(':')[1]
    };

  }

  setInitialEnd() {
    const slotEnd = this.calEvent.end.toISOString().split('T')[1];

    return  {
      hour: +slotEnd.split(':')[0],
      minute: +slotEnd.split(':')[1]
    };

  }

  setInitialDate() {
    return this.calEvent.start.toISOString().split('T')[0];

  }


}
