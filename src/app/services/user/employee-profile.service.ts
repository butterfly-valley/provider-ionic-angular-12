import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {BASE_URL} from '../../app.component';
import {Employee, TimeRequest} from '../../store/models/provider.model';
import {BehaviorSubject, Observable} from 'rxjs';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {AlertService} from '../overlay/alert.service';
import {ToastService} from '../overlay/toast.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeProfileService {

  BASE_URL = 'http://localhost:8087' + '/employee/profile';
  AUTH_HEADER = 'Bearer ';

  monthIndexes: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  employee$ = new BehaviorSubject<Employee>(null);
  timeRequests$ = new BehaviorSubject<TimeRequest[]>([]);

  timeOffCalendar$ = new BehaviorSubject<FullCalendarComponent>(null);
  selectedSlots: any[] = [];

  constructor(private http: HttpClient) { }

  getProfile(token) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Employee>(this.BASE_URL + '/get', { headers: tokenHeaders});
  }

  submitTimeOffRequest(token: string, timeOffRequestForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/submit/time-off', timeOffRequestForm, { headers: tokenHeaders});
  }

  submitTimeRequest(token: string, timeRequestForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/submit/time', timeRequestForm, { headers: tokenHeaders});
  }

  deleteTimeOffRequest(token: string, deleteTimeOffRequestForm: any) {
    const form = {
      idsToDelete: deleteTimeOffRequestForm,
    };

    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/delete/time-off', form, { headers: tokenHeaders});
  }

  editProfile(token: string, editProfileForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/edit', editProfileForm, { headers: tokenHeaders});
  }

  uploadTimeRequestAttachment(token: string, fileToUpload: File, requestId) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.http.post<any>(this.BASE_URL + '/submit/time/attachment/' + requestId, formData, { headers: tokenHeaders});
  }

  getTimeRequestAttachment(token: string, requestId: number, key: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('key', key);
    return this.http.get(this.BASE_URL + '/get/time/attachment/' + requestId, { headers: tokenHeaders, responseType: 'blob', params: params});
  }

  getTimeRequests(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<TimeRequest[]>(this.BASE_URL + '/get/time/list', { headers: tokenHeaders});
  }


  deleteTimeRequestAttachment(token: string, requestId: number, key: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('key', key);
    return this.http.get<{message: string}>(this.BASE_URL + '/delete/time/attachment/' + requestId, { headers: tokenHeaders, params: params});
  }

  deleteFamilyMember(token: string, id: number) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<{message: string}>(this.BASE_URL + '/delete/family/' + id, { headers: tokenHeaders});
  }

  deletePhone(token: string, id: number) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<{message: string}>(this.BASE_URL + '/delete/phone/' + id, { headers: tokenHeaders});
  }


  buildAttachment(attachment: string) {
    if (attachment.includes('/')) {
      return attachment.split('/')[1];
    } else {
      return attachment;
    }
  }


}
