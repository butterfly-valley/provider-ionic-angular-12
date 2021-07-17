import { Injectable } from '@angular/core';
import {BASE_URL} from "../../app.component";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Payment, Plan} from "../../store/models/provider.model";

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  BASE_URL = 'http://localhost:8083/user/payment';
  AUTH_HEADER = 'Bearer ';

  editPlan = false;
  buySMS = false;

  constructor(private http: HttpClient) {}

  getPlan(token) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<Plan>(this.BASE_URL + '/get/plan', { headers: tokenHeaders});
  }

  getPayments(token: string, page, paymentsPerPage) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('pageNumber', String(page));
    params = params.append('paymentsPerPage', String(paymentsPerPage));
    return this.http.get<Payment[]>(this.BASE_URL + '/get', { headers: tokenHeaders, params: params});
  }

  submitPlanPayment(token: string, value) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/submit/plan', value,{ headers: tokenHeaders});
  }
  submitSubscription(token: string, form) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/submit/subscription', form, { headers: tokenHeaders});
  }

    submitSMSPayment(token: string, value: any) {
      const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
      return this.http.post(this.BASE_URL + '/submit/sms', value,{ headers: tokenHeaders});
    }

  submitSMSOrder(token: string, form) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/submit/order', form, { headers: tokenHeaders});
  }
}
