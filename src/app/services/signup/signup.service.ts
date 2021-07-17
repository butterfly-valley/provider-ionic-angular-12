import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BASE_URL} from "../../app.component";

@Injectable({
  providedIn: 'root'
})
export class SignupService {

  BASE_URL = 'http://localhost:8082';

  constructor(private http: HttpClient) { }
  processSignUp(signUpForm: any) {
    return this.http.post<any>(this.BASE_URL + '/provider/signup', signUpForm);
  }

}
