import {Component, OnDestroy} from '@angular/core';
import {Platform} from '@ionic/angular';
import {LocalizationService} from './services/localization/localization.service';
import {Subscription} from 'rxjs';
import {NavigationStart, Router} from '@angular/router';
import {PlatformDetectionService} from './services/platformdetection/platformdetection.service';
import {CountryISO} from 'ngx-intl-tel-input';
import {LocalStorageService} from './services/localstorage/local-storage.service';
// @ts-ignore
import moment from 'moment';
import {MatCalendarCellCssClasses} from '@angular/material/datepicker';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Capacitor} from '@capacitor/core';



export let browserRefresh = false;
export let mobile = false;
export let tablet = false;
// export let BASE_URL = 'http://localhost:8081';
export let alertPosition = 'middle';
export let isIos = false;
export const BASE_URL = 'https://rest.provider.bookanapp.com';
// export let BASE_URL = 'https://test.bookanapp.com';

// *ngIf enter animation
export const standardAnimation = trigger(
    'enterAnimation', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition(':enter', animate('800ms ease-out')),
      transition(':leave', animate('10ms ease-in')),
    ]
);

export const preferredCountries = [
    CountryISO.Portugal,
  CountryISO.Mozambique,
  CountryISO.UnitedKingdom,
  CountryISO.Spain,
  CountryISO.UnitedStates,
CountryISO.Philippines];

export function toggleDarkMode(toggle) {
  document.body.classList.toggle('dark', toggle);
}

export function dateClass() {
  return (date: Date): MatCalendarCellCssClasses => {
    const dayOfWeek = moment(date).format('dddd');
    if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday' || dayOfWeek === 'Sábado' || dayOfWeek === 'Domingo') {
      return 'weekend';
    } else {
      return;
    }
  };
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  // styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {

  appStateSubscription: Subscription;
  constructor(
      private platform: Platform,
      public localizationService: LocalizationService,
      private router: Router,
      private platformService: PlatformDetectionService,
      private localStorage: LocalStorageService

  ) {
    this.initializeApp();
    this.appStateSubscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        browserRefresh = !router.navigated;
      }
    });
    if (this.platformService.isMobile()) {
      mobile = true;
      alertPosition = 'bottom';
    }

    if (this.platformService.isTablet()) {
      tablet = true;

    }

    Device.getInfo().then(
        info => {
          if (info.platform === 'ios') {
            isIos = true;
          }
        }
    );

  }
  initializeApp() {
    this.platform.ready().then(async () => {
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        await Plugins.SplashScreen.hide();
      }

      /*initialize with preferred locale*/
      const storedLocale = this.localizationService.getStoredLocale();
      if (!storedLocale) {
        Device.getLanguageCode()
            .then(res => {
                  if (res.value) {
                    if (res.value === 'pt-PT' || res.value === 'pt-BR' || res.value === 'pt') {
                      this.localizationService.changeLocale('pt-PT');
                    } else  if (res.value === 'ru-RU'  || res.value === 'ru') {
                      this.localizationService.changeLocale('ru-RU');
                    } else {
                      this.localizationService.changeLocale('en-US');
                    }
                  } else {
                    this.localizationService.changeLocale('en-US');
                  }
                }
            ).catch(e => {
              this.localizationService.changeLocale('en-US');
            }
        );
      } else {
        this.localizationService.changeLocale(storedLocale);
      }


      this.localStorage.getObject('BOOKanAPPDarkMode').then(
          value => {
            toggleDarkMode(value);
          }
      );

    });
  }

  ngOnDestroy(): void {
    this.appStateSubscription.unsubscribe();
  }

}
