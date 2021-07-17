import { Injectable } from '@angular/core';
import {BASE_URL} from '../../app.component';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Employee, Schedule, SimpleServerResponse, Subdivision, TimeRequest} from '../../store/models/provider.model';
import {BehaviorSubject} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  BASE_URL = 'http://localhost:8087' + '/employee';
  ROSTER_BASE_URL = 'http://localhost:8087' + '/employee/roster';
  AUTH_HEADER = 'Bearer ';

  employee$ = new BehaviorSubject<Employee>(null);
  imageSrc$ = new BehaviorSubject<string | ArrayBuffer>('no-pic');
  renderRosters = false;


  constructor(private http: HttpClient) { }

  getAllEmployees(token, page, employeesPerPage, employeeId?: string, subdivisionId?: string, divisionId?: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('page', String(page));
    params = params.append('employeesPerPage', String(employeesPerPage));
    if (employeeId) {
      params = params.append('employeeId', String(employeeId));
    }
    if (subdivisionId) {
      params = params.append('subdivisionId', String(subdivisionId));
    }
    if (divisionId) {
      params = params.append('divisionId', String(divisionId));
    }
    return this.http.get(this.BASE_URL + '/get', { headers: tokenHeaders, params: params});
  }


  getAllEmployeesForRosterView(token) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Employee[]>(this.BASE_URL + '/roster/get/all', { headers: tokenHeaders});
  }

  getEmployee(token, id) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get(this.BASE_URL + '/get/' + id, { headers: tokenHeaders});
  }

  getSchedules(token) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Schedule[]>(this.BASE_URL + '/get/schedules', { headers: tokenHeaders});
  }

  createEmployee(token: string, value: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/create', value, { headers: tokenHeaders});
  }

  uploadAvatar(token: string, file: any, id: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', file, file.name);
    return this.http.post(this.BASE_URL + '/upload/image/' + id, formData,{ headers: tokenHeaders});
  }

  deleteAvatar(token: string, id: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get(this.BASE_URL + '/delete/image/' + id, { headers: tokenHeaders});
  }

  editEmployee(token: string, value: any, id) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/edit/' + id, value, { headers: tokenHeaders});
  }

  deleteEmployees(token: string, ids: {idsToDelete: any[]}) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/delete', ids, { headers: tokenHeaders});
  }

  searchEmployees(token: string, searchTerm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('term', String(searchTerm));
    return this.http.get(this.BASE_URL + '/search', { headers: tokenHeaders, params: params});

  }

  uploadRoster(token: string, rosterForm: any, subdivision: boolean) {
    let url = '/roster/upload';
    if (subdivision) {
      url = url + '/subdivision';
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + url, rosterForm, { headers: tokenHeaders});
  }

  uploadDivision(token: string, divisionForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/division/update', divisionForm, { headers: tokenHeaders});
  }

  loadSubdivisions(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Subdivision[]>(this.BASE_URL + '/subdivision/all',  { headers: tokenHeaders});
  }

  /**
   * get list of all available roster colors
   */
  loadAllSlotColors(token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get(this.ROSTER_BASE_URL + '/get/colors', { headers: tokenHeaders});
  }

  publishOrDeleteRoster(token: string, deleteOrPublishForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/roster/publish', deleteOrPublishForm, { headers: tokenHeaders});
  }

  searchRosters(token: string, searchTerm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('term', String(searchTerm));
    return this.http.get(this.BASE_URL + '/roster/search', { headers: tokenHeaders, params: params});

  }

  getAllAnonymousEmployeesForRosterView(employeeId?: string, subdivisionId?: string, divisionId?: string) {
    let params = new HttpParams();
    if (employeeId) {
      params = params.append('employeeId', employeeId);
    }

    if (subdivisionId) {
      params = params.append('subdivisionId', subdivisionId);
    }

    if (divisionId) {
      params = params.append('divisionId', divisionId);
    }
    return this.http.get<Employee[]>('http://localhost:8087/roster/employees', { params: params});
  }

  getAllEmployeesForSharedRosterView(token: string, employeeId?: string, subdivisionId?: string, divisionId?: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    if (employeeId) {
      params = params.append('employeeId', employeeId);
    }

    if (subdivisionId) {
      params = params.append('subdivisionId', subdivisionId);
    }

    if (divisionId) {
      params = params.append('divisionId', divisionId);
    }
    return this.http.get<Employee[]>(this.ROSTER_BASE_URL + '/employees', { params: params, headers: tokenHeaders});
  }

  getTimeRequestsForEmployee(token: string, id: number) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<TimeRequest[]>(this.BASE_URL + '/get/time/list/' + id, { headers: tokenHeaders});
  }


  approveTimeRequest(token: string, requestId: number, deny: boolean) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('requestId', String(requestId));
    if (deny) {
      params = params.append('deny', 'true');
    }
    return this.http.get<SimpleServerResponse>(this.ROSTER_BASE_URL + '/approve/absence',  { headers: tokenHeaders, params: params});
  }


}
