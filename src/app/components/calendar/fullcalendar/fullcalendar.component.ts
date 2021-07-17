import {AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {AuthService} from '../../../services/auth/auth.service';
import {CalendarOptions, FullCalendarComponent} from '@fullcalendar/angular';
import {BehaviorSubject, Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import {AppointmentComponent} from '../../modals/appointment/appointment.component';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {ScheduleService} from '../../../services/user/schedule.service';
import {BookingmodalComponent} from '../../modals/bookingmodal/bookingmodal.component';
import {ModifySlotComponent} from '../../modals/modifyslot/modify-slot.component';
import {ActionSheetController, AlertController, IonRouterOutlet} from '@ionic/angular';
import {AppSummaryComponent} from '../../modals/app-summary/app-summary.component';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
    selector: 'app-fullcalendar',
    templateUrl: './fullcalendar.component.html',
    styleUrls: ['./fullcalendar.component.scss'],
})
export class FullCalendarScheduleComponent implements OnDestroy, AfterViewInit, AfterViewChecked, OnInit {

    @Input() selectedDate: Date;
    @Input() scheduleId: string;
    @Input() scheduleName: string;
    @Input() scheduleCategory: string;
    @Input() avatar: string;
    @Input() token: string;
    @Input() refresh: BehaviorSubject<boolean>;

    mobile = mobile;
    tablet = tablet;

    fullcalendarSub$: Subscription;
    /*get access to fullcalendar element*/
    @ViewChild('fullCalendar', {static: false}) fullCalendar: FullCalendarComponent;

    calendarEvents: any[];
    calendarEvents$ = new BehaviorSubject<any[]>(null);

    notRendered = true;

    isLoading = false;

    updateSlotSub$: Subscription;
    refreshSub$: Subscription;
    viewEvent;

    selectedSlots = [];
    selectedSlot = false;
    options: any;

    constructor(public fullcalendarService: FullcalendarService,
                private auth: AuthService,
                private changeDetector: ChangeDetectorRef,
                private translate: LocalizationService,
                private toast: ToastService,
                private alert: AlertService,
                private modalService: ModalService,
                private scheduleService: ScheduleService,
                private actionSheetController: ActionSheetController,
                private alertController: AlertController,
                private routerOutlet: IonRouterOutlet) {
    }

    ngOnInit() {
        this.options = this.fullCalendarOptions(this.scheduleId, this.selectedDate);
    }

    /* fullcalendar options*/
    fullCalendarOptions(scheduleId: string, pickedDate: Date, eventClick: void): CalendarOptions {
        const self = this;
        const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

        return {
            events(fetchInfo, successCallback, failureCallback) {
                self.fullcalendarService.populateEvents(fetchInfo, successCallback, scheduleId);
            },
            async eventClick(arg) {
                await self.fullcalendarClick(arg);

            },
            allDaySlot: false,
            selectable: true,
            selectMirror: true,
            initialView: 'dayGridDay',
            initialDate: pickedDate,
            height: 'auto',
            headerToolbar: {
                left: '',
                center: 'title',
                right: ''
            },
            plugins: [dayGridPlugin],
            locale: self.fullcalendarService.getFullcalendarLocale(this.translate),
            // @ts-ignore
            eventTimeFormat: self.fullcalendarService.eventTimeFormat(),
            eventContent(arg, element) {
                const arrayOfDomNodes = self.fullcalendarService.setEventContent(arg);
                return { domNodes: arrayOfDomNodes };

            },
            eventDidMount(el) {
                self.fullcalendarService.eventsAfterMount(el, today);
            }
        };
    }

    ngAfterViewInit(): void {
        this.fullcalendarService.multipleFullcalendars.push(this.fullCalendar);
        this.calendarEvents$.subscribe(
            events => {
                if (events && events.length > 0 && this.notRendered) {
                    const api = this.fullCalendar.getApi();
                    // api.rerenderEvents();
                    api.prev();
                    api.next();
                    this.notRendered = false;
                    this.fullcalendarService.scheduleIsLoading = false;
                }
            }

        );

    }

    ngAfterViewChecked(): void {
        this.changeDetector.detectChanges();
    }

    ngOnDestroy(): void {
        if (this.fullcalendarSub$) {
            this.fullcalendarSub$.unsubscribe();
        }

        if (this.refreshSub$) {
            this.refreshSub$.unsubscribe();
        }

        if (this.updateSlotSub$) {
            this.updateSlotSub$.unsubscribe();
        }
    }

    async fullcalendarClick(event: any) {
        this.auth.userAuthorities$.pipe(take(1)).subscribe(
            async authorities => {
                const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                switch (event.event.extendedProps.available) {
                    case 'hasBooking':
                        const appointmentId = event.event.extendedProps.appointmentId;
                        let cssClass = '';
                        if (!mobile) {
                            cssClass = 'appointment-modal';
                        }
                        if (appointmentId) {
                            // tslint:disable-next-line:max-line-length
                            await this.modalService.openAppointmentModal(AppointmentComponent, appointmentId, this.translate.getLocale(), cssClass,
                                // tslint:disable-next-line:max-line-length
                                false, false, this.scheduleId, this.selectedDate, undefined, this.fullCalendar, this.routerOutlet.nativeEl, true);
                        } else if (event.event.extendedProps.multipleSpotInfo) {
                            const slot = event.event.extendedProps;
                            await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, '', this.routerOutlet.nativeEl, this.scheduleId);
                        }
                        break;
                    case 'true':
                        if (!authorities.includes('SUBPROVIDER_SCHED_VIEW')) {
                            const calEvent = event.event;
                            let cssClass = 'booking-modal';
                            if (calEvent.extendedProps.multipleSpots) {
                                cssClass = 'booking-multiple-modal';
                            } else if (!calEvent.extendedProps.noDuration) {
                                cssClass = 'booking-duration-modal';
                            }

                            let scheduleName = this.scheduleName;
                            if (this.scheduleCategory) {
                                if (this.scheduleCategory !== 'default') {
                                    scheduleName = scheduleName + '(' + this.scheduleCategory + ')';
                                } else {
                                    scheduleName = scheduleName + '(' + this.translate.getFromKey('provider-null-reference') + ')';
                                }
                            }

                            if (event.event.start >= today) {
                                this.selectedSlot = true;
                                this.selectedSlots = [];
                                this.selectedSlots.push(event);

                                const hasMultipleSpotApp = event.event['extendedProps'].multipleSpotInfo;

                                let multipleSpotsInfoSlot = undefined;

                                if (!this.scheduleService.simplifiedMode) {
                                    const actionSheet = await this.actionSheetController.create({
                                        header: this.scheduleService.showDateAndTime(event.event, this.translate),
                                        buttons: this.actionSheetButtons(cssClass, scheduleName, event.event['extendedProps'])
                                    });
                                    await actionSheet.present();
                                } else {
                                    cssClass = cssClass + '-simple';
                                    this.selectedSlots.push(event);
                                    await this.bookSlot(cssClass, scheduleName, true);
                                }
                            }

                        }
                        break;
                    case 'false':
                        if (event.event.start >= today && !authorities.includes('SUBPROVIDER_SCHED_VIEW')) {

                            const slot = event.event.extendedProps;
                            const multipleSpots = slot.multipleSpots;
                            const spotsLeft = slot.spotsLeft;

                            if (multipleSpots && spotsLeft === 0) {

                                let cssClass = 'appointment-summary-modal';
                                if (mobile && !tablet) {
                                    cssClass = '';
                                }

                                // tslint:disable-next-line:max-line-length
                                await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, cssClass,
                                    this.routerOutlet.nativeEl, this.scheduleId);
                            } else {


                                await this.alert.presentAlert(
                                    this.scheduleName,
                                    this.scheduleService.showDateAndTime(event.event, this.translate),
                                    this.translate.getFromKey('sched-makeAvailableMessage'),
                                    [
                                        {
                                            text: this.translate.getFromKey('close'),
                                            role: 'cancel'

                                        },
                                        {
                                            text: this.translate.getFromKey('submit'),
                                            handler: () => {
                                                this.isLoading = true;
                                                this.updateSlotSub$ = this.auth.getCurrentToken().subscribe(
                                                    token => {
                                                        if (token) {
                                                            const slotIds = [];
                                                            slotIds.push(event.event.id);
                                                            const updateForm = {
                                                                events: slotIds
                                                            };
                                                            this.scheduleService.modifySlot(token, updateForm, '/update/slot').subscribe(
                                                                async response => {
                                                                    this.isLoading = false;
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
                                                                            await this.toast.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);
                                                                        // this.loadSlots(token, this.viewEvent);
                                                                    }

                                                                }, async error => {
                                                                    this.isLoading = false;
                                                                    await this.toast.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);
                                                                }
                                                            );

                                                        }
                                                    });

                                            }
                                        }
                                    ]
                                    , 'available-alert');
                            }
                        }
                        break;
                }
            });

    }

    private actionSheetButtons(cssClass: string, scheduleName: string, slot: any): any[] {

        if (slot.serviceSchedule) {
            return [
                {
                    text: this.translate.getFromKey('sched-update-timing'),
                    cssClass: 'action-sheet-button-secondary',
                    icon: 'create',
                    handler: async () => {
                        await this.editSlot();
                        this.selectedSlot = false;
                    }
                }, {
                    text: this.translate.getFromKey('sched-unavail'),
                    cssClass: 'action-sheet-button-danger',
                    icon: 'remove-circle',
                    handler: async () => {
                        await this.unavailableSlot();
                        this.selectedSlot = false;
                    }
                },
                {
                    text: this.translate.getFromKey('cancel'),
                    icon: 'close',
                    role: 'cancel',
                    handler: async () => {
                        this.selectedSlot = false;
                    }

                },
            ];

        } else if (!slot.service) {
            if (slot.linkedToServiceSchedule) {
                if (slot.multipleSpotInfo) {
                    return [{
                        text: this.translate.getFromKey('book'),
                        cssClass: 'action-sheet-button-secondary',
                        icon: 'calendar',
                        handler: async () => {
                            await this.bookSlot(cssClass, scheduleName);
                            this.selectedSlot = false;

                        }
                    },
                        {
                            text: this.translate.getFromKey('info'),
                            cssClass: 'action-sheet-button-secondary',
                            icon: 'information-circle-outline',
                            handler: async () => {
                                let cssClass = 'appointment-summary-modal';
                                if (mobile && !tablet) {
                                    cssClass = '';
                                }

                                await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, cssClass, this.routerOutlet.nativeEl, this.scheduleId);
                                this.selectedSlot = false;

                            }
                        },
                        {
                            text: this.translate.getFromKey('cancel'),
                            icon: 'close',
                            role: 'cancel',
                            handler: () => {
                                this.selectedSlot = false;
                            }

                        },
                    ];
                } else {
                    return [{
                        text: this.translate.getFromKey('book'),
                        cssClass: 'action-sheet-button-secondary',
                        icon: 'calendar',
                        handler: async () => {
                            await this.bookSlot(cssClass, scheduleName);
                            this.selectedSlot = false;

                        }
                    },
                        {
                            text: this.translate.getFromKey('cancel'),
                            icon: 'close',
                            role: 'cancel',
                            handler: () => {
                                this.selectedSlot = false;
                            }

                        },
                    ];
                }
            } else {

                if (!slot.multipleSpotInfo) {

                    return [{
                        text: this.translate.getFromKey('book'),
                        cssClass: 'action-sheet-button-secondary',
                        icon: 'calendar',
                        handler: async () => {
                            await this.bookSlot(cssClass, scheduleName);
                            this.selectedSlot = false;

                        }
                    }, {
                        text: this.translate.getFromKey('sched-update-timing'),
                        cssClass: 'action-sheet-button-secondary',
                        icon: 'create',
                        handler: async () => {
                            await this.editSlot();
                            this.selectedSlot = false;
                        }
                    }, {
                        text: this.translate.getFromKey('sched-unavail'),
                        cssClass: 'action-sheet-button-danger',
                        icon: 'remove-circle',
                        handler: async () => {
                            await this.unavailableSlot();
                            this.selectedSlot = false;
                        }
                    },
                        {
                            text: this.translate.getFromKey('cancel'),
                            icon: 'close',
                            role: 'cancel',
                            handler: () => {
                                this.selectedSlot = false;
                            }

                        },
                    ]
                } else {
                    return [{
                        text: this.translate.getFromKey('book'),
                        cssClass: 'action-sheet-button-secondary',
                        icon: 'calendar',
                        handler: async () => {
                            await this.bookSlot(cssClass, scheduleName);
                            this.selectedSlot = false;

                        }
                    },
                        {
                            text: this.translate.getFromKey('info'),
                            cssClass: 'action-sheet-button-secondary',
                            icon: 'information-circle-outline',
                            handler: async () => {
                                let cssClass = 'appointment-summary-modal';
                                if (mobile && !tablet) {
                                    cssClass = '';
                                }

                                await this.modalService.openAppSummaryModal(AppSummaryComponent, slot.dateTime, slot.multipleSpotInfo, slot.duration, cssClass, this.routerOutlet.nativeEl, this.scheduleId);
                                this.selectedSlot = false;

                            }
                        },
                        {
                            text: this.translate.getFromKey('sched-update-timing'),
                            cssClass: 'action-sheet-button-secondary',
                            icon: 'create',
                            handler: async () => {
                                await this.editSlot();
                                this.selectedSlot = false;
                            }
                        }, {
                            text: this.translate.getFromKey('sched-unavail'),
                            cssClass: 'action-sheet-button-danger',
                            icon: 'remove-circle',
                            handler: async () => {
                                await this.unavailableSlot();
                                this.selectedSlot = false;
                            }
                        },
                        {
                            text: this.translate.getFromKey('cancel'),
                            icon: 'close',
                            role: 'cancel',
                            handler: () => {
                                this.selectedSlot = false;
                            }

                        },
                    ];
                }
            }
        }
    }

    async bookSlot(cssClass, scheduleName, simple?) {
        let cssMobileClass = '';
        if (!mobile) {
            cssMobileClass = cssClass;
        }
        await this.modalService.openBookingModal(BookingmodalComponent, this.selectedSlots[0].event, this.translate.getLocale(), cssMobileClass, scheduleName, this.routerOutlet.nativeEl,
            this.scheduleId, this.selectedDate, undefined, this.fullCalendar, simple);
    }

    async editSlot() {
        let cssClass = '';
        if (!this.mobile) {
            cssClass = 'modify-slot-modal';
        }
        await this.modalService.openModifySlotModal(ModifySlotComponent, this.selectedSlots, this.translate.getLocale(), this.scheduleId, cssClass,
            false, true, undefined,  this.fullCalendar);

    }

    async unavailableSlot() {
        const noDuration = this.selectedSlots[0].event['extendedProps'].noDuration;
        if (noDuration) {
            let cssClass = '';
            if (!mobile) {
                cssClass = 'modify-slot-modal';
            }
            await this.modalService.openModifySlotModal(ModifySlotComponent, this.selectedSlots, this.translate.getLocale(), this.scheduleId, cssClass, false, false, this.fullCalendar);
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
                    },

                ]
            );
        }
    }

    // async deleteSlot() {
    //     await this.alert.presentAlert(
    //         this.translate.getFromKey('sched-delete-timing'),
    //         undefined,
    //         undefined,
    //         [
    //             {
    //                 text: this.translate.getFromKey('close'),
    //                 role: 'cancel'
    //
    //             },
    //             {
    //                 text: this.translate.getFromKey('delete'),
    //                 cssClass: 'actionsheet-delete',
    //                 handler: () => {
    //                     this.fullcalendarService.scheduleIsLoading = true;
    //                     this.updateSlotSub$ = this.auth.getCurrentToken().subscribe(
    //                         token => {
    //                             if (token) {
    //                                 this.deleteOfModifySlots(token, '/delete');
    //                             }
    //                         });
    //
    //                 }
    //             }
    //         ]
    //     );
    // }


    // loadSlots(token, event) {
    //     if (token) {
    //         this.fullcalendarService.fetchEvents(token, this.scheduleId, this.selectedDate, event.view.activeEnd).subscribe(
    //             async response => {
    //                 this.calendarEvents = response;
    //                 this.calendarEvents$.next(response);
    //                 this.fullcalendarService.scheduleIsLoading = false;
    //                 this.fullcalendarSub$.unsubscribe();
    //                 this.isLoading = false;
    //             }
    //         );
    //     } else {
    //         this.fullcalendarSub$.unsubscribe();
    //         this.isLoading = false;
    //     }
    // }

    private deleteOfModifySlots(token, url) {
        const ids = [];
        const dateTimes = [];
        const durations = [];
        this.selectedSlots.forEach(
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
            scheduleId: this.scheduleId,
            slotDateTimes: dateTimes,
            slotDurations: durations
        };


        this.scheduleService.modifySlot(token, slotForm, url + '/slot/slotless').subscribe(
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
                        this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
                }

            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError') + ' ' + this.translate.getFromKey('please-error'), alertPosition, 'danger', 6000);
            }
        );
    }


}
