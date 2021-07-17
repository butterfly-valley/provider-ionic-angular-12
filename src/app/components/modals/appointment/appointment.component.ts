import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {Appointment} from '../../../store/models/user.model';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {messageIcon} from '../../../pages/user/user.page';
import {LocalizationService} from '../../../services/localization/localization.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AppointmentService} from '../../../services/user/appointment.service';
import {MessageComponent} from '../message/message.component';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {AuthService} from '../../../services/auth/auth.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {faBan, faSms} from '@fortawesome/free-solid-svg-icons';
import {CountryCodesService} from '../../../services/arrays/countrycodes.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {DateAdapter} from '@angular/material/core';
import {Router} from '@angular/router';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {IconService} from '../../../services/util/icon.service';
import {distinctUntilChanged, take} from 'rxjs/operators';
import {AlertService} from '../../../services/overlay/alert.service';
import {CountryISO} from 'ngx-intl-tel-input';
import {EditCustomerComponent} from '../customer/edit-customer/edit-customer.component';




@Component({
    selector: 'app-appointment',
    templateUrl: './appointment.component.html',
    styleUrls: ['./appointment.component.scss'],
})
export class AppointmentComponent implements OnInit, OnDestroy {
    mobile = mobile;
    tablet = tablet;

    @Input() appointmentId: string;
    @Input() locale: string;
    @Input() history: boolean;
    @Input() appPage: boolean;
    @Input() scheduleId: string;
    @Input() start;
    @Input() end;
    @Input() fullcalendar: any;
    @Input() swipe;

    /*cancel appointment subscription*/
    cancelAppointmentSubscription$: Subscription;
    appointmentSub$: Subscription;
    editAppointmentSub$: Subscription;
    appointment$ = new BehaviorSubject<Appointment>(null);

    messageIcon = messageIcon;
    noShowIcon = faBan;
    smsIcon = faSms;
    editAppointmentForm: FormGroup;
    editDateTimeForm;
    formChanged = false;
    timeFormChanged = false;
    formSubmitted = false;
    @ViewChild('editSubmitBtn', {static: false}) editSubmitBtn;
    @ViewChild('editSlotBtn', {static: false}) editSlotBtn;
    editName = false;
    editPhone: boolean;
    editEmail: boolean;
    editNote: boolean;
    editTime: boolean;
    isLoading: boolean;
    countryCodes;

    preferredCountries = [CountryISO.Portugal,
        CountryISO.Mozambique,
        CountryISO.UnitedKingdom,
        CountryISO.Spain,
        CountryISO.UnitedStates];

    archiveAppSubscription$: Subscription;

    constructor(private modalService: ModalService,
                public translate: LocalizationService,
                private appointmentService: AppointmentService,
                public timeUtil: DateTimeUtilService,
                public auth: AuthService,
                private countryCodesService: CountryCodesService,
                private toast: ToastService,
                private dateAdapter: DateAdapter<any>,
                private router: Router,
                private fullcalendarService: FullcalendarService,
                public iconService: IconService,
                private alert: AlertService

    ) {
        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;
    }

    ngOnInit() {
        this.isLoading = true;
        this.appointmentSub$ = this.auth.getCurrentToken().subscribe(
            token => {
                this.isLoading = false;
                this.appointmentService.getAppointment(token, this.appointmentId).subscribe(
                    response => {
                        const appointment = response as Appointment;
                        this.appointment$.next(appointment);
                        this.setEditForm(appointment);
                        this.countryCodes = this.countryCodesService.getCodes();

                        this.editDateTimeForm = new FormGroup({
                                appointmentId: new FormControl(appointment.id, [Validators.required]),
                                date: new FormControl(undefined, [Validators.required]),
                                hour: new FormControl(undefined, [Validators.required])
                            }

                        );

                        this.editDateTimeForm.valueChanges.subscribe(
                            () => {
                                this.timeFormChanged = true;
                            }
                        );


                    }

                );
            }, error => {
                this.isLoading = false;
            }
        );



    }

    ngOnDestroy(): void {

        if (this.cancelAppointmentSubscription$) {
            this.cancelAppointmentSubscription$.unsubscribe();
        }

        if (this.editAppointmentSub$) {
            this.editAppointmentSub$.unsubscribe();
        }

        if (this.appointmentSub$) {
            this.appointmentSub$.unsubscribe();
        }

        if (this.archiveAppSubscription$) {
            this.archiveAppSubscription$.unsubscribe();
        }

        this.dismiss();

    }

    async dismiss() {
        await this.modalService.dismissAppointmentModal();
    }

    showModalTitle(appointment: Appointment) {
        return this.timeUtil.showLocalDateTime(this.locale, appointment.appointmentDate);
    }

    async cancel(id: string, dateTime: string) {
        this.appointmentService.cancel(dateTime, this.cancelAppointmentSubscription$, this.modalService, this.appPage, this.scheduleId, this.start, this.end, this.fullcalendar, id).then(
            sub => {
                this.cancelAppointmentSubscription$ = sub;
            }
        );
    }

    async sendMessage(appointmentId: string, dateTime: string) {
        let cssClass = '';
        if (!mobile)  {
            cssClass = 'message-modal';
        }
        const localDateTime = this.timeUtil.showLocalDateTime(this.translate.getLocale(), dateTime);
        await this.modalService.openMessageModal(MessageComponent, cssClass, undefined, localDateTime, +appointmentId, undefined,
            undefined, undefined, false, null, null, true);
    }

    async editFormSubmit() {
        if (this.editAppointmentForm.valid) {
            this.isLoading = true;

            if (this.editAppointmentForm.controls.internationalPhone.value && !this.editAppointmentForm.controls.internationalPhone.value['dialCode']) {
                this.editAppointmentForm.controls.internationalPhone.setValue(null);
            }

            this.editAppointmentSub$ = this.auth.getCurrentToken().subscribe(
                token => {
                    if (token) {
                        this.appointmentService.editAppointment(token, this.editAppointmentForm.value).subscribe(
                            async response => {
                                if (response['id']) {
                                    const appointment = response as Appointment;
                                    this.editDateTimeForm = new FormGroup({
                                            appointmentId: new FormControl(appointment.id, [Validators.required]),
                                            date: new FormControl(undefined, [Validators.required]),
                                            hour: new FormControl(undefined, [Validators.required])
                                        }

                                    );
                                    this.editName = false;
                                    this.editEmail = false;
                                    this.editNote = false;
                                    this.editPhone = false;
                                    this.setEditForm(appointment);
                                    this.editAppointmentForm.controls.internationalPhone.setValue(null);
                                    this.appointment$.next(appointment);
                                    this.formChanged = false;
                                    this.isLoading = false;
                                    await this.toast.presentToast(this.translate.getFromKey('app-updated-success'), alertPosition, 'success' , 1000);

                                    if (!this.fullcalendar) {
                                        this.fullcalendarService.refetchSlots();
                                    } else {
                                        this.fullcalendarService.refetchSlotsForCalender(this.fullcalendar);
                                    }

                                } else {
                                    this.isLoading = false;
                                    switch (response['message']) {
                                        case 'app-invalidApp':
                                            await this.toast.presentToast(this.translate.getFromKey('app-invalidApp'), alertPosition, 'danger', 4000);
                                            break;
                                        case 'bindingError':
                                            await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger', 4000);
                                            break;
                                        case 'updateAppointmentError':
                                            await this.toast.presentToast(this.translate.getFromKey('sched-updateAppointmentError'), alertPosition, 'danger', 4000);
                                            break;

                                    }

                                }
                            }, async error => {
                                await this.toast.presentToast(this.translate.getFromKey('sched-updateAppointmentError'), alertPosition, 'danger', 4000);
                                this.isLoading = false;
                            }
                        );

                    } else {
                        this.isLoading = false;
                    }
                }, async error => {
                    await this.toast.presentToast(this.translate.getFromKey('sched-updateAppointmentError'), alertPosition, 'danger', 4000);
                    this.isLoading = false;
                }
            );
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }
    }

    async editTimeFormSubmit() {
        this.auth.userAuthorities$.pipe(take(1)).subscribe(
            async authorities => {
                if (!authorities.includes('SUBPROVIDER_SCHED_VIEW')) {
                    this.formSubmitted = true;
                    if (this.editDateTimeForm.valid) {
                        this.isLoading = true;
                        this.editAppointmentSub$ = this.auth.getCurrentToken().subscribe(
                            token => {
                                this.isLoading = false;
                                if (token) {
                                    const parsedDate = new Date(Date.parse(this.editDateTimeForm.controls.date.value));
                                    const date = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString();
                                    this.editDateTimeForm.controls.date.setValue(date);
                                    this.appointmentService.editAppointmentTime(token, this.editDateTimeForm.value).subscribe(
                                        async response => {
                                            if (response['id']) {
                                                if (this.appPage) {
                                                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                                        this.router.navigate(['/user/management/appointments']));
                                                } else if (this.scheduleId) {
                                                    if (!this.fullcalendar) {
                                                        this.fullcalendarService.refetchSlots();
                                                    } else {
                                                        this.fullcalendarService.refetchSlotsForCalender(this.fullcalendar);
                                                    }
                                                }
                                                await this.dismiss();
                                                await this.modalService.dismissAppSummaryModal();
                                                await this.toast.presentToast(this.translate.getFromKey('app-updated-success'), alertPosition, 'success', 1000);

                                            } else {
                                                switch (response['message']) {
                                                    case 'app-invalidApp':
                                                        await this.toast.presentToast(this.translate.getFromKey('app-invalidApp'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'appExists-time':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-appExists-time'), alertPosition, 'danger', 6000);
                                                                                                   break;
                                                    case 'bindingError':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'optimisticException':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'rebookGenericError':
                                                        await this.toast.presentToast(this.translate.getFromKey('app-rebookErrorMessage'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'appExists':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-appExists'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'invalidDate':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-invalidDate'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'invalidSlot':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-invalidTiming'), alertPosition, 'danger', 4000);
                                                        break;
                                                    case 'invalidTime':
                                                        await this.toast.presentToast(this.translate.getFromKey('sched-invalidTime'), alertPosition, 'danger', 4000);
                                                        break;
                                                }

                                            }
                                        }
                                    );

                                } else {
                                    this.isLoading = false;
                                }
                            }, async error => {
                                this.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('app-rebookErrorMessage'), alertPosition, 'danger', 4000);
                            }
                        );
                    } else {
                        await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 4000);
                        return;
                    }
                }
            });

    }

    submitEditForm() {
        const button: HTMLElement = this.editSubmitBtn.nativeElement;
        button.click();
    }

    submitEditSlotForm() {
        const button: HTMLElement = this.editSlotBtn.nativeElement;
        button.click();
    }

    editField(field: string) {
        if (field === 'name') {
            this.editName = true;
        }

        if (field === 'phone') {
            this.editPhone = true;
        }

        if (field === 'email') {
            this.editEmail = true;
        }

        if (field === 'note') {
            this.editNote = true;
        }

        if (field === 'time') {
            this.editTime = true;
        }
    }

    private setEditForm(appointment: Appointment) {
        let phone = null;
        // if (appointment.phone) {
        //     phone = '+' + appointment.phone.replace(/\s/g, '');
        // }
        this.editAppointmentForm = new FormGroup({
                appointmentId: new FormControl(appointment.id, [Validators.required]),
                customer_name: new FormControl(appointment.name, [Validators.minLength(3), Validators.maxLength(50)]),
                remark: new FormControl(appointment.providerRemark, [Validators.minLength(3), Validators.maxLength(255)]),
                sendSms: new FormControl(appointment.sendSms),
                smsSent: new FormControl(appointment.smsSent),
                noShow: new FormControl(appointment.noShow),
                customer_email: new FormControl(appointment.email, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
                internationalPhone: new FormControl(phone)
            }
        );
        this.editAppointmentForm.valueChanges.subscribe(
            () => {
                this.formChanged = true;
            }
        );
    }

    timePickerFormat() {
        if (this.translate.getLocale() === 'en') {
            return 'h:mm A';
        } else {
            return 'HH:mm';
        }
    }

    async archive(appointmentId) {
        await this.alert.presentAlert(
            this.translate.getFromKey('archive-sure'),
            null,
            null,
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('archive'),
                    handler: () => {
                        this.isLoading = true;
                        this.archiveAppSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {

                                    const idsToArchive = [];
                                    idsToArchive.push(appointmentId);

                                    this.appointmentService.archiveAppointments(token, idsToArchive).subscribe(
                                        async response => {
                                            this.isLoading = false;
                                            switch (response['message']) {
                                                case 'archiveAppointmentError':
                                                    await this.toast.presentToast(this.translate.getFromKey('archiveAppointmentError'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'invalidApp':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-invalidApp'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'bindingError':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 4000);
                                                    break;
                                                default:
                                                    await this.toast.presentToast(this.translate.getFromKey('archiveAppointmentSuccess'), alertPosition, 'success', 1000);
                                                    await this.dismiss();

                                            }
                                        }
                                    );

                                }
                            });
                    }
                }

            ]
        );

    }

    async openCustomer(providerCustomer: string) {
        let css = '';
        if (!this.mobile || this.tablet) {
            css = 'customer-modal'
        }
       await this.modalService.openEditCustomerModal(EditCustomerComponent, css, providerCustomer, false, undefined);
    }
}
