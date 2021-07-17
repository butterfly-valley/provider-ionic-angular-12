import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {FormGroup} from '@angular/forms';
import {AuthService} from '../../../services/auth/auth.service';
import {SignInForm} from '../../forms/signin.model';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {LoadingService} from '../../../services/loading/loading.service';
import {alertPosition, mobile, tablet} from '../../../app.component';

@Component({
  selector: 'app-resetpasswordsend',
  templateUrl: './resetpasswordsend.component.html',
  styleUrls: ['./resetpasswordsend.component.scss'],
})
export class ResetpasswordsendComponent implements OnInit, OnDestroy {
  mobile = mobile;
  tablet = tablet;

  resetPasswordForm: FormGroup;
  formChanged: boolean;
  isLoading = false;

  @ViewChild('submitBtn', {static: false}) submitBtn;
  formSubmitted: boolean;

  constructor(private modalService: ModalService,
              private auth: AuthService,
              private formHolder: SignInForm,
              private toast: ToastService,
              private translate: LocalizationService) { }

  ngOnInit() {
    this.resetPasswordForm = this.formHolder.getPasswordRecoverySendEmailForm();
    this.resetPasswordForm.valueChanges.subscribe(
        () => {
          this.formChanged = this.resetPasswordForm.valid;
        }
    );
  }

  ngOnDestroy() {
    this.dismiss();
  }

  async dismiss() {
    await this.modalService.dismissResetPasswordEmailSendModal();
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  async onSubmit() {
    this.formSubmitted = true;
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.auth.sendPasswordResetEmail(this.resetPasswordForm.value).subscribe(
          response => {
            this.isLoading = false;
            const dismissToast = [
              {
                text: 'X',
                role: 'cancel',

              }
            ];
            switch (response.message) {
              case 'resetPasswordEmailSent':
                this.toast.presentToast(this.translate.getFromKey('login-resetPasswordEmailSent'), alertPosition, 'success', null, dismissToast);
                this.dismiss();
                break;
              case 'emailNotFoundReset':
                this.toast.presentToast(this.translate.getFromKey('welcome-emailNotFoundReset'), alertPosition, 'danger', 4000);
                break;
              case 'passwordResetEmailGenericError':
                this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), alertPosition, 'danger', 5000);
                break;
              case 'bindingError':
                this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 4000);
                break;
            }
          }, error => {
            this.isLoading = false;
            this.toast.presentToast(this.translate.getFromKey('welcome-passwordResetEmailGenericError'), alertPosition, 'danger', 5000);
          }
      );
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
      return;
    }
  }

  locale() {
    return this.translate.getLocale();
  }

  siteKey() {
    return '6LdCU1QUAAAAABVt5CVo4wefptdH5YRq8xdT5Wbx';
  }

}
