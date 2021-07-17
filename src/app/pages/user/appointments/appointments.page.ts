import {ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {Appointment} from '../../../store/models/user.model';
import {AppointmentService} from '../../../services/user/appointment.service';
import {AuthService} from '../../../services/auth/auth.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {AppointmentComponent} from '../../../components/modals/appointment/appointment.component';
import {LoadingService} from '../../../services/loading/loading.service';
import {appointmentIcon, messageIcon, scheduleIcon} from '../user.page';
import {ToastService} from '../../../services/overlay/toast.service';
import {MessageComponent} from '../../../components/modals/message/message.component';
import {catchError, distinctUntilChanged, map, take} from 'rxjs/operators';
import {alertPosition, dateClass, mobile, tablet} from '../../../app.component';
import {SidenavService} from '../../../services/util/sidenav.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Schedule, ScheduleCategory} from '../../../store/models/provider.model';
import {ScheduleService} from '../../../services/user/schedule.service';
import {DateAdapter} from '@angular/material';
import {ActionSheetController, IonRouterOutlet, PopoverController} from '@ionic/angular';
import {AlertService} from '../../../services/overlay/alert.service';
import {IconService} from "../../../services/util/icon.service";
import {PaginatorComponent} from "../../../components/popover/paginator/paginator.component";
import {animate, query, stagger, state, style, transition, trigger} from '@angular/animations';


@Component({
    selector: 'app-appointments',
    templateUrl: './appointments.page.html',
    styleUrls: ['./appointments.page.scss'],
    animations: [
        trigger(
            'enterAnimation', [
                state('void', style({ opacity: 0 })),
                state('*', style({ opacity: 1 })),
                transition(':enter', animate('1200ms ease-out')),
                transition(':leave', animate('10ms ease-in')),
            ]
        ),
        trigger(
            'listAnimation', [
                transition('* <=> *', [
                    query(
                        ':enter',
                        [
                            style({ opacity: 0, transform: 'translateY(-15px)' }),
                            stagger(
                                '100ms',
                                animate(
                                    '100ms ease-out',
                                    style({ opacity: 1, transform: 'translateY(0px)' })
                                )
                            )
                        ],
                        { optional: true }
                    )
                ])

            ])
    ],
})
export class AppointmentsPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;

    messageIcon = messageIcon;
    appointmentIcon = appointmentIcon;

    totalAppointments$ = new BehaviorSubject<any>(undefined);

    /*all appointments subscription*/
    appsSubscription$: Subscription;

    /*all past appointments subscription*/
    pastAppsSubscription$: Subscription;

    /*update all appointments subscription*/
    updatedAppsSubscription$: Subscription;

    /*update all past appointments subscription*/
    updatedPastAppsSubscription$: Subscription;

    /*individual appointment subscription*/
    appSubscription$: Subscription;

    /*cancel appointment subscription*/
    cancelAppointmentSubscription$: Subscription;

    /*send details by email subscription*/
    sendDetailsSubscription$: Subscription;

    printSububscription$: Subscription;

    loadingError;

    page = 1;
    pastPage = 1;
    itemsPerPage = 10;
    pastItemstPerPage = 10;

    loading: any;

    appointmentsToArchive = [];


    /*get access to schedule select element*/
    @ViewChild('sortMatSelect', {static: false}) sortMatSelect: ElementRef;

    segment;
    /*shows active appointments*/
    active;
    /*shows past appointments*/
    history;

    enteredPage: boolean;
    header: any;

    selectedDate = undefined;
    treeVisible = true;
    scheduleSelected = false;

    // pick schedule from sidenav
    scheduleForm = new FormGroup({
        schedule: new FormControl(null)
    });

    scheduleCategories$ = new BehaviorSubject<ScheduleCategory[]>(null);

    scheduleIcon = scheduleIcon;

    scheduleIds: string[] = [];
    selectedScheduleNames: string[] = [];
    reverseApps = false;
    isLoading: boolean;
    isDownloading: boolean;

    pageIndex = 0;
    historyPageIndex = 0;
    searchTerm;

    numberOfAppointments: number;
    numberOfPastAppointments: number;

    renderAppointments = true;


    constructor(public appointmentService: AppointmentService,
                public auth: AuthService,
                private timeUtil: DateTimeUtilService,
                private translate: LocalizationService,
                private modal: ModalService,
                private loadingService: LoadingService,
                private dateTimeUtil: DateTimeUtilService,
                private toast: ToastService,
                public sidenavService: SidenavService,
                private changeDetector: ChangeDetectorRef,
                public scheduleService: ScheduleService,
                private dateAdapter: DateAdapter<any>,
                private actionSheetController: ActionSheetController,
                private alert: AlertService,
                public iconService: IconService,
                private popoverController: PopoverController,
                private routerOutlet: IonRouterOutlet
    ) {
        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;

    }

    ionViewWillEnter() {
        this.searchTerm = undefined;
        if (mobile && !tablet) {
            this.sidenavService.appointmentsSideNav = false;
        }
        this.active = true;
        this.history = false;
        this.segment = 'active';
        this.sidenavService.appointmentsPageActive = true;
        this.appointmentService.pastAppointments$ = new BehaviorSubject<Appointment[]>(null);
        this.enteredPage = true;
        this.selectedDate = undefined;
        this.scheduleIds = [];
        this.selectedScheduleNames = [];
        this.scheduleService.schedules = [];
        this.loadOrRefreshAppointments();

    }

    ionViewWillLeave() {
        this.sidenavService.appointmentsPageActive = false;
        this.appointmentService.appointments$.next(null);
        this.page = 1;
        this.appointmentService.pastAppointments$.next(null);
        this.pastPage = 1;
        this.cancelSubs();
        this.enteredPage = false;
    }


    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        if (this.appsSubscription$) {
            this.appsSubscription$.unsubscribe();
        }

        if (this.updatedAppsSubscription$) {
            this.updatedAppsSubscription$.unsubscribe();
        }
        if (this.appSubscription$) {
            this.appSubscription$.unsubscribe();
        }

        if (this.updatedPastAppsSubscription$) {
            this.updatedPastAppsSubscription$.unsubscribe();
        }
        if (this.cancelAppointmentSubscription$) {
            this.cancelAppointmentSubscription$.unsubscribe();
        }
        if (this.printSububscription$) {
            this.printSububscription$.unsubscribe();
        }
    }

    private loadOrRefreshAppointments(refresh?: any) {
        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
            token => {
                if (token) {
                    this.loadCurrentAppointments();
                    this.scheduleService.getSchedules(token).pipe(
                        catchError((err) => {
                            this.loadingError = err;
                            return throwError(err);
                        })).pipe(map(scheduleCategories => {
                            // add all schedules
                            const allSchedules: Schedule[] = [];
                            scheduleCategories.forEach(
                                category => {
                                    category.schedules.forEach(
                                        schedule => {
                                            schedule.scheduleCategory = category.category;
                                            allSchedules.push(schedule);
                                        }
                                    );
                                }
                            );
                            return scheduleCategories;
                        }
                    )).subscribe(
                        schedules => {
                            this.scheduleCategories$.next(schedules);
                            if (refresh) {
                                this.treeVisible = false;
                                this.changeDetector.detectChanges();
                                this.treeVisible = true;
                                this.changeDetector.detectChanges();
                            }
                        }
                    );

                    /* get current and past appointments badge*/
                    this.appointmentService.getAllAppointmentsBadge(token).subscribe(
                        response => {
                            this.totalAppointments$.next(response);
                        }
                    );

                    if (refresh) {
                        refresh.target.complete();
                    }

                    this.auth.loadProviderFromServer(token).subscribe(
                        provider => {
                            this.auth.setLoggedUser(provider);
                            this.auth.userStats$.next(provider.userStats);
                        }
                    );

                }



            }
        );

    }

    loadAppointments(token: string, past: boolean) {
        if (!past) {
            return this.appointmentService.getAllAppointments(token, this.page, this.scheduleIds, this.selectedDate, false, this.reverseApps, this.itemsPerPage).pipe(
                catchError((err) => {
                    this.loadingError = err;
                    this.isLoading = false;
                    return throwError(err);
                })
            );
        } else {
            return this.appointmentService.getAllAppointments(token, this.pastPage, this.scheduleIds, this.selectedDate, true, this.reverseApps, this.pastItemstPerPage).pipe(
                catchError((err) => {
                    this.loadingError = err;
                    this.isLoading = false;
                    return throwError(err);
                })
            );
        }
    }

    searchAppointments(ev: CustomEvent, past) {
        this.searchTerm = ev.target['value'];
        this.searchAppointmentsByTerm(past, 1, 10);
    }


    /*show formatted date*/
    showAppDate(dateTime: string, showYear?: boolean) {
        return this.timeUtil.showDate(this.translate.getLocale(), dateTime, showYear);
    }

    showTimeZoneAppDate(dateTime: Date) {
        const date = Date.UTC(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
        return this.timeUtil.showUTCDate(this.translate.getLocale(), date);
    }


    /*show formatted time*/
    showAppTime(dateTime: string) {
        return this.timeUtil.showLocalTime(this.translate.getLocale(), dateTime);
    }

    /* open modal with appointment details*/
    async showAppointment(id: string) {
        const locale = this.translate.getLocale();
        let cssClass = '';
        if (!mobile || this.tablet) {
            cssClass = 'appointment-modal';
        }

        await this.modal.openAppointmentModal(AppointmentComponent, id, locale, cssClass, true,
            false, undefined, undefined, undefined, undefined, undefined, false);
    }

    /*show duration in minutes and hours*/
    timeConvert(n: number) {
        return this.dateTimeUtil.timeConvert(n);
    }

    async sendMessage(appointmentId: string, dateTime: string, userName: string) {
        let cssClass = '';
        if (!mobile)  {
            cssClass = 'message-modal';
        }
        const localDateTime = this.dateTimeUtil.showLocalDateTime(this.translate.getLocale(), dateTime);
        await this.modal.openMessageModal(MessageComponent, cssClass, this.routerOutlet.nativeEl, localDateTime, +appointmentId, null, userName, undefined, true);
    }

    async sendDetails(id: string) {
        const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
        await loading.present();
        this.sendDetailsSubscription$ = this.auth.authToken$.subscribe(
            token => {
                if (token) {
                    this.appointmentService.sendEmailWithAppointmentDetails(token, id).subscribe(
                        response => {
                            loading.dismiss();
                            this.toast.presentToast(this.translate.getFromKey('app-emailSuccessMessage'), alertPosition, 'success', 2000);
                        }, error => {
                            loading.dismiss();
                            this.toast.presentToast(this.translate.getFromKey('app-emailErrorMessage'), alertPosition, 'danger', 3000);
                        }
                    );
                } else {
                    this.auth.getCurrentToken().subscribe(currentToken => {
                        if (currentToken) {
                            this.appointmentService.sendEmailWithAppointmentDetails(token, id).subscribe(
                                response => {
                                    loading.dismiss();
                                    this.toast.presentToast(this.translate.getFromKey('app-emailSuccessMessage'), alertPosition, 'success', 2000);
                                }, error => {
                                    loading.dismiss();
                                    this.toast.presentToast(this.translate.getFromKey('app-emailErrorMessage'), alertPosition, 'danger', 3000);
                                }
                            );
                        }

                    });
                }
            }, error => {
                loading.dismiss();
                this.toast.presentToast(this.translate.getFromKey('app-emailErrorMessage'), alertPosition, 'danger', 3000);
            }
        );
    }

    /*process appointment cancellation*/
    async cancel(id: string, dateTime: string) {
        this.searchTerm = undefined;
        this.appointmentService.cancel(dateTime, this.cancelAppointmentSubscription$, null, true, null, null, null, null, id).then(
            sub => {
                this.cancelAppointmentSubscription$ = sub;
            }
        );
    }
    /*   refresh view on mobile*/
    doRefresh(event) {
        if (!this.history) {
            this.loadOrRefreshAppointments(event);
        } else {
            event.target.complete();
        }
    }

    private searchAppointmentsByTerm(past, page, itemsPerPage) {
        this.isLoading = true;
        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    if (this.searchTerm && this.searchTerm.toString().length > 1) {
                        this.appointmentService.searchAppointments(token, this.searchTerm, past, page, itemsPerPage).pipe(
                            catchError((err) => {
                                this.loadingError = err;
                                this.isLoading = false;
                                return throwError(err);
                            })).subscribe(response => {
                                if (!past) {
                                    this.appointmentService.appointments$.next(response);
                                    this.isLoading = false;
                                } else {
                                    this.appointmentService.pastAppointments$.next(response);
                                    this.isLoading = false;
                                }
                            }
                        );

                    } else {
                        if (!past) {
                            this.loadCurrentAppointments();
                        } else {
                            this.loadPastAppointments();
                        }

                        this.searchTerm = undefined;

                    }

                }
            }
        );
    }

    loadCurrentAppointments() {
        this.isLoading = true;
        this.appsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.loadAppointments(token, false).subscribe(
                        appointments => {

                            this.renderAppointments = false;


                            if (!this.appointmentService.appointments$.value) {
                                this.appointmentService.appointments$.next([]);
                            }
                            this.appointmentService.appointments$.next(appointments);
                            this.isLoading = false;

                            // delay render to animate pagination correctly
                            setTimeout(() => {
                                this.renderAppointments = true;
                            }, 5);
                        }
                    );
                }
            });
    }

    loadPastAppointments() {
        this.isLoading = true;
        this.pastAppsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.loadAppointments(token, true).subscribe(
                        appointments => {
                            this.renderAppointments = false;
                            if (!this.appointmentService.pastAppointments$.value) {
                                this.appointmentService.pastAppointments$.next([]);
                            }
                            this.appointmentService.pastAppointments$.next(appointments);
                            if (appointments.size === 0) {
                                this.active = true;
                                this.history = false;
                            }
                            this.isLoading = false;

                            // delay render to animate pagination correctly
                            setTimeout(() => {
                                this.renderAppointments = true;
                            }, 5);

                        }
                    );
                } else {
                    this.isLoading = false;
                }
            }, error => {
                this.isLoading = false;
            }
        );
    }

    /*toggle between active and past*/
    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.history = value === 'history';
        this.active = value === 'active';
        this.segment = value;
        if (this.history && !this.appointmentService.pastAppointments$.value) {
            this.loadPastAppointments();
        }
        this.cancelAllFilters();
    }

    // click on open schedule in the sidenav


    async addSchedule(event: any, schedule: Schedule) {
        const checked = event.detail.checked;
        if (checked) {
            this.onSelectSchedule(schedule);
            if (this.mobile && !this.tablet) {
                this.sidenavService.hideSideNav();
            }
        } else {
            const name = schedule.scheduleName;
            const id = schedule.scheduleId;
            this.scheduleIds = this.scheduleIds.filter(item => item !== id);
            this.selectedScheduleNames = this.selectedScheduleNames.filter(item => item !== name);
            this.applyFilters();
        }
    }

    onSelectSchedule(schedule: Schedule) {
        this.scheduleSelected = true;
        this.scheduleIds.push(schedule.scheduleId);
        this.selectedScheduleNames.push(schedule.scheduleName);
        this.applyFilters();
    }


    selectedDateChange(date: Date) {
        this.changeDetector.detectChanges();
        this.selectedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        this.applyFilters();
        if (mobile && !tablet) {
            this.sidenavService.appointmentsSideNav = false;
        }

    }


    cancelAllFilters() {
        this.selectedDate = undefined;
        this.scheduleIds = [];
        this.selectedScheduleNames = [];
        this.scheduleService.schedules = [];
        this.applyFilters();
    }

    cancelSchedule() {
        this.scheduleIds = [];
        this.selectedScheduleNames = [];
        this.scheduleService.schedules = [];
        this.applyFilters();
    }

    cancelSelectedDate() {
        this.selectedDate = undefined;
        this.applyFilters();
    }


    private applyFilters() {
        if (this.active) {
            this.page = 1;
            this.appointmentService.appointments$.next(null);
            this.loadCurrentAppointments();

        } else {
            this.pastPage = 1;
            this.appointmentService.pastAppointments$.next(null);
            this.loadPastAppointments();

        }
    }

    async print() {
        const actionSheet = await this.actionSheetController.create({
            header: this.translate.getFromKey('app-print'),
            buttons: [{
                text: 2 + ' ' + this.translate.getFromKey('days'),
                cssClass: 'action-sheet-button-secondary',
                icon: 'calendar',
                handler: () => {
                    this.downloadPdf(2);
                }
            }, {
                text: 7 + ' ' + this.translate.getFromKey('days'),
                cssClass: 'action-sheet-button-secondary',
                icon: 'calendar',
                handler: () => {
                    this.downloadPdf(7);

                }
            }, {
                text: 14 + ' ' + this.translate.getFromKey('days'),
                cssClass: 'action-sheet-button-secondary',
                icon: 'calendar',
                handler: () => {
                    this.downloadPdf(14);

                }
            },
                {
                    text: 30 + ' ' + this.translate.getFromKey('days'),
                    cssClass: 'action-sheet-button-secondary',
                    icon: 'calendar',
                    handler: () => {
                        this.downloadPdf(30);

                    }
                },
                {
                    text: this.translate.getFromKey('cancel'),
                    icon: 'close',
                    role: 'destroy'

                }
            ]
        });
        await actionSheet.present();

    }

    private async downloadPdf(days: number) {
        this.isDownloading = true;
        this.printSububscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    this.appointmentService.printAllAppointments(token, days, this.scheduleIds, this.selectedDate).subscribe(
                        async response => {
                            this.isDownloading = false;
                            const blob = new Blob([response], { type: 'application/pdf' });
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.download = 'bookanapp.pdf';
                            link.target = '_self';
                            link.click();
                        }, async error => {
                            this.isDownloading = false;
                            await this.toast.presentToast(this.translate.getFromKey('app-pdfViewError'), alertPosition, 'danger', 4000);
                        }
                    );

                } else {
                    this.isDownloading = false;
                    await this.toast.presentToast(this.translate.getFromKey('app-pdfViewError'), alertPosition, 'danger', 4000);
                }
            }, async error => {
                this.isDownloading = false;
                await this.toast.presentToast(this.translate.getFromKey('app-pdfViewError'), alertPosition, 'danger', 4000);
            }
        );
    }

    reverse(direction: string) {
        this.reverseApps = direction.toString() === 'down';

        if (this.active) {
            this.page = 1;
            this.loadCurrentAppointments();
        } else {
            this.pastPage = 1;
            this.loadPastAppointments();

        }



    }

    addToArchive(id: string, event: CustomEvent) {
        const checked = event.detail.checked;
        if (checked) {
            this.appointmentsToArchive.push(id.toString());
        } else {
            this.appointmentsToArchive.splice(this.appointmentsToArchive.indexOf(id.toString()), 1);
        }
    }

    selectAllCheckboxes(appointmentMap: any, event: CustomEvent) {
        const checked = event.detail.checked;
        appointmentMap.forEach(
            date => {
                date.appointments.forEach(
                    appointment => {
                        if (checked) {
                            appointment.checked = true;
                        } else {
                            appointment.checked = false;
                        }
                    }
                );
            }
        );

    }

    async archive(appointmentId?) {
        await this.alert.presentAlert(
            null,
            null,
            this.translate.getFromKey('archive-sure'),
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
                        this.pastAppsSubscription$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {

                                    let idsToArchive = [];
                                    if (appointmentId) {
                                        idsToArchive.push(appointmentId);
                                    } else {
                                        idsToArchive = this.appointmentsToArchive;
                                    }

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
                                                    this.pastPage = 1;
                                                    this.appointmentsToArchive = [];
                                                    this.loadPastAppointments();
                                                    /* get current and past appointments badge*/
                                                    this.appointmentService.getAllAppointmentsBadge(token).subscribe(
                                                        badges => {
                                                            this.totalAppointments$.next(badges);
                                                        }
                                                    );

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

    paginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.pageIndex = pageIndex;
        this.itemsPerPage = ev['pageSize'] as number;
        this.page = pageIndex + 1;
        if (!this.searchTerm) {
            this.loadCurrentAppointments();
        } else {
            this.searchAppointmentsByTerm(false, pageIndex + 1, this.itemsPerPage);
        }

    }

    historyPaginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.historyPageIndex = pageIndex;
        this.pastItemstPerPage = ev['pageSize'] as number;
        this.pastPage = pageIndex + 1;
        if (!this.searchTerm) {
            this.loadPastAppointments();
        } else {
            this.searchAppointmentsByTerm(true, pageIndex + 1, this.pastItemstPerPage);
        }


    }

    async loadMore(total) {
        let pageIndex = this.pageIndex;
        if (this.history) {
            pageIndex = this.historyPageIndex;
        }

        let appointmentsPerPage = this.itemsPerPage;
        if (this.history) {
            appointmentsPerPage = this.pastItemstPerPage;
        }

        const popover = await this.popoverController.create({
            component: PaginatorComponent,
            event: undefined,
            translucent: true,
            mode: 'md',
            componentProps: {
                total : total,
                bookanapp : this.history,
                customersPerPage: appointmentsPerPage,
                searchTerm: this.searchTerm,
                pageIndex: pageIndex},
            cssClass: 'paginator-popover',
        });
        await popover.present();
        return popover.onDidDismiss().then(
            (data: any) => {
                if (data) {
                    const paginatorData = data.data;
                    if (paginatorData) {
                        this.pageIndex = paginatorData.pageIndex;
                        if (!paginatorData.bookanapp) {
                            this.paginator(paginatorData.paginatorEvent);
                        } else {
                            this.historyPaginator(paginatorData.paginatorEvent);
                        }
                    }
                }
            }
        )
    }

    dateClass() {
        return dateClass();
    }

    selectAllCurrentCheckboxes(appointmentMap: any, event: CustomEvent) {
        const checked = event.detail.checked;
        appointmentMap.forEach(
            date => {
                date.appointments.forEach(
                    appointment => {
                        if (checked) {
                            appointment.checked = true;
                        } else {
                            appointment.checked = false;
                        }
                    }
                );
            }
        );

    }

    addToCancel(id: string, event: CustomEvent) {
        const checked = event.detail.checked;
        if (checked) {
            this.appointmentService.appointmentsToCancel.push(id.toString());
        } else {
            this.appointmentService.appointmentsToCancel.splice(this.appointmentService.appointmentsToCancel.indexOf(id.toString()), 1);
        }

    }

    async cancelMultiple() {
        this.searchTerm = undefined;
        this.appointmentService.cancel(undefined, this.cancelAppointmentSubscription$, null, true,
            null, null, null, null, null, this.appointmentService.appointmentsToCancel).then(
            sub => {
                this.cancelAppointmentSubscription$ = sub;
            }
        );
    }

}
