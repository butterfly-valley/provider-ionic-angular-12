import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Appointment, CancelResponse} from '../../store/models/user.model';
import {alertPosition, BASE_URL} from '../../app.component';
import {ToastService} from '../overlay/toast.service';
import {LocalizationService} from '../localization/localization.service';
import {LoadingService} from '../loading/loading.service';
import {DateTimeUtilService} from '../util/date-time-util.service';
import {AlertService} from '../overlay/alert.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AuthService} from '../auth/auth.service';
import {ModalService} from '../overlay/modal.service';
import {Router} from '@angular/router';
import {DeviceInfo} from "../../components/rest/loginrequest.model";
import {PlatformDetectionService} from "../platformdetection/platformdetection.service";
import {FullcalendarService} from "./fullcalendar.service";
import * as moment from 'moment';



@Injectable({
    providedIn: 'root'
})
export class AppointmentService {

    appointments$ = new BehaviorSubject<any>(undefined);
    pastAppointments$ = new BehaviorSubject<any>(undefined);

    BASE_URL = 'http://localhost:8086' + '/provider/appointment';

    AUTH_HEADER = 'Bearer ';
    additionalSlots$ = new BehaviorSubject<any>(null);
    appointmentsToCancel = [];

    constructor(private http: HttpClient,
                private timeUtil: DateTimeUtilService,
                private translate: LocalizationService,
                private loadingService: LoadingService,
                private alert: AlertService,
                private auth: AuthService,
                private toast: ToastService,
                private router: Router,
                private platformService: PlatformDetectionService,
                private fullcalendarService: FullcalendarService,
                private modalService: ModalService) { }

    /*get all appointments*/
    getAllAppointments(token: string, page: number, scheduleIds, selectedDate, history: boolean, reverse: boolean, itemsPerPage) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        let params = new HttpParams();
        let url = '/get';
        if (history) {
            url = '/get/history';
        }
        params = params.append('appointmentPage', String(page));
        if (scheduleIds && scheduleIds.length > 0) {
            params = params.append('scheduleId', scheduleIds);
        }
        if (selectedDate) {
            const date = Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const momentDate = moment(moment(date));
            params = params.append('selectedDate', momentDate.toISOString());
        }

        if (reverse) {
            params = params.append('reverse', '');
        }

        if (itemsPerPage) {
            params = params.append('itemsPerPage', itemsPerPage);
        }
        return this.http.get<any>(this.BASE_URL + url, { headers: tokenHeaders, params: params});
    }

    searchAppointments(token: string, term: any, past: any, page: number, itemsPerPage) {
        let url = '/search';
        if (past) {
            url = '/search/history';
        }
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        let params = new HttpParams();
        params = params.append('term', String(term));
        params = params.append('appointmentPage', String(page));
        params = params.append('itemsPerPage', itemsPerPage);
        return this.http.get(this.BASE_URL + url, { headers: tokenHeaders, params: params});

    }

    printAllAppointments(token: string, days: number, scheduleIds, selectedDate) {
        let headers = new HttpHeaders();
        headers = headers.append('Authorization', this.AUTH_HEADER + token);
        headers = headers.append('Accept', 'application/pdf');
        let params = new HttpParams();
        params = params.append('days', String(days));
        if (scheduleIds && scheduleIds.length>0) {
            params = params.append('scheduleId', scheduleIds);
        }
        if (selectedDate) {
            params = params.append('selectedDate', selectedDate.toISOString());
        }
        return this.http.get<Blob>(this.BASE_URL + '/print', { headers: headers, params: params, responseType :
                'blob' as 'json'});
    }

    /*get individual appointment in a modal*/
    getAllAppointmentsBadge(token: string) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.get(this.BASE_URL + '/get/total', { headers: tokenHeaders});
    }

    /*get individual appointment in a modal*/
    getAppointment(token: string, appointmentId: string) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        const params = new HttpParams().set('appointmentId', appointmentId);
        return this.http.get(this.BASE_URL + '/show/appointment', { headers: tokenHeaders, params: params});
    }

    editAppointment(token: string, form: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post(this.BASE_URL + '/edit', form,{ headers: tokenHeaders});

    }

    editAppointmentTime(token: string, form: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post(this.BASE_URL + '/edit/time', form,{ headers: tokenHeaders});

    }

    archiveAppointments(token: string, form: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post(this.BASE_URL + '/archive', {idsToDelete: form}, { headers: tokenHeaders});

    }


    cancelAppointment(token: string, deviceInfo: DeviceInfo, appointmentId?: string, appointmentIds?: string[]) {
        let cancellationRequest;
        if (appointmentId) {
            cancellationRequest = {
                appointmentId: appointmentId,
                deviceInfo: deviceInfo
            };

        } else {
            cancellationRequest = {
                appointmentIds: appointmentIds,
                deviceInfo: deviceInfo
            };
        }

        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post<CancelResponse>(this.BASE_URL + '/cancel', cancellationRequest, {headers: tokenHeaders});
    }

    sendEmailWithAppointmentDetails(token: string, appointmentId: string) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        const params = new HttpParams().set('appointmentId', appointmentId);
        return this.http.get(BASE_URL + '/rest/show/appointments/send/email', {headers: tokenHeaders, params: params});

    }

    sendBookingRequest(request: any, token: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post<any>(this.BASE_URL + '/book', request, { headers: tokenHeaders});
    }

    sendIntervalBookingRequest(request: any, token: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
        return this.http.post<any>(this.BASE_URL + '/book/interval', request, { headers: tokenHeaders});
    }

    /*process cancel button click*/
    async cancel(dateTime: string, cancelAppointmentSubscription$: Subscription, modal: ModalService, appPage: boolean, scheduleId?: string, start?,
                 end?, fullcalendar?, id?: string, ids?: string[]) {
        const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
        const locale = this.translate.getLocale();

        await this.alert.presentAlert(
            dateTime ? this.timeUtil.showLocalDateTime(locale, dateTime) : '',
            this.translate.getFromKey('app-cancel-modal'),
            '',
            [
                {
                    text: this.translate.getFromKey('no'),
                    handler: () => {
                        this.alert.dismiss();
                        const currentAppointments = this.appointments$.value;
                        if (currentAppointments) {
                            currentAppointments.forEach(
                                date => {
                                    date.appointments.forEach(appointment => {
                                            appointment.checked = false;
                                        }
                                    )
                                }
                            )
                        }
                        this.appointments$.next(currentAppointments);
                        this.appointmentsToCancel = [];

                    }

                },
                {
                    text: this.translate.getFromKey('yes'),
                    cssClass: 'actionsheet-delete',
                    handler: () => {
                        loading.present();
                        cancelAppointmentSubscription$ = this.auth.getCurrentToken().subscribe(
                            token => {
                                if (token) {
                                    this.cancelAppointment(token, this.platformService.returnDeviceInfo(), id, ids).subscribe(
                                        async response => {
                                            await this.processCancellation(response, this.translate, this.toast, loading, modal, appPage, token, scheduleId, start, end, fullcalendar);
                                        }, async error1 => {
                                            await this.loadingService.dismissLoading();
                                            await this.toast.presentToast(this.translate.getFromKey('app-cancelGenericError'), alertPosition, 'danger', 3000);
                                        }
                                    );
                                } else {
                                    this.auth.getCurrentToken().subscribe(currentToken => {
                                        if (currentToken) {
                                            this.cancelAppointment(currentToken, this.platformService.returnDeviceInfo(), id, ids).subscribe(
                                                async response => {
                                                    await this.processCancellation(response, this.translate, this.toast, loading, modal, appPage, currentToken, scheduleId, start, end, fullcalendar);
                                                }
                                            );
                                        }
                                    });
                                }
                            }, async error => {
                                await this.loadingService.dismissLoading();
                                await this.toast.presentToast(this.translate.getFromKey('app-cancelGenericError'), alertPosition, 'danger', 3000);
                            }
                        );
                    }

                }
            ]

        );

        return cancelAppointmentSubscription$;
    }

    async processCancellation(response: CancelResponse, translate: LocalizationService, toast: ToastService, loading: any, modal: ModalService,
                              appPage: boolean, token: string, scheduleId: string, start, end, fullcalendar) {
        await this.loadingService.dismissLoading();
        switch (response.message) {
            case 'cancelAppSuccess':
                await toast.presentToast(translate.getFromKey('app-cancelAppSuccess'), alertPosition, 'success', 2000);
                if (appPage) {
                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                        setTimeout(() => {
                            this.router.navigate(['/user/management/appointments'])
                        }, 100));
                } else {
                    if (!fullcalendar) {
                        this.fullcalendarService.refetchSlots();
                    } else {
                        this.fullcalendarService.refetchSlotsForCalender(fullcalendar);
                    }
                }
                if (modal) {
                    await modal.dismissAppointmentModal();
                }
                // update number of active bookings
                const loggedUser = this.auth.getLoggedUser().value;
                const remainingAppointments = (+loggedUser.userStats.appointments - 1);
                if (remainingAppointments > 0) {
                    loggedUser.userStats.appointments = remainingAppointments.toString();
                } else {
                    loggedUser.userStats.appointments = undefined;
                }
                this.auth.setLoggedUser(loggedUser);
                this.appointmentsToCancel = [];

                await this.modalService.dismissAppSummaryModal();
                break;
            case 'notAuth':
                await toast.presentToast(translate.getFromKey('notAuth'), alertPosition, 'danger', 3000);
                break;
            case 'cancelGenericError':
                await toast.presentToast(translate.getFromKey('app-cancelGenericError'), alertPosition, 'danger', 3000);
                break;
            case 'invalidApp':
                await toast.presentToast(translate.getFromKey('app-invalidApp'), alertPosition, 'danger', 3000);
                break;
            case 'optimisticException':
                await toast.presentToast(translate.getFromKey('app-cancelGenericError'), alertPosition, 'danger', 3000);
                break;
            case 'bindingError':
                await toast.presentToast(translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 3000);
                break;
        }
    }

    updateCurrentAppointmentMap(appointment: Appointment, history: boolean) {
        let appointments$ = this.appointments$;
        if (history) {
            appointments$ = this.pastAppointments$;
        }

        const currentAppointmentArray = appointments$.value;
        currentAppointmentArray.forEach(
            element => {
                const elementToReplace = element.appointments.find(el => el.id === appointment.id);
                if (elementToReplace) {
                    element.appointments.splice(element.appointments.indexOf(elementToReplace));
                    if (element.appointments.length === 0) {
                        currentAppointmentArray.splice(currentAppointmentArray.indexOf(element), 1);
                    }
                }
            }
        );
        const date = appointment.appointmentDate.split('T')[0];
        let dateElement = currentAppointmentArray.find(el => el.date.toString() === date.toString());
        if (!dateElement) {
            currentAppointmentArray.push({
                date: date,
                appointments: [appointment]
            })
        } else {
            const dateElementeAppointments = dateElement['appointments'];
            const elementToReplace = dateElementeAppointments.find(el => el.id === appointment.id);
            dateElementeAppointments.splice(currentAppointmentArray.indexOf(elementToReplace), 1);
            dateElementeAppointments.push(appointment);
        }


        currentAppointmentArray.sort((a, b) => (this.getDateFromString(a.date) > this.getDateFromString(b.date)));
        appointments$.next(currentAppointmentArray);
    }

    private getDateFromString(dateString: string) {
        return Date.parse(dateString);
    }



}
