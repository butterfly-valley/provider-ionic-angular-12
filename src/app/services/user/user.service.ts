import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {matchValidator} from '../../components/forms/matchvalidator';
import {SignInForm} from '../../components/forms/signin.model';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {alertPosition, BASE_URL} from '../../app.component';
import {Provider} from '../../store/models/provider.model';
import {DeviceInfo} from '../../components/rest/loginrequest.model';
// @ts-ignore
import { } from '@types/googlemaps';
import {BehaviorSubject} from 'rxjs';
import {LocalizationService} from '../localization/localization.service';
import {CountryISO} from 'ngx-intl-tel-input';
import {ToastService} from '../overlay/toast.service';

export interface Category {
  category: string;
  translation: string

}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  BASE_URL = 'http://localhost:8083' + '/user';

  JWT_TOKEN = 'Bearer ';

  /*available categories*/
  private categories = [
    'BEAUTY',
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

  provider$ = new BehaviorSubject<Provider>(null);

  field  = new BehaviorSubject<string>(null);


  preferredCountries = [CountryISO.Portugal,
    CountryISO.Mozambique,
    CountryISO.UnitedKingdom,
    CountryISO.Spain,
    CountryISO.UnitedStates];

  phoneTypeOptions = {
    header: this.translate.getFromKey('pay-type')
  };
  searchCategoryOptions = {
    header: this.translate.getFromKey('prof-category'),
    mode: 'md'
  };

  countryOptions = {
    header: this.translate.getFromKey('reg-country'),
    mode: 'md'
  };

  editCompanyName: boolean;
  editName: boolean;
  editUsername: boolean;
  editPhone: boolean;
  editAddress: boolean;
  editPassword: boolean;
  editNotifications: boolean;
  editVAT: boolean;
  editServices: boolean;
  editLocale: boolean;


  constructor(private signInForm: SignInForm,
              private http: HttpClient,
              private translate: LocalizationService) {
  }

  getProfileForm(provider: Provider) {
    return new FormGroup({
      username: new FormControl(null, [Validators.email, Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
      name: new FormControl(null, [Validators.minLength(3), Validators.maxLength(30)]),
      companyName: new FormControl(null, [Validators.minLength(3), Validators.maxLength(30)]),
      phones:  new FormArray([]),
      address: new FormGroup({
        street1: new FormControl(null),
        street2: new FormControl(null),
        postalCode: new FormControl(null),
        city: new FormControl(null),
        province: new FormControl(null),
        country: new FormControl(null),
        coordinates: new FormControl(null)
      }),
      oldPassword: new FormControl(null, Validators.pattern('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[A-Z]).*$')),
      newPassword: new FormControl(null, Validators.compose([
        // 2. check whether the entered password has a number
        this.signInForm.patternValidator(/\d/, {hasNumber: true}),
        // 3. check whether the entered password has upper case letter
        this.signInForm.patternValidator(/[A-Z]/, {hasCapitalCase: true}),
        // 4. check whether the entered password has a lower-case letter
        this.signInForm.patternValidator(/[a-z]/, {hasSmallCase: true}),
        // 6. Has a minimum length of 8 characters
        Validators.minLength(8)])),
      confirmPassword: new FormControl(null, Validators.compose([matchValidator('newPassword')])),
      emailBookingNotification: new FormControl(provider.emailBookingNotification),
      emailMessageNotification: new FormControl(provider.emailMessageNotification),
      pushBookingNotification: new FormControl(provider.pushBookingNotification),
      pushMessageNotification: new FormControl(provider.pushMessageNotification),
      locale: new FormControl(provider.locale),
      vat: new FormControl(null, [Validators.minLength(8), Validators.maxLength(15)]),
      serviceType: new FormControl(null)

    });
  }

  updateProfile(token: string, editProfileForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.JWT_TOKEN + token);
    return this.http.post<any>(this.BASE_URL + '/edit', editProfileForm, { headers: tokenHeaders});
  }

  deleteProfile(token: string, deviceInfo: DeviceInfo) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.JWT_TOKEN + token);
    return this.http.post<any>(this.BASE_URL + '/delete', deviceInfo, { headers: tokenHeaders});
  }


  /*update preferred locale for emails and sms*/
  updateLocale(token: string, locale: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.JWT_TOKEN + token);
    const params = new HttpParams().set('lang', locale);
    return this.http.get<any>(this.BASE_URL + '/edit/locale', { headers: tokenHeaders, params: params});
  }


  getCategories() {
    const translatedCategories: Category[] = [];
    this.categories.forEach(
        category => {
          translatedCategories.push({
            category: category,
            translation: this.translate.getFromKey(category)
          });
        }
    );
    return translatedCategories.sort((a, b) => a.translation.localeCompare(b.translation));
  }

  async processServerError(message, toast: ToastService) {
    switch (message) {
      case 'bindingError':
        await toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
        break;
      case 'currPasswordErr':
        await toast.presentToast(this.translate.getFromKey('prof-errorPasswordCurrEmail'), alertPosition, 'danger' , 4000);
        break;
      case 'editAddressSearchFail':
        await toast.presentToast(this.translate.getFromKey('prof-editAddressSearchFail'), alertPosition, 'danger' , 4000);
        break;
      case 'editAddressError':
        await toast.presentToast(this.translate.getFromKey('prof-editAddressError'), alertPosition, 'danger' , 4000);
        break;
      case 'errorPasswordEqual':
        await toast.presentToast(this.translate.getFromKey('prof-errorPasswordEqual'), alertPosition, 'danger' , 4000);
        break;
      case 'phoneTypeError':
        await toast.presentToast(this.translate.getFromKey('phone-type-error'), alertPosition, 'danger' , 4000);
        break;
      default:
        await toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
        break;
    }
  }

  setPhoneFields(provider: Provider, editAccountForm: FormGroup, formChanged) {
    provider.phones.forEach(
        phone => {
          this.addPhoneField(editAccountForm, formChanged, phone.phoneType, '+'+phone.code+phone.number);
        }
    );
  }

  addPhoneField( editAccountForm: FormGroup, formChanged, type?, phone?) {
    const formArray = editAccountForm.get('phones') as FormArray;
    let preselectedType = 'LANDLINE';
    if (type) {
      preselectedType = type;
    }
    formArray.push(new FormGroup({
      type: new FormControl(preselectedType, Validators.required),
      phone: new FormControl(phone, Validators.required)
    }));
    if (type || phone) {
      formChanged = false;
    }

  }

  resetEditFields() {
    this.editCompanyName = false;
    this.editName = false;
    this.editUsername = false;
    this.editPhone = false;
    this.editAddress = false;
    this.editPassword = false;
    this.editNotifications = false;
    this.editVAT = false;
    this.editServices = false;
    this.editLocale = false;
  }

}

