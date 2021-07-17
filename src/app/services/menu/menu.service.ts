import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  currentRoute = '/user/management/schedule';

  constructor() { }
}
