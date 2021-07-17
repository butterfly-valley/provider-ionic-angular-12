import {Injectable, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DateAdapter} from '@angular/material';
import {Observable} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LocalizationService {

  constructor(private translate: TranslateService) { }

  // locale storage locale key
  private storedLocaleKey = 'bookanappLocale';

  // change user's locale
  changeLocale(locale: string) {
    this.translate.setDefaultLang(locale);
    this.storeLocale(locale);
  }

  // try to get locale from localStorage and set if not found
  getLocale() {
    const myStorage = window.localStorage;
    let storedLocale = myStorage.getItem(this.storedLocaleKey);
    if (!storedLocale) {
      storedLocale = 'pt-PT';
      this.storeLocale(storedLocale);
    }
    return storedLocale;
  }

  // store locale in locale storage
  private storeLocale(locale: string) {
    const myStorage = window.localStorage;
    myStorage.setItem(this.storedLocaleKey, locale);
  }

  // return localized string from key
  getFromKey(key: string) {
    return this.translate.instant(key);
  }

  getObservableFromKey(key: string): Observable<string> {
    return this.translate.get(key);
  }

  /*set material design locale*/
  setMaterialLocale(dateAdapter: DateAdapter<any>) {
    const locale = this.getLocale();
    dateAdapter.setLocale(locale);

    if (locale !== 'en-US') {
      dateAdapter.getFirstDayOfWeek = () => {
        return 1;
      };
    }

  }
  getStoredLocale() {
    return window.localStorage.getItem(this.storedLocaleKey);
  }
}
