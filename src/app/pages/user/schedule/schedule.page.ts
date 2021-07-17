import {AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, BASE_URL, dateClass, mobile, standardAnimation, tablet} from '../../../app.component';
import {SidenavService} from '../../../services/util/sidenav.service';
import {DateAdapter} from '@angular/material';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {ScheduleService} from '../../../services/user/schedule.service';
import {BehaviorSubject, interval, Subscription, throwError} from 'rxjs';
import {PickedSchedule, Provider, Schedule, ScheduleCategory} from '../../../store/models/provider.model';
import {catchError, distinctUntilChanged, map, take} from 'rxjs/operators';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {faCalendarCheck, faInfo} from '@fortawesome/free-solid-svg-icons';
import {FormControl, FormGroup} from '@angular/forms';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {ActionSheetController, AlertController, IonContent, IonRouterOutlet, PopoverController} from '@ionic/angular';
import {ModalService} from '../../../services/overlay/modal.service';
import {EditscheduleComponent} from '../../../components/modals/editschedule/editschedule.component';
import {ScheduleComponent} from '../../../components/modals/schedule/schedule.component';
import {ActivatedRoute, Router} from '@angular/router';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {BookingmodalComponent} from '../../../components/modals/bookingmodal/bookingmodal.component';
import {AppointmentComponent} from '../../../components/modals/appointment/appointment.component';
import {ModifySlotComponent} from '../../../components/modals/modifyslot/modify-slot.component';
import {InfoComponent} from '../../../components/popover/info/info.component';
import {InfoPopoverService} from '../../../services/util/info-popover.service';
import {GotodateService} from '../../../services/user/gotodate.service';
import {AppSummaryComponent} from '../../../components/modals/app-summary/app-summary.component';
import {MultipleBookingsComponent} from '../../../components/modals/multiple-bookings/multiple-bookings.component';
import {AppointmentService} from '../../../services/user/appointment.service';
import { CalendarOptions } from '@fullcalendar/angular';
import {CalendarComponent} from '../../../components/popover/calendar/calendar.component';
import {ViewConfigPopoverComponent} from '../../../components/popover/view-config-popover/view-config-popover.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {animate, query, stagger, state, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.page.html',
    styleUrls: ['./schedule.page.scss'],
    animations: [
        standardAnimation,
        trigger(
            'listAnimation', [
                transition('* <=> *', [
                    query(
                        ':enter',
                        [
                            style({ opacity: 0, transform: 'translateY(-15px)' }),
                            stagger(
                                '50ms',
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


export class SchedulePage implements AfterViewChecked, OnDestroy {
    @ViewChild('external', {static: false}) external: ElementRef;
    @ViewChild('container', {static: false}) container: IonContent;

    scheduleCategories$ = new BehaviorSubject<ScheduleCategory[]>(null);
    schedules$ = new BehaviorSubject<Schedule[]>(null);
    currentAuthToken$ = new BehaviorSubject<string>(null);
    getSchedules$: Subscription;
    refreshSub$: Subscription;

    mobile = mobile;
    tablet = tablet;
    opened = true;
    selectedDate = undefined;

    loadingError;
    // fullcalendar options
    options: CalendarOptions;
    dayScheduleOptions: CalendarOptions;

    /*get access to fullcalendar element*/
    @ViewChild('fullCalendar', {static: false}) fullCalendar: FullCalendarComponent;

    BASE_URL = BASE_URL;
    scheduleId: string;
    scheduleSelected: boolean;
    scheduleListSelected: boolean;


    selectedScheduleName;
    selectedSchedule: Schedule;

    // pick schedule from sidenav
    scheduleForm = new FormGroup({
        schedule: new FormControl(null)
    });

    // select multiple schedules for 1 day
    dayScheduleSelected = false;

    isLoading = false;
    treeVisible = true;

    deleteScheduleSub$: Subscription;
    freeSchedule = false;
    refreshAlertPresented = false;


    appointmentIcon = faCalendarCheck;
    infoIcon = faInfo;
    private updateSlotSub$: Subscription;
    refreshSubject = new BehaviorSubject<boolean>(false);
    plan: string;
    pickedSchedule: PickedSchedule;

    AUTH_HEADER = 'JWT ';
    slotsLoading = false;
    fullCalendar$ = new BehaviorSubject<FullCalendarComponent>(null);

    preferredStart;
    preferredEnd;
    preferredSlotDuration;
    preferredView;
    alertPosition = alertPosition;

    numberOfSchedules: number;

    constructor(public sidenavService: SidenavService,
                private dateAdapter: DateAdapter<any>,
                public translate: LocalizationService,
                public auth: AuthService,
                public scheduleService: ScheduleService,
                public fullcalendarService: FullcalendarService,
                private changeDetector: ChangeDetectorRef,
                public timeUtilService: DateTimeUtilService,
                private popoverController: PopoverController,
                private modalService: ModalService,
                private route: ActivatedRoute,
                private alert: AlertService,
                private toast: ToastService,
                private router: Router,
                private popoverService: InfoPopoverService,
                private gotodateService: GotodateService,
                private routerOutlet: IonRouterOutlet,
                private alertCtrl: AlertController,
                private appointmentService: AppointmentService,
                private actionSheetController: ActionSheetController,
                private popController: PopoverController,
                private localStorage: LocalStorageService) {

        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;
    }


    async ionViewWillEnter() {


        this.backSchedule();
        if (mobile && !tablet) {
            this.sidenavService.scheduleSideNav = false;
        }
        /* refresh view*/
        this.route.queryParams.pipe(distinctUntilChanged(), take(1)).subscribe(async params => {
                this.getSchedules$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                    token => {
                        if (token) {
                            this.currentAuthToken$.next(token);
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
                                    if (allSchedules.length > 0) {
                                        if (allSchedules.length < 2) {
                                            this.scheduleId = allSchedules[0].scheduleId;
                                        }
                                        this.selectedScheduleName = allSchedules[0].scheduleName;
                                    }

                                    const normalSchedule: Schedule[] = [];
                                    const serviceSchedule: Schedule[] = [];
                                    allSchedules.forEach(
                                        sched => {
                                            if (sched.scheduleCategory !== '###') {
                                                normalSchedule.push(sched);
                                            } else {
                                                serviceSchedule.push(sched);
                                            }
                                        }
                                    );


                                    const scheduleList = normalSchedule.concat(serviceSchedule);

                                    this.schedules$.next(scheduleList);
                                    this.numberOfSchedules = scheduleList.length;
                                    return scheduleCategories;
                                }
                            )).subscribe(
                                (schedules) => {
                                    const normalSchedule: ScheduleCategory[] = [];
                                    const serviceSchedule: ScheduleCategory[] = [];
                                    schedules.forEach(
                                        category => {
                                            if (category.category !== '###') {
                                                normalSchedule.push(category);
                                            } else {
                                                serviceSchedule.push(category);
                                            }
                                        }
                                    );


                                    const scheduleList = normalSchedule.concat(serviceSchedule);

                                    this.scheduleCategories$.next(scheduleList);
                                    const refresh = params.refresh;
                                    if (refresh) {
                                        // this.treeVisible = false;
                                        // this.changeDetector.detectChanges();
                                        // this.treeVisible = true;
                                        // this.changeDetector.detectChanges();
                                    }
                                }
                            );

                            // fetch user stats
                            this.auth.loadProviderFromServer(token, true).subscribe(
                                response => {
                                    const user = response as Provider;
                                    this.auth.setLoggedUser(user);
                                    this.auth.userStats$.next(user.userStats);
                                    this.auth.userAuthorities$.pipe(take(1)).subscribe(
                                        authorities => {
                                            this.plan = this.auth.userPlan(authorities);
                                            if (this.plan === 'BASIC') {
                                                if (this.schedules$.value && this.schedules$.value.length > 0) {
                                                    this.openSchedule(this.schedules$.value[0]);
                                                }
                                            }
                                        }
                                    );
                                }
                            );

                            this.refreshSub$ = interval(300000).subscribe(
                                async () => {
                                    if (this.scheduleSelected && this.scheduleService.selectedSlots.length === 0 && !this.refreshAlertPresented) {
                                        this.refreshAlertPresented = true;
                                        await this.alert.presentAlert(
                                            this.translate.getFromKey('update-slots'),
                                            null,
                                            null,
                                            [
                                                {
                                                    text: this.translate.getFromKey('close'),
                                                    handler: () => {
                                                        this.refreshAlertPresented = false;
                                                        this.
                                                        alertCtrl.dismiss();

                                                    }
                                                },
                                                {
                                                    text: this.translate.getFromKey('refresh'),
                                                    handler: () => {
                                                        this.refresh();
                                                        this.refreshAlertPresented = false;

                                                    }
                                                }

                                            ]
                                        );
                                        // this.refresh();
                                    }
                                }
                            );

                        }
                    }
                );

            }
        );
        this.sidenavService.schedulePageActive = true;

    }


    ionViewWillLeave() {
        this.cancelSubs();
    }

    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        this.sidenavService.schedulePageActive = false;
        if (this.getSchedules$) {
            this.getSchedules$.unsubscribe();
        }

        if (this.refreshSub$) {
            this.refreshSub$.unsubscribe();
        }

        if (this.deleteScheduleSub$) {
            this.deleteScheduleSub$.unsubscribe();
        }
    }

    ngAfterViewChecked(): void {
        this.changeDetector.detectChanges();
    }


    async selectedDateChange(date: Date) {
        this.dayScheduleSelected = false;
        this.scheduleSelected = false;
        this.changeDetector.detectChanges();
        this.selectedDate = date;
        this.dayScheduleSelected = true;
        this.scheduleForm.controls.schedule.setValue(undefined);
        if (mobile && !tablet) {
            this.sidenavService.scheduleSideNav = false;
        }
        this.pickedSchedule = undefined;
    }


    /* fullcalendar options*/
    fullCalendarOptions(scheduleId: string, freeSchedule: boolean): CalendarOptions {
        /*translated strings and definitions*/
        const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const todayDate = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDay();
        const self = this;

        async function popover(el) {
            let cssClass = 'calendar-popover';
            if (mobile && !tablet) {
                cssClass = 'calendar-popover-mobile';
            }
            const calendarPopover = await self.popoverController.create({
                component: CalendarComponent,
                cssClass,
                event: el,
                mode: 'ios'
            });

            return await calendarPopover.present();
        }



        // tslint:disable-next-line:no-shadowed-variable
        async function optionsPopover(el, freeSchedule: boolean) {
            self.fullcalendarService.fullCalendar$.pipe(take(1)).subscribe(
                // tslint:disable-next-line:no-shadowed-variable
                async fullCalendar => {
                    if (fullCalendar) {
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
                                fullcalendar: fullCalendar,
                                freeSchedule: freeSchedule
                            }
                        });
                        return await popover.present();
                    }
                }
            );
        }

        let view = 'timeGridWeek';
        const defaultDate = new Date();
        const dateRange = {
            start: todayDate,
            end: '2030-12-31'
        };


        let startTime = '08:00';
        if (this.preferredStart) {
            startTime = this.preferredStart;
        }

        let endTime = '24:00';
        if (this.preferredEnd) {
            endTime = this.preferredEnd;
        }

        let slotDuration;
        if (this.preferredSlotDuration) {
            slotDuration = '00:' + this.preferredSlotDuration + ':00';
        } else {
            slotDuration = '00:15:00';
        }

        if (this.preferredView && !freeSchedule) {
            view = this.preferredView;
        } else if (freeSchedule) {
            if (self.tablet) {
                view = 'timeGrid3Day';
            }

            if (self.mobile && !self.tablet) {
                view = 'timeGridDay';
            }

            if (!self.mobile) {
                view = 'timeGridWeek';
            }

        } else {
            if (self.tablet) {
                view = 'dayGrid3Day';
            }

            if (self.mobile && !self.tablet) {
                view = 'dayGridDay';
            }

            if (!self.mobile) {
                view = 'dayGridWeek';
            }

        }

        return  {
            events(fetchInfo, successCallback, failureCallback) {
                self.fullcalendarService.populateEvents(fetchInfo, successCallback, scheduleId);
            },
            eventClick(event) {
                self.fullcalendarClick(event);
            },
            timeZone: 'UTC',
            selectLongPressDelay: 300,
            allDaySlot: false,
            selectable: freeSchedule,
            selectMirror: true,
            initialView: view,
            initialDate: defaultDate,
            slotDuration: slotDuration,
            fixedWeekCount: false,
            height: 'auto',
            slotMaxTime: endTime,
            slotMinTime: startTime,
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
                        optionsPopover(ev, freeSchedule);
                    }
                }
            },
            headerToolbar: {
                left: 'prev,next dayButton',
                center: 'title',
                right: 'optionsButton'
            },
            // @ts-ignore
            slotLabelFormat: self.fullcalendarService.eventTimeFormat(),
            plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
            visibleRange: dateRange,
            locale: self.fullcalendarService.getFullcalendarLocale(this.translate),
            views: {
                timeGrid3Day: {
                    type: 'timeGrid',
                    duration: { days: 3 },
                    buttonText: '3 ' + this.translate.getFromKey('days-calendar')
                },
                dayGrid3Day: {
                    type: 'dayGrid',
                    duration: { days: 3 },
                    buttonText: '3 ' + this.translate.getFromKey('days-calendar')
                }
            },
            // @ts-ignore
            eventTimeFormat: self.fullcalendarService.eventTimeFormat(),
            eventContent(arg, createElement) {
                const arrayOfDomNodes = self.fullcalendarService.setEventContent(arg);
                return { domNodes: arrayOfDomNodes };

            },

            eventDidMount(el) {
                self.fullcalendarService.eventsAfterMount(el, today);
            },
            eventMouseEnter(ev) {
                self.fullcalendarService.createTooltip(ev);
            },
            eventMouseLeave(ev) {
                if (!self.mobile) {
                    const tooltips = document.body.getElementsByClassName('tooltip-span');
                    while (tooltips.length > 0) {
                        tooltips[0].parentNode.removeChild(tooltips[0]);
                    }
                }
            },
            async select(arg) {
                const slot = self.fullcalendarService.onSelectSlot(arg);
                const slotToBook = {
                    start: arg.start,
                    id: '0',
                    extendedProps: {
                        slotDuration: slot.duration,
                        scheduleId: scheduleId,
                        time: slot.start,
                        dateTime: slot.dateTime,
                        serviceTypeMap: []
                    }

                };

                await self.bookSlot(slotToBook);


            }
        };
    }

    fullcalendarClick(event: any) {
        this.auth.userAuthorities$.pipe(take(1)).subscribe(
            async authorities => {
                // tslint:disable-next-line:no-shadowed-variable
                const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                const style = event.el.style;

                switch (event.event.extendedProps.available) {
                    case 'hasBooking':
                        const appointmentId = event.event.extendedProps.appointmentId;
                        let cssClass = '';
                        if (!mobile) {
                            cssClass = 'appointment-modal';
                        }
                        if (appointmentId) {
                            await this.modalService.openAppointmentModal(AppointmentComponent, appointmentId, this.translate.getLocale(), cssClass, false,
                                false, this.scheduleId,
                                null, null, this.fullCalendar, this.routerOutlet.nativeEl, true);
                        } else if (event.event.extendedProps.multipleSpotInfo) {
                            const slot = event.event.extendedProps;
                            await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, '', this.routerOutlet.nativeEl, this.pickedSchedule.scheduleId);
                        }
                        break;
                    case 'true':
                        if (!authorities.includes('SUBPROVIDER_SCHED_VIEW')) {
                            const calEvent = event.event;
                            let cssClass = '';
                            if (!this.mobile) {
                                cssClass = 'booking-modal';
                                if (calEvent.extendedProps.multipleSpots) {
                                    cssClass = 'booking-multiple-modal';
                                } else if (!calEvent.extendedProps.noDuration) {
                                    cssClass = 'booking-duration-modal';
                                }
                            }

                            if (!this.scheduleService.simplifiedMode) {
                                if (event.event.start >= today) {
                                    if (style.opacity !== '0.5') {
                                        this.scheduleService.selectedSlots.push(event);
                                        style.opacity = '0.5';
                                    } else {
                                        this.scheduleService.selectedSlots = this.scheduleService.selectedSlots.filter(item => item.event.start.toUTCString() !== event.event.start.toUTCString());
                                        style.opacity = '1';
                                    }
                                }
                            } else {
                                if (event.event.start >= today) {
                                    cssClass = cssClass + '-simple';
                                    let cssMobileClass = '';
                                    if (!mobile || this.tablet) {
                                        cssMobileClass = cssClass;
                                    }
                                    await this.modalService.openBookingModal(BookingmodalComponent, event.event, this.translate.getLocale(), cssMobileClass, this.selectedScheduleName, this.routerOutlet.nativeEl,
                                        this.pickedSchedule.scheduleId, undefined, undefined, undefined, true);
                                }
                            }
                        }
                        break;
                    case 'false':
                        if (!authorities.includes('SUBPROVIDER_SCHED_VIEW')) {
                            if (event.event.start >= today) {
                                this.scheduleService.setOpacityBack();

                                const slot = event.event.extendedProps;
                                const multipleSpots = slot.multipleSpots;
                                const spotsLeft = slot.spotsLeft;

                                if (multipleSpots && spotsLeft === 0) {

                                    let cssClass = 'appointment-summary-modal';
                                    if (mobile && !tablet) {
                                        cssClass = '';
                                    }

                                    await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, cssClass, this.routerOutlet.nativeEl, this.pickedSchedule.scheduleId);


                                } else {

                                    await this.alert.presentAlert(
                                        this.scheduleService.showDateAndTime(event.event, this.translate),
                                        undefined,
                                        this.translate.getFromKey('sched-makeAvailableMessage'),
                                        [
                                            {
                                                text: this.translate.getFromKey('close'),
                                                role: 'cancel'
                                            },
                                            {
                                                text: this.translate.getFromKey('submit'),
                                                handler: () => {
                                                    // fullcalendarService.scheduleIsLoading = true;
                                                    this.updateSlotSub$ = this.auth.getCurrentToken().subscribe(
                                                        token => {
                                                            if (token) {
                                                                const slotIds = [];
                                                                slotIds.push(event.event.id);
                                                                const updateForm = {
                                                                    events: slotIds,
                                                                    scheduleId: this.pickedSchedule.scheduleId,
                                                                    slotDatetime: slot.dateTime,
                                                                    slotDuration: slot.slotDuration
                                                                };

                                                                this.scheduleService.modifySlot(token, updateForm, '/update/slot').subscribe(
                                                                    async response => {
                                                                        // this.fullcalendarService.scheduleIsLoading = false;
                                                                        switch (response.message) {
                                                                            case 'bindingError':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-choose-hours-error'), alertPosition, 'danger', 6000);
                                                                                break;
                                                                            case 'hasBooking':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-hasBookingMessage'), alertPosition, 'danger', 6000);
                                                                                break;
                                                                            case 'invalidInterval':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-invalid-interval'), alertPosition, 'danger', 6000);
                                                                                break;
                                                                            case 'optimisticException':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger', 6000);
                                                                                break;
                                                                            case 'schedError':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError'), alertPosition, 'danger', 6000);
                                                                                break;
                                                                            case 'invalidTiming':
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-invalid-timing'), alertPosition, 'danger', 6000);
                                                                                break;

                                                                            default:
                                                                                this.fullcalendarService.refetchSlots();
                                                                                await this.toast.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);

                                                                        }

                                                                    }, async error => {
                                                                        // fullcalendarService.scheduleIsLoading = false;
                                                                        await this.toast.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);
                                                                    }
                                                                );

                                                            }
                                                        });

                                                }
                                            }
                                        ]
                                    );
                                }
                            }
                        }
                        break;
                }


            }
        );

    }


    async bookSlot(slot?: any) {
        this.appointmentService.additionalSlots$.next(null);
        let calEvent;
        if (slot) {
            calEvent = slot;
        } else {
            calEvent = this.scheduleService.selectedSlots[0].event;
        }
        let cssClass = 'booking-modal';
        if (calEvent.extendedProps.multipleSpots) {
            cssClass = 'booking-multiple-modal';
        } else if (!calEvent.extendedProps.noDuration) {
            cssClass = 'booking-duration-modal';
        }

        let cssMobileClass = '';
        if (!mobile || this.tablet) {
            cssMobileClass = cssClass;
        }

        if (this.scheduleService.selectedSlots.length > 1) {
            const selectedSlots = [];
            this.scheduleService.selectedSlots.forEach(
                slot => {
                    const availableSlot = JSON.parse(JSON.stringify(slot.event.extendedProps));
                    availableSlot.id = slot.event.id;
                    selectedSlots.push(availableSlot);
                }
            );

            this.appointmentService.additionalSlots$.next(selectedSlots);
        }
        await this.modalService.openBookingModal(BookingmodalComponent, calEvent, this.translate.getLocale(), cssMobileClass,
            this.selectedScheduleName, this.routerOutlet.nativeEl, this.pickedSchedule.scheduleId, undefined, undefined, undefined, false, !!slot);
        this.scheduleService.setOpacityBack();
    }

    async editSlot() {
        let cssClass = '';
        if (!this.mobile) {
            cssClass = 'modify-slot-modal';
        }
        await this.modalService.openModifySlotModal(ModifySlotComponent, this.scheduleService.selectedSlots, this.translate.getLocale(),
            this.scheduleId, cssClass, false, true, this.routerOutlet.nativeEl);
    }

    async unavailableSlot() {
        const noDuration = this.scheduleService.selectedSlots[0].event['extendedProps'].noDuration;
        if (noDuration) {

            let cssClass = '';
            if (!this.mobile) {
                cssClass = 'modify-slot-modal';
                if (!this.scheduleService.selectedSlots[0].event.extendedProps.noDuration) {
                    cssClass = 'modify-fixed-slot-modal';
                }
            }
            await this.modalService.openModifySlotModal(ModifySlotComponent, this.scheduleService.selectedSlots, this.translate.getLocale(), this.scheduleId, cssClass, false,
                false, this.routerOutlet.nativeEl);
        } else {
            await this.alert.presentAlert(
                this.translate.getFromKey('sched-unavailable'),
                undefined,
                undefined,
                [
                    {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                    },
                    {
                        text: this.translate.getFromKey('submit'),
                        handler: () => {
                            this.fullcalendarService.scheduleIsLoading = true;
                            this.updateSlotSub$ = this.auth.getCurrentToken().subscribe(
                                token => {
                                    if (token) {
                                        this.deleteOfModifySlots(token, '/update');
                                    }
                                });

                        },
                        cssClass: 'actionsheet-submit'
                    }
                ]
            );
        }
    }

    private async setPreferredView() {
        // fullcalendar preferred view
        const start = await this.localStorage.getItem('BOOKanAPPPreferredStart');
        const end = await this.localStorage.getItem('BOOKanAPPPreferredEnd');
        const view = await this.localStorage.getItem('BOOKanAPPPreferredView');
        const slotDuration = await this.localStorage.getItem('BOOKanAPPPreferredSlotDuration');
        const parsedDuration = JSON.parse(slotDuration.value);

        this.preferredStart = JSON.parse(start.value);
        this.preferredEnd = JSON.parse(end.value);
        this.preferredView = JSON.parse(view.value);


        if (parsedDuration === '5') {
            this.preferredSlotDuration = '05';
        } else {
            this.preferredSlotDuration = parsedDuration;
        }
    }

    async editSchedule(scheduleId: string) {
        let cssClass = '';
        if (!this.mobile || tablet) {
            cssClass = 'booking-modal';
        }

        await this.modalService.openScheduleEditModal(EditscheduleComponent, scheduleId, cssClass, this.routerOutlet.nativeEl);
    }


    // click on open schedule in the sidenav
    async openSchedule(schedule: Schedule) {
        this.backSchedule();
        setTimeout(async () => {
            {
                // set value on picker
                this.scheduleForm.controls.schedule.setValue(schedule.scheduleId);

                this.scheduleService.selectedSlots = [];

                // close multiple schedules
                this.dayScheduleSelected = false;
                await this.onSelectSchedule(schedule);
                if (mobile && !tablet) {
                    this.sidenavService.scheduleSideNav = false;
                }
            }

        }, 50);


    }

    async onSelectSchedule(schedule: Schedule) {
        this.pickedSchedule =  {
            scheduleId: schedule.scheduleId,
            multipleSpots: schedule.multi,
            noDuration: schedule.noDuration,
            scheduleName: schedule.scheduleName,
            serviceSchedule: schedule.service,
            freeSchedule: schedule.freeSchedule
        };
        this.scheduleSelected = true;
        this.scheduleId = schedule.scheduleId;
        this.selectedScheduleName = schedule.scheduleName;
        this.selectedSchedule = schedule;
        if (schedule.scheduleName.split('$$$')[1]) {
            const nameAndFree = schedule.scheduleName.split('$$$')[1].split('###');
            this.selectedScheduleName = nameAndFree[0];
            this.fullcalendarService.freeSchedule = nameAndFree[1].toLowerCase() === 'true';
        }
        this.scheduleListSelected = true;

        await this.setPreferredView();

        this.options = this.fullCalendarOptions(schedule.scheduleId, schedule.freeSchedule);
        setTimeout(() => {
            this.gotodateService.currentFullcalendar = this.fullCalendar;
            this.fullcalendarService.fullCalendar$.next(this.fullCalendar);
        }, 100);

    }

    async deleteSchedule(schedule: Schedule) {
        const scheduleId = schedule.scheduleId;
        const scheduleName = schedule.scheduleName;
        await this.alert.presentAlert(
            scheduleName,
            null,
            this.translate.getFromKey('sched-delete-specialist-sure'),
            [
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('delete'),
                    handler: () => {
                        this.confirmDelete(scheduleId);
                    }
                },
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                }
            ]
        );

    }

    confirmDelete(scheduleId: string) {
        this.isLoading = true;
        this.deleteScheduleSub$ = this.auth.getCurrentToken().subscribe(
            token => {
                if (token) {
                    this.scheduleService.deleteSchedule(token, scheduleId).subscribe(
                        async response => {
                            this.isLoading = false;
                            switch (response.message) {
                                case 'Invalid schedule':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-invalidSchedule'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;
                                case 'existingApp':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-existing-apps1'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;
                                case 'deleteError':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-deleteSpecialistError'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;
                                default:
                                    await this.toast.presentToast(this.translate.getFromKey('sched-deleteSpecialistSuccess'), alertPosition, 'success' , 2000);
                                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                        this.router.navigateByUrl('/user/management/schedule?refresh=true'));

                            }
                        }, async error => {
                            this.isLoading = false;
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-deleteSpecialistError'), [   {
                                text: this.translate.getFromKey('close'),
                                role: 'cancel'
                            }]);
                        }
                    );

                }
            });
    }


    async newSchedule() {
        this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
            async authorities => {
                if ((authorities.includes('ROLE_BASIC'))  && this.schedules$.value.length > 0) {
                    await this.showScheduleLimitAlert();
                    return;
                } else if ((authorities.includes('ROLE_PLUS'))  && this.schedules$.value.length > 4) {
                    await this.showScheduleLimitAlert();
                    return;
                } else if ((authorities.includes('ROLE_PRO'))  && this.schedules$.value.length > 9) {
                    await this.showScheduleLimitAlert();
                    return;
                } else if ((authorities.includes('ROLE_BUSINESS'))  && this.schedules$.value.length > 19) {
                    await this.showScheduleLimitAlert();
                    return;
                } else {
                    let cssClass = '';
                    if (!this.mobile || this.tablet) {
                        cssClass = 'booking-modal';
                    }

                    await this.modalService.openScheduleModal(ScheduleComponent, cssClass, false, this.routerOutlet.nativeEl);
                }
            }
        );

    }

    private async showScheduleLimitAlert() {
        return await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('upgrade-more-schedules'), [
            {
                text: this.translate.getFromKey('close'),
                role: 'destructive'

            },
            {
                text: this.translate.getFromKey('upgrade-plan'),
                handler: async () => {
                    await this.router.navigateByUrl('/user/profile/payments');
                }

            },

        ]);
    }




    backSchedule() {
        this.selectedDate = undefined;
        this.scheduleId = undefined;
        this.selectedScheduleName = undefined;
        this.scheduleSelected = false;
        this.dayScheduleSelected = false;
        this.pickedSchedule = undefined;
    }

    async infoPopover(info: string, event: any) {
        await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event);
    }

    private deleteOfModifySlots(token, url) {
        const ids = [];
        const dateTimes = [];
        const durations = [];
        this.scheduleService.selectedSlots.forEach(
            slot => {
                const event = slot.event.extendedProps;
                ids.push(slot.event.id);
                durations.push(event.slotDuration);
                if (slot.event.id === '0') {
                    dateTimes.push(event.dateTime);
                } else {
                    dateTimes.push('1970-01-01T00:00:00');
                }
            }
        );

        const slotForm = {
            events: ids,
            scheduleId: this.pickedSchedule.scheduleId,
            slotDateTimes: dateTimes,
            slotDurations: durations
        };


        this.scheduleService.modifySlot(token, slotForm, url + '/slot').subscribe(
            async response => {
                switch (response.message) {
                    case 'bindingError':
                        await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger' , 6000);
                        break;
                    case 'hasBooking':
                        await this.toast.presentToast(this.translate.getFromKey('sched-hasBookingMessage'), alertPosition, 'danger' , 6000);
                        break;
                    case 'optimisticException':
                        await this.toast.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger' , 6000);
                        break;
                    case 'schedError':
                        await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError') + ' ' + this.translate.getFromKey('please-error'), alertPosition, 'danger', 6000);
                        break;
                    case 'invalidTiming':
                        await this.toast.presentToast(this.translate.getFromKey('sched-invalid-timing'), alertPosition, 'danger', 6000);
                        break;
                    default:
                        this.scheduleService.setOpacityBack();
                        this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
                        await this.toast.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);

                }

            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError') + ' ' + this.translate.getFromKey('please-error'), alertPosition, 'danger', 6000);
            }
        );
    }

    refresh() {
        this.fullcalendarService.slotsLoading = true;
        this.fullcalendarService.scheduleIsLoading = true;
        this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
    }

    refreshDayView() {
        this.refreshSubject.next(true);
        setTimeout(() =>
            this.refreshSubject.next(false), 1000);

    }

    doRefresh(event: any) {
        if (this.scheduleSelected || this.dayScheduleSelected) {
            if (this.scheduleSelected) {
                this.refresh();
                event.target.complete();
            }

            if (this.dayScheduleSelected) {
                this.refreshDayView();
                event.target.complete();
            }
        } else {
            event.target.complete();
        }

    }

    showUTCDate(dateTime: any) {
        const date = Date.UTC(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
        return this.timeUtilService.showUTCDate(this.translate.getLocale(), date);
    }

    async getBookingInfo() {
        const slot = this.scheduleService.selectedSlots[0].event.extendedProps;

        let cssClass = 'appointment-summary-modal';
        if (mobile && !tablet) {
            cssClass = '';
        }

        await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration,
            cssClass, this.routerOutlet.nativeEl, this.scheduleId);
        this.scheduleService.setOpacityBack();
    }

    async openMultipleBookingsModal() {

        let cssClass = 'appointment-modal';
        if (mobile && !tablet) {
            cssClass = '';
        }
        await this.modalService.openMultipleBookingsModal(MultipleBookingsComponent, this.pickedSchedule, cssClass,
            this.translate.getLocale(), this.scheduleService.simplifiedMode);
    }

    dateClass() {
        return dateClass();
    }


    allowToBook() {
        return (this.scheduleService.selectedSlots.length === 1 && this.scheduleService.selectedSlots[0].event.extendedProps.noDuration &&
            this.scheduleService.selectedSlots.length > 0 && !this.scheduleService.selectedSlots[0].event['extendedProps'].serviceSchedule) || (
            this.scheduleService.selectedSlots.length > 0  && !this.scheduleService.selectedSlots[0].event['extendedProps'].noDuration &&
            this.scheduleService.selectedSlots.length > 0 && !this.scheduleService.selectedSlots[0].event['extendedProps'].serviceSchedule
        );
    }

    async shareSchedule(schedule: Schedule) {
        const provider = this.auth.getLoggedUser().value;

        let invitationLink = '';
        if (provider.invitationLink) {
            invitationLink = '&invitationLink=' + provider.invitationLink;
        }

        const url = 'https://www.bookanapp.com/search/provider/' + provider.id + '?schedule=' + schedule.scheduleId + invitationLink;
        const x = document.createElement('TEXTAREA') as HTMLTextAreaElement;
        x.value = url;
        document.body.appendChild(x);
        x.select();
        document.execCommand('copy');
        document.body.removeChild(x);
        await this.toast.presentToast(this.translate.getFromKey('schedule-copied'), alertPosition, 'primary', 2000);
    }
}
