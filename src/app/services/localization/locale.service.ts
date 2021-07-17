import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  constructor() { }

  private _locale: string;

  set locale(value: string) {
    this._locale = value;
  }
  get locale(): string {
    return this._locale || 'en-US';
  }

  public setLocale(locale: string) {
    this._locale = locale;
  }

}
