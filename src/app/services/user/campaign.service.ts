import { Injectable } from '@angular/core';
import {BASE_URL} from "../../app.component";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

  BASE_URL = 'http://localhost:8086/provider/customer';
  AUTH_HEADER = 'Bearer ';

  constructor(private http: HttpClient) { }

  sendSMSCampaign(token: string, form: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/send/sms', form,{ headers: tokenHeaders});
  }

  sendPromoCampaign(token: string, form: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/send/promo', form,{ headers: tokenHeaders});
  }
}
