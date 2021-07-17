import {ChangeDetectorRef, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {alertPosition, BASE_URL} from "../../app.component";
import {ToastService} from "../overlay/toast.service";
import {LocalizationService} from "../localization/localization.service";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {Provider} from "../../store/models/provider.model";
import {ActionSheetController} from "@ionic/angular";
import {MapsAPILoader} from "@agm/core";
import {BehaviorSubject} from "rxjs";
import {take} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class PageService {
  BASE_URL = 'http://localhost:8083' + '/user';
  AUTH_HEADER = 'Bearer ';

  formChanged: boolean;
  editDescription: boolean;
  editOpsHours: boolean;
  editAddressVisible: boolean;
  editRestricted: boolean;
  editAnonymousApps: boolean;
  editAddress: boolean;

  weekdays = [
    {
      name:  'MONDAY',
      checked: false
    },
    {
      name:  'TUESDAY',
      checked: false
    },
    {
      name:  'WEDNESDAY',
      checked: false
    },
    {
      name:  'THURSDAY',
      checked: false
    },
    {
      name:  'FRIDAY',
      checked: false
    },
    {
      name:  'SATURDAY',
      checked: false
    },
    {
      name:  'SUNDAY',
      checked: false
    },

  ];


  pageForm: FormGroup;

  componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
  };

  coordinates = new BehaviorSubject<string>(null);
  location = new BehaviorSubject<any>(null);

  provider$ = new BehaviorSubject<Provider>(null);
  addressPicked;

  constructor(private http: HttpClient,
              private translate: LocalizationService,
              private actionSheetController: ActionSheetController) { }


  uploadImage(token: string, file: any, mainImagePicked: boolean, imageToEdit) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', file, file.name);
    let params = new HttpParams();
    params = params.append('main', String(mainImagePicked));
    if (imageToEdit) {
      params = params.append('currentImage', String(imageToEdit));
    }
    return this.http.post(this.BASE_URL + '/upload/image/', formData,{ headers: tokenHeaders, params: params});
  }

  deleteImage(token: string, imageLink: any, mainImagePicked: boolean) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('main', String(mainImagePicked));
    params = params.append('imageLink', String(imageLink));
    return this.http.get(this.BASE_URL + '/delete/image',{ headers: tokenHeaders, params: params});
  }

  editPageRequest(token: string, value: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/page/edit', value, { headers: tokenHeaders});
  }

  async processServerError(message: any, toast: ToastService) {
    switch (message) {
      case 'bindingError':
        await toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
        break;
      case 'editAddressSearchFail':
        await toast.presentToast(this.translate.getFromKey('prof-editAddressSearchFail'), alertPosition, 'danger' , 4000);
        break;
      case 'invalidOpsHours':
        await toast.presentToast(this.translate.getFromKey('ops-invalid'), alertPosition, 'danger' , 4000);
        break;
      default:
        await toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
        break;
    }
  }

  /*google autocomplete*/
  googleMapsAutocomplete(nativeHomeInputBox, mapsAPILoader: MapsAPILoader) {
    // load Places Autocomplete
    mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete( nativeHomeInputBox as HTMLInputElement, {
        types: ['address'],
        componentRestrictions: {
          country: ['PT', 'MZ', 'PH']
        },
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        /*set search coordinates*/
        this.coordinates.next(lat + ',' + lng);

        /*set search location*/
        this.location.next(place.address_components);

      });
    });
  }

  setForm(provider: Provider, reset?, cd?: ChangeDetectorRef) {

    if (reset) {
      this.resetFields();
      if (cd) {
        cd.detectChanges();
      }
    }
    let restricted = false;
    if (provider.invitationLink) {
      restricted = true;
    }

    this.pageForm = new FormGroup({
      description: new FormControl(provider.description, [Validators.minLength(100), Validators.maxLength(1000)]),
      addressVisible: new FormControl(provider.addressVisible),
      restricted: new FormControl(restricted),
      anonymousApps: new FormControl(provider.allowAnonimousBooking),
      schedule: new FormGroup({
        days: new FormGroup({
          day: new FormArray([])
        })
      }),
      address: new FormGroup({
        route: new FormControl(null),
        street_number: new FormControl(null),
        postal_code: new FormControl(null),
        locality: new FormControl(null),
        administrative_area_level_1: new FormControl(null),
        country: new FormControl(null),
        coordinates: new FormControl(null)
      }),

    });

    // listen to user input
    this.pageForm.valueChanges.pipe(take(1)).subscribe(value => {
      this.formChanged = true;
    });


  }

  resetFields() {
    this.formChanged = false;
    this.editDescription = false;
    this.editOpsHours = false;
    this.editAnonymousApps = false;
    this.editAddressVisible = false;
    this.editRestricted = false;
    this.editAddress = false;
  }

 }
