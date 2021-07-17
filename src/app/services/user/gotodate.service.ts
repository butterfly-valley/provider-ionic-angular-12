import { Injectable } from '@angular/core';
import {FullCalendarComponent} from "@fullcalendar/angular";

@Injectable({
  providedIn: 'root'
})
export class GotodateService {
  currentFullcalendar: FullCalendarComponent;

  constructor() { }
}
