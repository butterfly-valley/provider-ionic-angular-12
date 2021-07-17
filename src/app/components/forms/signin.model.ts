import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import {Injectable} from '@angular/core';
import {matchValidator} from './matchvalidator';

@Injectable({
    providedIn: 'root'
})
export class SignInForm {


    constructor() {
    }

    getSignInForm() {
        return new FormGroup({
            'username': new FormControl(null, [Validators.required, Validators.email, Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
            'password': new FormControl(null, [Validators.required,
                Validators.pattern('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[A-Z]).*$')])
        });
    }

    getPasswordRecoverySendEmailForm() {
        return new FormGroup({
            'username': new FormControl(null, [Validators.required, Validators.email, Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
        });
    }

    getPasswordRecoveryForm() {
        return new FormGroup({
            'password': new FormControl(null, Validators.compose([
                // 1. Password Field is Required
                Validators.required,
                // 2. check whether the entered password has a number
                this.patternValidator(/\d/, { hasNumber: true }),
                // 3. check whether the entered password has upper case letter
                this.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
                // 4. check whether the entered password has a lower-case letter
                this.patternValidator(/[a-z]/, { hasSmallCase: true }),
                // 6. Has a minimum length of 8 characters
                Validators.minLength(8)])),
            'matchingPassword': new FormControl(null, Validators.compose([Validators.required, matchValidator('password')])),
        });
    }

    getSignUpForm() {
        return new FormGroup({
            username: new FormControl(null, [Validators.required, Validators.email, Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
            password: new FormControl(null, Validators.compose([
                // 1. Password Field is Required
                Validators.required,
                // 2. check whether the entered password has a number
                this.patternValidator(/\d/, { hasNumber: true }),
                // 3. check whether the entered password has upper case letter
                this.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
                // 4. check whether the entered password has a lower-case letter
                this.patternValidator(/[a-z]/, { hasSmallCase: true }),
                // 6. Has a minimum length of 8 characters
                Validators.minLength(8)])),
            matchingPassword: new FormControl(null, Validators.compose([Validators.required, matchValidator('password')])),
            plan: new FormControl('BUSINESS', Validators.required),
            name: new FormControl(null, [Validators.minLength(3), Validators.maxLength(30),
                Validators.required]),
            companyName: new FormControl(null, [Validators.minLength(3), Validators.maxLength(50)]),
            phones:  new FormArray([]),
            type: new FormControl('business', [Validators.required, Validators.minLength(8), Validators.maxLength(10)]),
            address: new FormGroup({
                street1: new FormControl(null,[Validators.minLength(3),Validators.required]),
                street2: new FormControl(null),
                postalCode: new FormControl(null, [Validators.minLength(3),Validators.required]),
                city: new FormControl(null,[Validators.minLength(3),Validators.required]),
                province: new FormControl(null),
                country: new FormControl(null, [Validators.minLength(3),Validators.required])
            }),
            facilityAddress: new FormGroup({
                route: new FormControl(null),
                street_number: new FormControl(null),
                postal_code: new FormControl(null),
                locality: new FormControl(null),
                administrative_area_level_1: new FormControl(null),
                country: new FormControl(null),
                coordinates: new FormControl(null)
            }),
            schedule: new FormGroup({
                days: new FormGroup({
                    day: new FormArray([])
                })
            }),
            vat: new FormControl(null),
            serviceType: new FormControl(null, Validators.required),
            acceptTerms: new FormControl(false, [Validators.pattern('true')]),
            phone: new FormControl(null, Validators.pattern('^\\d+$')),
            // recaptcha: new FormControl('', [Validators.required]),
            locale: new FormControl(),
            referralCode: new FormControl(null),
            promoCode: new FormControl(null)
        });
    }

    patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {
            if (!control.value) {
                // if control is empty return no error
                return null;
            }

            // test the value of the control against the regexp supplied
            const valid = regex.test(control.value);

            // if true, return no error (no error), else return error passed in the second parameter
            return valid ? null : error;
        };
    }

}
