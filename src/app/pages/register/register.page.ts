import {ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, tablet} from '../../app.component';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {LocalizationService} from '../../services/localization/localization.service';
import {MatStepper} from '@angular/material/stepper';
import {SignInForm} from '../../components/forms/signin.model';
import {Subscription} from 'rxjs';
import {CountryISO} from 'ngx-intl-tel-input';
import {CountryCodesService} from '../../services/arrays/countrycodes.service';
import {PageService} from "../../services/user/page.service";
import {MapsAPILoader} from "@agm/core";
import {SignupService} from "../../services/signup/signup.service";
import {ToastService} from "../../services/overlay/toast.service";
import {ActivatedRoute, Router} from "@angular/router";
import {LocalStorageService} from "../../services/localstorage/local-storage.service";
import {distinctUntilChanged, take} from "rxjs/operators";


/*available categories*/
export const
    categories = [
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
        'HAIRDRESSER',
        'TUTOR'
    ];

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;
    singUpForm: FormGroup;
    formSubmitted: boolean;

    signUpSub$: Subscription;
    loading = false;
    phoneControls: any;

    @ViewChild('stepper', {static: false}) stepper: MatStepper;
    @ViewChild('submitBtn', {static: false}) submitBtn;

    preferredCountries = [CountryISO.Portugal,
        CountryISO.Mozambique,
        CountryISO.UnitedKingdom,
        CountryISO.Spain,
        CountryISO.UnitedStates];

    euCountries = [
        {country:'Austria',code:'AT',vat:20},
        {country:'Belgium',code:'BE',vat:21},
        {country:'Bulgaria',code:'BG',vat:20},
        {country:'Croatia',code:'HR',vat:25},
        {country:'Cyprus',code:'CY',vat:19},
        {country:'Czech Republic',code:'CZ',vat:21},
        {country:'Denmark',code:'DK',vat:25},
        {country:'Estonia',code:'EE',vat:20},
        {country:'Finland',code:'FI',vat:24},
        {country:'France',code:'FR',vat:20},
        {country:'Germany',code:'DE',vat:19},
        {country:'Greece',code:'EL',vat:24},
        {country:'Hungary',code:'HU',vat:27},
        {country:'Ireland',code:'IE',vat:23},
        {country:'Italy',code:'IT',vat:22},
        {country:'Latvia',code:'LV',vat:21},
        {country:'Lithuania',code:'LT',vat:21},
        {country:'Luxembourg',code:'LU',vat:17},
        {country:'Malta',code:'MT',vat:18},
        {country:'Netherlands',code:'NL',vat:21},
        {country:'Poland',code:'PO',vat:23},
        {country:'Portugal',code:'PT',vat:23},
        {country:'Romania',code:'RO',vat:20},
        {country:'Slovakia',code:'SK',vat:20},
        {country:'Slovenia',code:'SI',vat:22},
        {country:'Spain',code:'ES',vat:21},
        {country:'Sweden',code:'SW',vat:25}];

    vatNumberMandatory = false;
    categories = categories;

    /* get access to autocomplete element*/
    @ViewChild('googlePlacesAutocomplete', {static: false}) googlePlacesAutocomplete: ElementRef;
    showTermsContainer = false;

    addressPicked = '';

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


    constructor(public translate: LocalizationService,
                private formHolder: SignInForm,
                public countryCodesService: CountryCodesService,
                public pageService: PageService,
                private cd: ChangeDetectorRef,
                private mapsAPILoader: MapsAPILoader,
                private signupService: SignupService,
                private toast: ToastService,
                private router: Router,
                private localStorage: LocalStorageService,
                private route: ActivatedRoute) { }

    ionViewWillEnter() {
        this.formSubmitted = false;
        this.singUpForm = this.formHolder.getSignUpForm();
        this.phoneControls = this.singUpForm.get('phones')['controls'];

        /*listen to email confirmation token*/
        this.route.queryParams.pipe(distinctUntilChanged(), take(1)).subscribe(async params => {
            // const referralCode = params.referralCode;
            // if (referralCode) {
            //     this.singUpForm.controls.referralCode.setValue(referralCode);
            // }


            // promo code

            const promoCode = params.promoCode;
            if (promoCode) {
                this.singUpForm.controls.promoCode.setValue(promoCode);
            }
        });

        setTimeout(() => {
            this.pageService.googleMapsAutocomplete(this.googlePlacesAutocomplete.nativeElement,
                this.mapsAPILoader);
        }, 50);

        // set address fields after autocomplete
        this.pageService.location.subscribe(
            value => {
                if (value) {
                    for (let component in this.pageService.componentForm) {
                        // document.getElementById(component).firstElementChild.value = '';
                        // document.getElementById(component).disabled = false;
                    }

                    for (let i = 0; i < value.length; i++) {
                        const addressType = value[i].types[0];
                        if (this.pageService.componentForm[addressType]) {
                            const val = value[i][this.pageService.componentForm[addressType]];
                            this.singUpForm.controls.facilityAddress.get(addressType).setValue(val);
                            this.addressPicked = this.addressPicked + ' ' + val;
                        }
                    }

                    this.pageService.coordinates.subscribe(value1 => {
                        this.singUpForm.controls.facilityAddress.get('coordinates').setValue(value1);
                    });
                    this.cd.detectChanges();
                }
            }
        );
        this.singUpForm.valueChanges.subscribe(
            value => {
                if (value.address.country) {
                    const country = value.address.country;
                    const isEuCountry = this.euCountries.find(el => el.country === country);
                    this.vatNumberMandatory = !!isEuCountry && value.type === 'business';

                }
            }
        )

        /* check if cookies have been accepted*/
        this.localStorage.getItem('BOOKanAPPProviderTerms').then(
            value => {
                if (!value.value) {
                    this.showTermsContainer = true;
                }
            }
        );

    }

    ionViewWillLeave() {
        this.cancelSubs();
    }


    ngOnDestroy(): void {
        this.cancelSubs();
    }
    private cancelSubs() {
        if (this.signUpSub$) {
            this.signUpSub$.unsubscribe();
        }
        this.pageService.location.next(undefined);
    }

    submitForm() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }

    async onSubmitForm() {
        this.formSubmitted = true;
        if (!this.singUpForm.invalid) {
            this.loading = true;
            this.singUpForm.controls.locale.setValue(this.translate.getLocale());
            this.signupService.processSignUp(this.singUpForm.value).subscribe(
                async response => {
                    this.loading = false;
                    const dismissToast = [
                        {
                            text: 'X',
                            role: 'cancel',
                        }
                    ];
                    if (response.message) {
                        switch (response.message) {
                            default:
                                await this.toast.presentToast(this.translate.getFromKey('welcome-regSuccess'), 'top', 'success', null, dismissToast);
                                await this.router.navigateByUrl('/login');
                                break;
                            case 'addressSearchFail':
                                await this.toast.presentToast(this.translate.getFromKey('welcome-regSuccess') + ' ' + this.translate.getFromKey('welcome-addressSearchFail'), 'top', 'warning', null, dismissToast);
                                await this.router.navigateByUrl('/login');
                                break;
                            case 'captchaException':
                                await this.toast.presentToast(this.translate.getFromKey('reg-captchaException'), alertPosition, 'danger', 4000);
                                break;
                            case 'passwordMatchError':
                                await this.toast.presentToast(this.translate.getFromKey('reg-passwordMatchError'), alertPosition, 'danger', 4000);
                                break;
                            case 'regEmailSentError':
                                await this.toast.presentToast(this.translate.getFromKey('reg-regEmailSentError'), alertPosition, 'warning', null, dismissToast);
                                this.formSubmitted = false;
                                this.singUpForm.reset();
                                break;
                            case 'alreadyRegistered':
                                this.formSubmitted = false;
                                await this.toast.presentToast(this.translate.getFromKey('reg-alreadyRegistered'), alertPosition, 'danger', 4000);
                                break;
                            case 'invalidOpsHours':
                                this.formSubmitted = false;
                                await this.toast.presentToast(this.translate.getFromKey('ops-invalid'), alertPosition, 'danger', 4000);
                                break;
                            case 'genericError':
                                this.formSubmitted = false;
                                await this.toast.presentToast(this.translate.getFromKey('welcome-genericError'), alertPosition, 'danger', 4000);
                                break;
                        }
                    } else if(response.errors){

                        let errors = '<p style="text-align: left">' + this.translate.getFromKey('reg-errors') + ':' + '</p>';
                        response.errors.forEach(
                            field => {
                                if (field === 'type') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('account-type-invalid') + '</p>';
                                }

                                if (field === 'username') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('login-email-error') + '</p>';
                                }


                                if (field === 'name') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('sched-name-error') + '</p>';
                                }

                                if (field === 'companyName') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-name-company-error') + '</p>';
                                }

                                if (field === 'address.street1') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-address-error') + '</p>';
                                }

                                if (field === 'address.postalCode') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('navbar-CP4BindError') + '</p>';
                                }

                                if (field === 'address.city') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-place-error') + '</p>';
                                }

                                if (field === 'address.country') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-country-error') + '</p>';
                                }

                                if (field === 'password') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-login-psswd-error') + '</p>';
                                }

                                if (field === 'serviceType') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-service-error') + '</p>';
                                }

                                if (field === 'acceptTerms') {
                                    errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('reg-terms-error') + '</p>';
                                }

                                // if (field === 'captcha') {
                                //   errors = errors + '<p style="text-align: left; margin-left: 16px">' + this.translate.getFromKey('contact-captcha-error') + '</p>';
                                // }

                            }
                        );

                        await this.toast.presentToast(errors, 'top', 'danger', null, dismissToast);


                    } else {
                        this.formSubmitted = false;
                        await this.toast.presentToast(this.translate.getFromKey('welcome-genericError'), alertPosition, 'danger', 4000);
                    }
                } , async error => {
                    this.loading = false;
                    await this.toast.presentToast(this.translate.getFromKey('welcome-genericError'), alertPosition, 'danger' , 4000);
                }
            );

        } else {
            // await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            const invalid = [];
            const controls = this.singUpForm.controls;
            for (const name in controls) {
                if (controls[name].invalid) {
                    invalid.push(name);
                }
            }

            const dismissToast = [
                {
                    text: 'X',
                    role: 'cancel',
                }
            ];

            let errorMessage;

            if (invalid.length > 0) {
                errorMessage = '<p>' + this.translate.getFromKey('reg-errors') + ':' + '</p>';
            }

            // tslint:disable-next-line:forin
            for (const control in invalid) {
                const field = invalid[control];

                if (field === 'name') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('navbar-nameBindError') + '</p>';
                }

                if (field === 'username') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('login-email-error') + '</p>';
                }

                if (field === 'password') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('login-psswd-error') + '</p>';
                }

                if (field === 'matchingPassword') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('reg-psswd-match-error') + '</p>';
                }

                if (field === 'address') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('reg-address-error') + '</p>';
                }

                if (field === 'phones') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('phone-error') + '</p>';
                }

                if (field === 'serviceType') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('reg-service-error') + '</p>';
                }

                if (field === 'acceptTerms') {
                    errorMessage = errorMessage + '<p>' + this.translate.getFromKey('reg-terms-error') + '</p>';
                }

            }

            if (errorMessage) {
                await this.toast.presentToast(errorMessage, alertPosition, 'danger', null, dismissToast);
            } else {

                await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 4000);
            }

            return;
        }

    }

    addPhoneField(type?,phone?) {
        const formArray = this.singUpForm.get('phones') as FormArray;
        let preselectedType = 'LANDLINE';
        if (type) {
            preselectedType = type;
        }
        formArray.push(new FormGroup({
            type: new FormControl(preselectedType, Validators.required),
            phone: new FormControl(phone, Validators.required)
        }));
    }

    removePhone(i: number) {
        const formArray = this.singUpForm.get('phones') as FormArray;
        formArray.removeAt(i);
    }

    nextStep() {
        this.stepper.next();
    }

    prevStep() {
        this.stepper.previous();
    }

    locale() {
        return this.translate.getLocale();
    }

    siteKey() {
        return '6LdCU1QUAAAAABVt5CVo4wefptdH5YRq8xdT5Wbx';
    }

    resetFacilityAddress() {
        this.singUpForm.controls.facilityAddress.reset();
        this.googlePlacesAutocomplete.nativeElement.value = '';
        this.addressPicked = '';
    }

}
