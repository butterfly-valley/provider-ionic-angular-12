import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActionSheetController, IonDatetime} from "@ionic/angular";
import {CalendarEvent} from "../../../services/search/search.service";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {BehaviorSubject, Subscription, throwError} from "rxjs";
import {CountryCode, CountryCodesService} from "../../../services/arrays/countrycodes.service";
import {Customer} from "../../../store/models/user.model";
import {CountryISO} from "ngx-intl-tel-input";
import {DateTimeUtilService} from "../../../services/util/date-time-util.service";
import {BookingForm} from "../../forms/booking/booking-form.service";
import {LocalStorageService} from "../../../services/localstorage/local-storage.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {Router} from "@angular/router";
import {LocalizationService} from "../../../services/localization/localization.service";
import {AuthService} from "../../../services/auth/auth.service";
import {LoadingService} from "../../../services/loading/loading.service";
import {PlatformDetectionService} from "../../../services/platformdetection/platformdetection.service";
import {AppointmentService} from "../../../services/user/appointment.service";
import {FullcalendarService} from "../../../services/user/fullcalendar.service";
import {ModalService} from "../../../services/overlay/modal.service";
import {CustomerService} from "../../../services/user/customer.service";
import {catchError, distinctUntilChanged, take} from "rxjs/operators";
import {alertPosition, dateClass, mobile, tablet} from "../../../app.component";
import {PickedSchedule} from "../../../store/models/provider.model";
import {DateAdapter} from "@angular/material/core";

@Component({
  selector: 'app-multiple-bookings',
  templateUrl: './multiple-bookings.component.html',
  styleUrls: ['./multiple-bookings.component.scss'],
})
export class MultipleBookingsComponent implements OnInit, OnDestroy {

  @Input() locale: string;
  @Input() pickedSchedule: PickedSchedule;
  @Input() simplified;


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

  weekdays = [
    {
      name:  'MONDAY',
      checked: false
    },
    {
      name:  'TUESDAY',
      checked: false
    },
    {
      name:  'WEDNESDAY',
      checked: false
    },
    {
      name:  'THURSDAY',
      checked: false
    },
    {
      name:  'FRIDAY',
      checked: false
    },
    {
      name:  'SATURDAY',
      checked: false
    },
    {
      name:  'SUNDAY',
      checked: false
    },

  ];

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
              private customerService: CustomerService,
              private actionSheetController: ActionSheetController,
              private dateAdapter: DateAdapter<any>) {

    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  ngOnInit() {

    const multipleSpots = this.pickedSchedule.multipleSpots;

    if (multipleSpots) {
      this.bookingForm = this.bookingFormService.getMultipleBookingsForm('1', name, this.pickedSchedule.scheduleId);
    } else {
      this.bookingForm = this.bookingFormService.getMultipleBookingsForm(null, name, this.pickedSchedule.scheduleId);
    }

    /*populate service map*/
    // this.calendarEvent.serviceTypeMap.forEach(service => {
    //   const map: Map<number, Map<string, string>> = new Map();
    //   Object.keys(service).forEach(key => {
    //     const secondMap: Map<string, string> = new Map();
    //     Object.keys(service[key]).forEach(secondKey => {
    //       secondMap.set(secondKey, service[key][secondKey]);
    //     });
    //     map.set(Number(key), secondMap);
    //   });
    //
    //   this.serviceMap.push(map);
    // });

    this.countryCodes = this.countryCodeService.getCodes();

    this.bookingForm.valueChanges.subscribe(
        value => {
          if (value.time && value.serviceTypes && value.serviceTypes.length > 0) {
            this.pickedServices = true;
            this.pickedInterval = false;
          }

          if (value.start && value.end) {
            this.pickedServices = false;
            this.pickedInterval = true;
          }

        }
    );

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

    this.dismiss();
  }


  searchCustomers(searchTerm: string, nullify: boolean) {
    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
        authorities => {
          if (authorities.includes('ROLE_PRO')) {
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
    await this.modalService.dismissMultipleBookingsModal();
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

      this.bookingSub$ = this.auth.getCurrentToken().subscribe(token => {
            if (token) {
              if (token !== 'invalid_token') {
                this.appointmentService.sendIntervalBookingRequest(this.bookingForm.value, token).subscribe(result => {
                  this.processBooking(result, token);
                },  error => {
                  this.isLoading = false;
                  this.toastService.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);

                });
              } else {
                this.isLoading = false;
                this.toastService.presentToast(this.translate.getFromKey('session-expired'), alertPosition, 'danger', 6000);
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


  timePickerFormat() {
    if (this.locale === 'en') {
      return 'h:mm A';
    } else {
      return 'HH:mm';
    }
  }

  private async processBooking(result: any, token) {
    this.bookingSub$.unsubscribe();
    this.isLoading = false;
    switch (result.message) {
      case 'appExists-interval':
        await this.toastService.presentToast(this.translate.getFromKey('sched-appExists-interval'), alertPosition, 'danger', 6000);
        this.resetHour();
        break;
      case 'invalidInterval':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-invalid-interval'), alertPosition, 'danger', 6000);
        break;
      case 'invalidHour':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-choose-time-error'), alertPosition, 'danger', 6000);
        break;
      case 'noDuration':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-noDurationMessage'), alertPosition, 'danger', 6000);
        break;
      case 'chooseServiceOrDuration':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-book-choose-service'), alertPosition, 'danger', 6000);
        break;
      case 'optimisticException':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger', 6000);
        break;
      case 'schedError':
        this.resetHour();
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
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-appExists'), alertPosition, 'danger', 6000);
        break;
      case 'appExists-time':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-appExists-time'), alertPosition, 'danger', 6000);
        break;
      case 'invalidSlot':
        await this.toastService.presentToast(this.translate.getFromKey('multiple-slots-error'), alertPosition, 'danger', 6000);
        this.fullcalendarService.refetchSlots();
        this.updateStats();
        await this.dismiss();
        break;
      case 'invalidSchedule':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('sched-invalidSchedule'), alertPosition, 'danger', 6000);
        break;
      case 'invalidDays':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('app-dayAlert'), alertPosition, 'danger', 6000);
        break;
      case 'bindingError':
        this.resetHour();
        await this.toastService.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
        break;
      default:
        const message = result.message;
        if (message.includes('###')) {
          this.fullcalendarService.refetchSlots();
          await this.toastService.presentToast(this.translate.getFromKey('sched-overbooked-message'), alertPosition, 'warning', 6000);
        } else {
          this.fullcalendarService.refetchSlots();
        }
        // update number of active bookings
        this.updateStats();
        this.resetHour();


        await this.toastService.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);
        await this.dismiss();
    }
  }

  private updateStats() {
    this.auth.userStats$.pipe(distinctUntilChanged(), take(1)).subscribe(
        userStats => {
          if (userStats) {
            userStats.appointments = (+userStats.appointments + 1).toString();
            this.auth.userStats$.next(userStats);
          }
        }
    );
  }

  private resetHour() {
    this.bookingForm.controls.time.setValue(null);
  }

  cancelServicesorInterval(event: any) {
    this.pickedInterval = event.detail.value === 'pickedInterval';
    this.bookingForm.get('serviceTypes').setValue([]);
    this.bookingForm.get('time').reset();
    this.bookingForm.get('start').reset();
    this.bookingForm.get('end').reset();
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

  //handle day picking
  addWeekday(value, hours) {
    const control = this.bookingForm.controls.interval['controls'].days.controls.day as FormArray;
    this.pushToDayControl(control, value);
  }

  private pushToDayControl(control: FormArray, value) {
    control.push(
        new FormGroup({
          weekday: new FormControl(value),
        })
    );
  }

  deleteDay(i: number, weekday: string) {
    const control = this.bookingForm.controls.interval['controls'].days.controls.day as FormArray;
    const day = control.controls.filter(ctrl => ctrl.value.weekday === weekday)[0];
    control.removeAt(control.controls.indexOf(day));
  }



  pushWeekday(event: any, weekday: any, index: number) {
    const checked = event.detail.checked;
    if (checked) {
      this.addWeekday(weekday.name, null);
    } else {
      this.deleteDay(index, weekday.name)
    }
    this.weekdays.filter(day => day.name === weekday.name)[0].checked = checked;

  }


  dayScheduleControls(i: number) {
    const control = this.bookingForm.controls.interval['controls'].days.controls.day as FormArray;
    return control.controls[i]['controls'].schedule.name;

  }

  dateClass() {
    return dateClass();
  }
}
