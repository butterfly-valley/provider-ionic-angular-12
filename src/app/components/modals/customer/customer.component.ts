import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../../services/auth/auth.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {Customer} from '../../../store/models/user.model';
import {faAd, faUserSlash} from '@fortawesome/free-solid-svg-icons';
import {CustomerService} from '../../../services/user/customer.service';
import {catchError, distinctUntilChanged} from 'rxjs/operators';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {CountryISO} from 'ngx-intl-tel-input';
import {DateAdapter} from "@angular/material/core";
import {DateTimeUtilService} from "../../../services/util/date-time-util.service";
import {AppointmentComponent} from "../appointment/appointment.component";
import {scheduleIcon} from "../../../pages/user/user.page";
import {AlertService} from "../../../services/overlay/alert.service";
import {Router} from "@angular/router";
import {IconService} from "../../../services/util/icon.service";
import {CampaignComponent} from "./campaign/campaign.component";
import {ImageComponent} from "../image/image.component";
import {EditImageComponent} from "../edit-image/edit-image.component";
import {LoadingService} from '../../../services/loading/loading.service';


@Component({
    selector: 'app-customer',
    templateUrl: './customer.component.html',
    styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent implements OnInit, OnDestroy {

    mobile = mobile;
    tablet = tablet;

    @Input() id: string;
    @Input() bookanapp: boolean;

    totalAppointments$ = new BehaviorSubject<any>(undefined);
    loadCustomerSub$: Subscription;
    editCustomerSub$: Subscription;
    editCustomerImage$: Subscription;
    loadingError;

    @ViewChild('imagePicker', {static: false}) imagePicker: any;
    @ViewChild('GDPRPicker', {static: false}) GDPRPicker: any;
    @ViewChild('editSubmitBtn', {static: false}) editSubmitBtn;

    preferredCountries = [CountryISO.Portugal,
        CountryISO.Mozambique,
        CountryISO.UnitedKingdom,
        CountryISO.Spain,
        CountryISO.UnitedStates];
    appointments$ = new BehaviorSubject<any>(undefined);
    pastAppointments$ = new BehaviorSubject<any>(undefined);
    deleteNoteSub$: Subscription;

    /*shows active appointments*/
    appointmentsActive;
    /*shows past appointments*/
    appointmentsPast;
    appsSubscription$: Subscription;
    pastAppsSubscription$: Subscription;
    downloadGDPRSub$: Subscription;
    appointmentPage = 1;
    pastAppointmentPage = 1;
    appointmentItemsPerPage = 10;
    pastAppointmentItemsPerPage = 10;
    scheduleIcon = scheduleIcon;
    adsIcon = faAd;
    missedAppIcon = faUserSlash;
    deletingNote = false;

    constructor(private auth: AuthService,
                private modalService: ModalService,
                public customerService: CustomerService,
                private toast: ToastService,
                public translate: LocalizationService,
                public timeUtil: DateTimeUtilService,
                private dateAdapter: DateAdapter<any>,
                private alert: AlertService,
                private router: Router,
                public iconService: IconService) {
        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;
    }

    ngOnInit() {

        this.customerService.isLoading = true;
        this.loadCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.customerService.loadCustomer(token, this.id, this.bookanapp).subscribe(
                        response => {
                            if (!response['message']) {
                                const customer = response as Customer;
                                this.customerService.customer$.next(customer);
                                this.customerService.setEditForm(customer);
                            }
                            this.customerService.isLoading = false;
                        }, error => {
                            this.loadingError = error;
                            this.customerService.isLoading = false;
                        }
                    );

                    /* get current and past appointments badge*/
                    this.customerService.getAllAppointmentsBadge(token, this.id, this.bookanapp).subscribe(
                        response => {
                            this.totalAppointments$.next(response);
                        }
                    );

                } else {
                    this.customerService.isLoading = false;
                }
            });

    }

    ngOnDestroy(): void {
        if (this.loadCustomerSub$) {
            this.loadCustomerSub$.unsubscribe();
        }

        if (this.editCustomerSub$) {
            this.editCustomerSub$.unsubscribe();
        }

        if (this.editCustomerImage$) {
            this.editCustomerImage$.unsubscribe();
        }

        if (this.pastAppsSubscription$) {
            this.pastAppsSubscription$.unsubscribe();
        }

        if (this.downloadGDPRSub$) {
            this.downloadGDPRSub$.unsubscribe();
        }
        this.dismiss();
        this.customerService.resetFields();

    }

    async dismiss() {
        this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigate(['/user/management/customers']));
        await this.modalService.dismissCustomerModal();
        this.customerService.customer$.next(null);
    }

    submitEditForm() {
        const button: HTMLElement = this.editSubmitBtn.nativeElement;
        button.click();
    }




    /*toggle between active and past*/
    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.appointmentsPast = value === 'history';
        this.appointmentsActive = value === 'active';
        if (this.appointmentsPast && !this.pastAppointments$.value) {
            this.loadPastAppointments();
        }

        if (this.appointmentsActive && !this.appointments$.value) {
            this.loadCurrentAppointments();
        }

    }

    loadCurrentAppointments() {
        this.customerService.isLoading = true;
        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.customerService.isLoading = false;
                    this.loadAppointments(token, false).subscribe(
                        appointments => {
                            if (!this.appointments$.value) {
                                this.appointments$.next([]);
                            }
                            this.appointments$.next(appointments);
                            this.customerService.isLoading = false;
                        }
                    );
                }
            });
    }

    loadPastAppointments() {
        this.customerService.isLoading = true;
        this.pastAppsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.loadAppointments(token, true).subscribe(
                        appointments => {
                            if (!this.pastAppointments$.value) {
                                this.pastAppointments$.next([]);
                            }
                            this.pastAppointments$.next(appointments);
                            this.customerService.isLoading = false;
                        }, error => {
                            this.customerService.isLoading = false;
                          }
                    );
                } else {
                    this.customerService.isLoading = false;
                }
            }, error => {
                this.customerService.isLoading = false;
            }
        );
    }

    loadAppointments(token: string, past: boolean) {
        if (!past) {
            return this.customerService.getAllAppointments(token, this.appointmentPage, false, this.appointmentItemsPerPage, this.id, this.bookanapp).pipe(
                catchError((err) => {
                    this.loadingError = err;
                    return throwError(err);
                })
            );
        } else {
            return this.customerService.getAllAppointments(token, this.pastAppointmentPage, true, this.pastAppointmentItemsPerPage, this.id, this.bookanapp).pipe(
                catchError((err) => {
                    this.loadingError = err;
                    return throwError(err);
                })
            );
        }
    }


    /*show formatted date*/
    showAppDate(dateTime: string, showYear?: boolean) {
        return this.timeUtil.showDate(this.translate.getLocale(), dateTime, showYear);
    }

    /*show formatted time*/
    showAppTime(dateTime: string) {
        return this.timeUtil.showLocalTime(this.translate.getLocale(), dateTime);
    }

    /* open modal with appointment details*/
    async showAppointment(id: string) {
        const locale = this.translate.getLocale();
        let cssClass = '';
        if (!mobile) {
            cssClass = 'appointment-modal';
        }
        await this.modalService.openAppointmentModal(AppointmentComponent, id, locale, cssClass, true, false,
            null, null, null, null, null, true);
    }

    /*show duration in minutes and hours*/

    timeConvert(n: number) {
        return this.timeUtil.timeConvert(n);
    }
    paginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.appointmentItemsPerPage = ev['pageSize'] as number;
        this.appointmentPage = pageIndex + 1;
        this.loadCurrentAppointments();
    }

    historyPaginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.pastAppointmentItemsPerPage = ev['pageSize'] as number;
        this.pastAppointmentPage = pageIndex + 1;
        this.loadPastAppointments();
    }

    async performDelete() {
        await this.alert.presentAlert(
            this.translate.getFromKey('customer-deleteCustomer-message'),
            null,
            null,
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('delete'),
                    handler: () => {
                        this.customerService.isLoading = true;
                        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {
                                    const idsToArchive = {
                                        idsToDelete: []
                                    };
                                    idsToArchive.idsToDelete.push(this.id);

                                    this.customerService.deleteCustomers(token, idsToArchive).subscribe(
                                        async response => {
                                            this.customerService.isLoading = false;
                                            switch (response['message']) {
                                                case 'deleteCustomerError':
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'invalidCustomer':
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-invalidCustomer'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'bindingError':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 4000);
                                                    break;
                                                default:
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerSuccess'), alertPosition, 'success', 1000);
                                                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                                        this.router.navigate(['/user/management/customers']));
                                                    this.dismiss();

                                            }
                                        }, async error => {
                                            this.customerService.isLoading = false;
                                            await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                                        }
                                    );

                                } else {
                                    this.customerService.isLoading = false;
                                }
                            }, async error => {
                                this.customerService.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                            }
                        );
                    }
                }

            ]
        );
    }


    async ban() {
        await this.alert.presentAlert(
            this.translate.getFromKey('app-ban-btn'),
            null,
            this.translate.getFromKey('app-ban-text'),
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('continue'),
                    handler: () => {
                        this.customerService.isLoading = true;
                        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {
                                    this.customerService.blockUser(token, this.id).subscribe(
                                        async response => {
                                            this.customerService.isLoading = false;
                                            switch (response['message']) {
                                                case 'userBlockedError':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'userIsNull':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-userIsNullMessage'), alertPosition, 'danger', 4000);
                                                    break;
                                                default:
                                                    await this.toast.presentToast(this.translate.getFromKey('app-userBlockedSuccess'), alertPosition, 'success', 1000);
                                                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                                        this.router.navigate(['/user/management/customers']));
                                                    await this.dismiss();

                                            }
                                        }, async error1 => {
                                            this.customerService.isLoading = false;
                                            await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                                        }
                                    );

                                } else {
                                    this.customerService.isLoading = false;
                                }
                            }, async error1 => {
                                this.customerService.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                            }
                        );
                    }
                }

            ]
        );
    }

    async promoCampaign() {
        const ids = [];
        ids.push(this.id);

        let cssClass = '';
        if (!mobile) {
            cssClass = 'ads-campaign-modal';
        }
        await this.modalService.openCampaignModal(CampaignComponent, cssClass, ids, false, true, null);
    }


    onGDPRPicked(event: any) {
        this.customerService.onGDPRPicked(event, this.editCustomerImage$, this.auth, this.id);

    }

    async uploadGDPR() {
        await this.customerService.uploadGDPR(this.GDPRPicker);
    }

    async deleteGDPR() {
        await this.customerService.deleteGDPR(this.editCustomerImage$, this.auth, this.id);
    }

    async onSubmitForm() {
        await this.customerService.onSubmitForm(this.editCustomerSub$, this.auth);
    }

    async onImagePicked(event: any) {
        await this.customerService.onImagePicked(event, this.editCustomerImage$, this.auth, this.id, this.mobile, this.tablet, EditImageComponent);

    }

    async editPickedPic(avatar: string) {
        await this.customerService.editPickedPic(avatar, this.imagePicker, null, this.editCustomerImage$, this.auth, this.id);
    }

    async openAvatar(src: string) {
        if (src) {
            await this.modalService.openImageModal(ImageComponent, src);
        }
    }

    async smsCampaign() {
        let ids = [];
        ids.push(this.id);
        await this.modalService.openCampaignModal(CampaignComponent, '', ids, false, false, undefined);
    }

    deleteNote(timestamp: string) {
        this.customerService.isLoading = true;
        this.deleteNoteSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    this.customerService.deleteNote(token, timestamp, this.id).subscribe(
                        async response => {
                            if (response.id) {
                                this.customerService.customer$.next(response);
                                this.customerService.isLoading = false;
                            } else {
                                this.customerService.isLoading = false;
                                // tslint:disable-next-line:max-line-length
                                await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
                            }
                        }, async error => {
                            this.customerService.isLoading = false;
                            // tslint:disable-next-line:max-line-length
                            await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
                        }
                    )
                } else {
                    this.customerService.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
                }
            }, async error => {
                this.customerService.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
            }

        );
    }


}
