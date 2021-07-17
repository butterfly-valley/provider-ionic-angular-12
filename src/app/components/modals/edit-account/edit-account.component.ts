import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, Subscription, throwError} from "rxjs";
import {Provider} from "../../../store/models/provider.model";
import {FormArray, FormGroup} from "@angular/forms";
import {UserService} from "../../../services/user/user.service";
import {AuthService} from "../../../services/auth/auth.service";
import {LocalizationService} from "../../../services/localization/localization.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {Router} from "@angular/router";
import {CountryCodesService} from "../../../services/arrays/countrycodes.service";
import {catchError} from "rxjs/operators";
import {alertPosition} from "../../../app.component";
import {ModalService} from "../../../services/overlay/modal.service";

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss'],
})
export class EditAccountComponent implements OnInit, OnDestroy {
  @ViewChild('googlePlacesAutocomplete', {static: false}) googlePlacesAutocomplete: ElementRef;
  @ViewChild('submitBtn', {static: false}) submitBtn;

  /* edit profile subscription*/
  editProfileSub$: Subscription;
  providerSub$: Subscription;
  provider$ = new BehaviorSubject<Provider>(null);


  editProfileForm: FormGroup;
  formChanged = false;
  phoneControls: any;
  loadingError;

  field: string;
  isLoading: boolean;
  formSubmitted: boolean;

  constructor(public userService: UserService,
              private auth: AuthService,
              public translate: LocalizationService,
              private toast: ToastService,
              private modalService: ModalService,
              public countryCodesService: CountryCodesService,
              private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.providerSub$ = this.auth.getLoggedUser().subscribe(
        async provider => {
          if (provider){
            this.provider$.next(provider);
            this.setForm(provider);
            if (this.userService.editPhone) {
              this.userService.setPhoneFields(provider, this.editProfileForm, this.formChanged);
            }

          } else {
            this.dismiss();
          }
        },
        catchError((err) => {
          this.loadingError = err;
          return throwError(err);
        })
    );
  }


  ngOnDestroy(): void {
    this.userService.resetEditFields();
    if (this.editProfileSub$) {
      this.editProfileSub$.unsubscribe();
    }

    if (this.providerSub$) {
      this.providerSub$.unsubscribe();
    }

    this.dismiss();
  }




  setForm(provider, reset?) {
    this.phoneControls = undefined;
    this.formChanged = false;

    if (reset) {
      const autocomplete = <HTMLInputElement>this.googlePlacesAutocomplete.nativeElement;
      autocomplete.value = null;
      this.editProfileForm.controls.address = null;
      this.formChanged = false;
    }

    this.editProfileForm = this.userService.getProfileForm(provider);
    this.phoneControls = this.editProfileForm.get('phones')['controls'];
    // listen to user input
    this.editProfileForm.valueChanges.subscribe(() => {
      this.formChanged = this.editProfileForm.valid;
    });

    // console.log(this.editProfileForm.value)
  }



  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  async onEditSubmit() {
    this.formSubmitted = true;
    if (this.editProfileForm.valid) {
      this.isLoading = true;
      this.editProfileSub$ = this.auth.getCurrentToken().subscribe(async token => {
        if (token) {
          this.userService.updateProfile(token, this.editProfileForm.value).subscribe(
              async response => {
                if (response['message']) {
                  await this.userService.processServerError(response['message'], this.toast);
                } else if (response['id']) {
                  this.userService.provider$.next(response);
                  await this.dismiss();
                  this.translate.changeLocale(this.editProfileForm.controls.locale.value);
                  this.changeDetector.detectChanges();
                  await this.toast.presentToast(this.translate.getFromKey('prof-editSuccess'), alertPosition, 'success' , 200);

                } else {
                  await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                }
                this.isLoading = false;
              }, async error => {
                await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                this.isLoading = false;
              }
          );

        } else {
          await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
          this.isLoading = false;
        }
      }, async error => {
        await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
        this.isLoading = false;
      });
    }else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
      return;
    }

  }


  setTitle() {
    if (this.userService.editName) {
      return this.translate.getFromKey('reg-name');
    }
    if (this.userService.editCompanyName) {
      return this.translate.getFromKey('reg-your-company');
    }

    if (this.userService.editUsername) {
      return this.translate.getFromKey('login-email');
    }

    if (this.userService.editVAT) {
      return this.translate.getFromKey('reg-vat');
    }


    if (this.userService.editServices) {
      return this.translate.getFromKey('prof-category');
    }

    if (this.userService.editPhone) {
      return this.translate.getFromKey('phone');
    }

    if (this.userService.editAddress) {
      return this.translate.getFromKey('address-billing');
    }

    if (this.userService.editPassword) {
      return this.translate.getFromKey('login-password');
    }

    if (this.userService.editNotifications) {
      return this.translate.getFromKey('prof-notify-email');
    }

    if (this.userService.editLocale) {
      return this.translate.getFromKey('lang-change');
    }

  }

  removePhone(i: number) {
    const formArray = this.editProfileForm.get('phones') as FormArray;
    formArray.removeAt(i);
  }


  async dismiss() {
    await this.modalService.dismissEditAccountModal();
  }
}
