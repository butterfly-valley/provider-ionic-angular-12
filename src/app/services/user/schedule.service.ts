import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Schedule, ScheduleCategory} from '../../store/models/provider.model';
import {DateTimeUtilService} from '../util/date-time-util.service';
import {LocalizationService} from '../localization/localization.service';
import {LocalStorageService} from '../localstorage/local-storage.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  BASE_URL = 'http://localhost:8086' + '/provider/schedule';
  PROVIDER_SERVICE_URL = 'http://localhost:8083/user';
  AUTH_HEADER = 'Bearer ';

  // selected slots
  selectedSlots = [];

 /* toggle picked schedules in appointments page*/
  schedules = [];

  simplifiedMode = false;
  imageSrc: string | ArrayBuffer;
  schedule$ = new BehaviorSubject<Schedule>(null);

   constructor(private http: HttpClient,
               private dateTimeUtil: DateTimeUtilService,
               private localStorage: LocalStorageService) {
     this.localStorage.getItem('BOOKanAPP-simplified-mode').then(
         start => {
           if (start && start.value) {
             this.simplifiedMode = true;
           }
         }
     );
   }

  setOpacityBack() {
    this.selectedSlots.forEach(
        event => {
          event.el.style.opacity = 1;
        }
    );

    this.selectedSlots = [];
  }

  /*display event date and time*/
  showDateAndTime(event: any, translate: LocalizationService) {
   return  this.dateTimeUtil.showUTCTime(translate.getLocale(), event['extendedProps'].dateTime, event['extendedProps'].duration);
  }

  getSchedules(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<ScheduleCategory[]>(this.BASE_URL + '/get', { headers: tokenHeaders});
  }

  getSchedule(token: string, scheduleId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Schedule>(this.BASE_URL + '/get/schedule/' + scheduleId, { headers: tokenHeaders});
  }

  editSchedule(token: string, scheduleEditForm) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<Schedule>(this.BASE_URL + '/edit/schedule', scheduleEditForm , { headers: tokenHeaders});
  }
  getCalendarEvents(token: string, scheduleId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const params = new HttpParams().set('scheduleId', scheduleId);
    return this.http.get(this.BASE_URL + '/view/schedule.json', { headers: tokenHeaders, params});
  }

  uploadAvatar(token: string, fileToUpload: File, scheduleId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.http.post<any>(this.BASE_URL + '/upload/image/' + scheduleId, formData, { headers: tokenHeaders});
  }

  deleteAvatar(token: string, scheduleId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/delete/image/' + scheduleId, { headers: tokenHeaders});
  }

  getOpsHoursAndSchedules(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/get/opshours_schedules', { headers: tokenHeaders});
  }

  getOpsHours(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.PROVIDER_SERVICE_URL + '/get/opshours', { headers: tokenHeaders});
  }
  uploadNewSchedule(token: string, scheduleForm, url) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + url, scheduleForm, { headers: tokenHeaders});
  }

  uploadNewScheduleCopy(token: string, scheduleForm, url) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + url, scheduleForm, { headers: tokenHeaders});
  }


  deleteSchedule(token: string, scheduleId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/delete/schedule/' + scheduleId, { headers: tokenHeaders});
  }

  deleteSlots(token: string, scheduleId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/delete/slots/' + scheduleId, { headers: tokenHeaders});
  }

  uploadSlots(token: string, scheduleId, slotForm) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/edit/slots/' + scheduleId, slotForm, { headers: tokenHeaders});
  }

  modifySlot(token: string, slotForm, url) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + url, slotForm, { headers: tokenHeaders});
  }

  async toggleSimplifiedMode(event: CustomEvent) {
    this.simplifiedMode = event.detail.checked;
    this.setOpacityBack();
    if (this.simplifiedMode) {
      await this.localStorage.writeObject('BOOKanAPP-simplified-mode', true);
    } else {
      await this.localStorage.removeItem('BOOKanAPP-simplified-mode');
    }
  }

}
