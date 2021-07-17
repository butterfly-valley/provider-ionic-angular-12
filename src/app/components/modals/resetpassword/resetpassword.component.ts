import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {FormGroup} from '@angular/forms';
import {AuthService} from '../../../services/auth/auth.service';
import {SignInForm} from '../../forms/signin.model';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {LoadingService} from '../../../services/loading/loading.service';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {PlatformDetectionService} from "../../../services/platformdetection/platformdetection.service";
import {Router} from "@angular/router";
import {distinctUntilChanged, take} from "rxjs/operators";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss'],
})
export class ResetpasswordComponent implements OnInit, OnDestroy {
  mobile = mobile;
  tablet = tablet;

  @ViewChild('submitBtn', {static: false}) submitBtn;

  @Input() passwordRecoveryToken: string;


  resetPasswordSub$: Subscription;

  passwordResetForm: FormGroup;
  resetFormSubmitted = false;
  showPasswordField = false;
  showConfirmPassword = false;
  isLoading: boolean;
  formChanged: boolean;

  constructor(private modalService: ModalService,
              private auth: AuthService,
              private formHolder: SignInForm,
              private toast: ToastService,
              private translate: LocalizationService,
              private loadingService: LoadingService,
              private platformService: PlatformDetectionService,
              private router: Router) { }

  ngOnInit() {
    this.passwordResetForm = this.formHolder.getPasswordRecoveryForm();
    this.passwordResetForm.valueChanges.subscribe(
        () => {
          if (this.passwordResetForm.valid) {
            this.formChanged = true;
          }
        }
    );
  }

  ngOnDestroy(): void {
    if (this.resetPasswordSub$) {
      this.resetPasswordSub$.unsubscribe();
    }
    this.dismiss();
  }


  showPassword(field: string) {

    if (field === 'password') {
      if (this.showPasswordField) {
        return 'text';
      } else {
        return 'password';
      }
    }

    if (field === 'matchPassword') {
      if (this.showConfirmPassword) {
        return 'text';
      } else {
        return 'password';
      }
    }
  }


  setShowPassword(field: string) {
    if (field === 'password') {
      this.showPasswordField = !this.showPasswordField;
    }

    if (field === 'matchPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  async dismiss() {
    await this.modalService.dismissResetPasswordModal();
  }

  async onSubmit() {
    this.resetFormSubmitted = true;
    if (this.passwordResetForm.valid) {
      this.isLoading = true;
      let resetForm;
      if (this.passwordRecoveryToken) {
        resetForm = {
          password: this.passwordResetForm.controls.password.value,
          matchingPassword: this.passwordResetForm.controls.password.value,
          passwordRecoveryToken: this.passwordRecoveryToken,
          deviceInfo: this.platformService.returnDeviceInfo()
        };

        this.resetPasswordSub$ = this.auth.processPasswordReset(resetForm).subscribe(
            async response => {
              this.processResponse(response.message);
            }, async error => {
              await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), 'bottom', 'danger', 5000);
            }
        );
      } else {
        this.resetPasswordSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
              if (token) {
                resetForm = {
                  jwtToken: token,
                  password: this.passwordResetForm.controls.password.value,
                  matchingPassword: this.passwordResetForm.controls.password.value,
                  deviceInfo: this.platformService.returnDeviceInfo()
                };

                this.auth.processEmployeePasswordReset(token, resetForm).subscribe(
                    response => {
                      this.processResponse(response.message);
                    }, async error => {
                      this.isLoading = false;
                      await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), 'bottom', 'danger', 5000);
                    }
                )
              } else {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), 'bottom', 'danger', 5000);
              }
            }, async error => {
              this.isLoading = false;
              await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), 'bottom', 'danger', 5000);
            }
        );
      }
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
      return;
    }
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  private async processResponse(message: string) {
    this.isLoading = false;
    switch (message) {
      case 'employeePasswordResetSuccess':
        await this.toast.presentToast(this.translate.getFromKey('prof-change-psswd-success'), alertPosition, 'success' , 3000);
        await this.dismiss();
        this.auth.userAuthorities$.pipe(take(1)).subscribe(
            authorities => {
              this.auth.redirectUnauthorizedUser(this.auth.userRole(authorities));
            }
        )
        break;
      case 'passwordResetSuccess':
        await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetSuccess'), alertPosition, 'success' , 3000);
        await this.dismiss();
        break;
      case 'userNotFound':
        await this.toast.presentToast(this.translate.getFromKey('userNotFound'), 'bottom', alertPosition , 4000);
        break;
      case 'passwordResetGenericError':
        await this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetGenericError'), alertPosition, 'danger' , 5000);
        break;
      case 'tokenNotFound':
        await this.toast.presentToast(this.translate.getFromKey('welcome-tokenNotFound'), alertPosition, 'danger' , 5000);
        break;
      case 'bindingError':
        await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger' , 4000);
        break;
    }
  }
}
