import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, tap} from 'rxjs/operators';
import {MapsAPILoader} from '@agm/core';
import {FormGroup} from '@angular/forms';
import {Provider} from '../../store/models/provider.model';
import {BASE_URL, mobile} from '../../app.component';
import {BehaviorSubject} from 'rxjs';
import {LocalStorageService} from '../localstorage/local-storage.service';

export interface CalendarEvent {
  slotDuration: number;
  title: string;
  start: any;
  startTime: string;
  end: any;
  color: string;
  id: string;
  dateTime: Date;
  duration: number;
  description: string;
  restriction: string;
  numberOfSpots: number;
  multipleSpots: boolean;
  spotsLeft: number;
  name: string;
  availabilityCategory: string;
  serviceTypeMap: Array<Map<number, Map<string, string>>>;
  noDuration: boolean;
  demandPhone: boolean;
  userHasPhone: boolean;
  scheduleName: string;
  service: boolean;
  scheduleId: string;
  multipleSpotInfo: MultipleSpotInfo[];
  linkedToServiceSchedule: boolean;
}

export interface MultipleSpotInfo {
  bookingName: string;
  bookedSpots: string;
  remark: string;
  bookanapp: boolean;
  appointmentId: string;
  scheduleName: string;
  scheduleCategory: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  /*available categories*/
  private categories = [
    'PETS',
    'PLUMBING',
    'AUTO',
    'MOVERS',
    'EVENTS',
    'NOTARY',
    'LAWYER',
    'IT',
    'CLINICS',
    'MASSAGE',
    'RESTAURANT',
    'FITNESS',
    'DENTIST',
    'TATTOO',
    'REPAIRS',
    'MISC',
    'HAIRDRESSER',
    'TUTOR'
  ];

  private radiuses = [
    5,
    10,
    20,
    30,
    50,
    100
  ];

  /*coordinates extracted from google autocomplete*/
  public coordinates = new BehaviorSubject<string>(null);
  /*location extracted from google autocomplete*/
  public location = new BehaviorSubject<string>(null);

  private loadedProviders$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient,
              private localStorage: LocalStorageService) { }

  /*fetch providers on user's search by name*/
  onProviderSearchAutocomplete(term: string) {
    return this.http.get<Provider[]>(BASE_URL + '/search/autocomplete_provider?term=' + term)
        .pipe(map(
            providers => {
              return providers;
            }
        ));
  }

  /*  fetch providers using url*/
  returnProvidersFromServer(url: string) {
    return this.http.get<any>(url);
  }

  /*set behaviorSubject with providers*/
  setLoadedProviders(url: string) {
    return this.returnProvidersFromServer(url).pipe(tap(data => {
      data[1].forEach(provider => {
        if (provider.image === null || provider.image === undefined) {
          provider.image = 'https://s3.eu-west-3.amazonaws.com/static-user/img/sem-imagem.jpg';
        }
      });
      this.loadedProviders$.next(data);
    }));
  }

  /*return behaviorSubject with providers*/
  getLoadedProviders() {
    return this.loadedProviders$;
  }

  getCategories() {
    return this.categories;
  }

  getRadiuses() {
    return this.radiuses;
  }

  /*process search form submit and return observable list*/
  async onSearch(searchForm: FormGroup, nearBy: string, token?: string) {
    let searchCoordinates: any;
    let location: string;
    if (this.coordinates.value) {
      searchCoordinates = this.coordinates.value;
      location = this.location.value.replace(' ', '+');
    }

    if (nearBy) {
      searchCoordinates = nearBy;
      location = 'nearme';
    }

    /* set url*/
    const baseUrl = BASE_URL + '/search/rest/providers?category=' + searchForm.value.category +
        '&distance=' + searchForm.value.radius +
        '&location=' + location + '&coordinates=' + searchCoordinates;


    /* save last search in local storage and then redirect*/
    await this.localStorage.removeItem('bookanappLastSearch');
    await this.localStorage.writeObject('bookanappLastSearch', baseUrl);

    return this.setLoadedProviders(baseUrl);

  }


  /* returns single provider*/
  getProvider(providerId: string, invitationLink?: string) {
    let urlVariable;
    if (invitationLink) {
      urlVariable = providerId + '?invitationLink=' + invitationLink;
    } else {
      urlVariable = providerId;
    }
    return this.http.get<Provider>(BASE_URL + '/search/rest/provider/' + urlVariable);
  }

  /*returns list of events from calendar selection*/
  getCalendarEvents(date: Date, providerId: number, scheduleId?: string, service?: string) {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -5);
    let url = BASE_URL + '/search/rest/provider/' + providerId + '/events.json?start=' + isoDate + '&end=' + isoDate;

    if (scheduleId !== null && scheduleId !== undefined) {
      url = url + '&schedule=' + scheduleId;
    }

    if (service !== null && service !== undefined) {
      url = url + '&service=' + service;
    }

    return this.http.get<CalendarEvent[]>(url);
  }

  /*star or unstar the favourite providers*/
  starProvider(token: string, providerId: number) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + token);
    return this.http.post<any>(BASE_URL + '/rest/favourite/provider', {providerId: providerId}, { headers: tokenHeaders});
  }

  redirectToProviderPage(provider: Provider) {
    let mobileAppLink = '';
    if (mobile) {
      mobileAppLink = '/schedule';
    }

    if (provider.invitationLink) {
      return '/search/provider/' + provider.id + mobileAppLink + '?invitationLink=' + provider.invitationLink;
    } else {
      return '/search/provider/' + provider.id + mobileAppLink;
    }
  }

  addSearchToRecentList(request: any, token: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + token);
    return this.http.post<any>(BASE_URL + '/rest/search/add/recent', request,  { headers: tokenHeaders});
  }


}
