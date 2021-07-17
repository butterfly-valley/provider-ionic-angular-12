import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {CountryCodesService} from '../../services/arrays/countrycodes.service';
import {LocalizationService} from '../../services/localization/localization.service';
import {AuthService} from '../../services/auth/auth.service';
import {SignInForm} from '../../components/forms/signin.model';
import {LoadingService} from '../../services/loading/loading.service';
import {PlatformDetectionService} from '../../services/platformdetection/platformdetection.service';
import {alertPosition, mobile, tablet} from '../../app.component';
import {IonRouterOutlet, MenuController} from '@ionic/angular';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastService} from '../../services/overlay/toast.service';
import {LocalStorageService} from '../../services/localstorage/local-storage.service';
import {ModalService} from '../../services/overlay/modal.service';
import {ResetpasswordComponent} from '../../components/modals/resetpassword/resetpassword.component';
import {ResetpasswordsendComponent} from '../../components/modals/resetpasswordsend/resetpasswordsend.component';
import {Subscription} from 'rxjs';
import {distinctUntilChanged, take} from 'rxjs/operators';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('submitBtn', {static: false}) submitBtn;

  signInForm: FormGroup;
  showSignUpForm = false;
  loading: any;
  mobile = mobile;
  tablet = tablet;

  isLoading = false;

  loginFailure: string;

  showLoginPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;

  signUpformSubmitted = false;

  sendVerificationEmail: boolean;
  forgotPassword: boolean;

  loggedUserSub$: Subscription;
  showTermsContainer = false;



  constructor(private localizationService: LocalizationService,
              private authService: AuthService,
              private formHolder: SignInForm,
              private countryCodeService: CountryCodesService,
              private loadingService: LoadingService,
              private platformService: PlatformDetectionService,
              private menu: MenuController,
              private toast: ToastService,
              private router: Router,
              private localStorage: LocalStorageService,
              private modalService: ModalService,
              private route: ActivatedRoute,
              private routerOutlet: IonRouterOutlet
  ) {}



  ngOnInit() {
    this.signInForm = this.formHolder.getSignInForm();

    /*listen to email confirmation token*/
    this.route.queryParams.pipe(distinctUntilChanged(), take(1)).subscribe(async params => {
          const dismissToast = [
            {
              text: 'X',
              role: 'cancel',
            }
          ];

          const redirectedLoginFromUser = params.redirectedLoginFromUser;

          if (redirectedLoginFromUser) {
            await this.toast.presentToast(this.localizationService.getFromKey('login-redirectedLoginFromUser'), 'top', 'warning', null, dismissToast);
          }

          const passwordRecoveryToken = params.passwordRecoveryToken;
          if (passwordRecoveryToken) {
            let cssClass;
            if (!mobile) {
              cssClass = 'reset-password-modal';
            }
            await this.modalService.openResetPasswordModal(ResetpasswordComponent, passwordRecoveryToken, cssClass, this.routerOutlet.nativeEl);
          }
          const forcePasswordChange = params.forcePasswordChange;
          if (forcePasswordChange) {
            let cssClass;
            if (!mobile) {
              cssClass = 'reset-password-modal';
            }
            await this.modalService.openResetPasswordModal(ResetpasswordComponent, undefined, cssClass, this.routerOutlet.nativeEl);
          }


          const emailVerificationToken = params.emailVerificationToken;
          if (emailVerificationToken) {
            this.authService.verifyEmailAddress(emailVerificationToken).subscribe(
                async response => {
                  switch (response.message) {
                    case 'emailNotFoundVerif':
                      await this.toast.presentToast(this.localizationService.getFromKey('welcome-emailNotFoundVerif'), 'top', 'danger', null, dismissToast);
                      break;
                    case 'genericEmailError':
                      await this.toast.presentToast(this.localizationService.getFromKey('welcome-genericEmailVerifError'), 'top', 'danger', null, dismissToast);
                      break;
                    case 'invalidToken':
                      await this.toast.presentToast(this.localizationService.getFromKey('welcome-invalidVerifToken'), 'top', 'danger', null, dismissToast);
                      break;
                    default:
                      await this.toast.presentToast(this.localizationService.getFromKey('welcome-verifSuccess'), 'top', 'success', null, dismissToast);
                      break;

                  }
                }, async error => {
                  await this.toast.presentToast(this.localizationService.getFromKey('welcome-genericEmailVerifError'), alertPosition, 'danger', null, dismissToast);
                }
            );


          }
        }
    );

    /* check if cookies have been accepted*/
    this.localStorage.getItem('BOOKanAPPProviderTerms').then(
        value => {
          if (!value.value) {
            this.showTermsContainer = true;
          }
        }
    );

  }


  /* change form to sign in or sign up*/
  async segmentChanged(ev: any) {
    const value = ev.detail.value;
    this.showSignUpForm = value === 'signUp';
  }

  async ionViewWillEnter() {
    this.loggedUserSub$ = this.authService.getLoggedUser().subscribe(
        user => {
          if (user) {
            this.router.navigateByUrl('/user/management/schedule');
          }
        }
    );
    /*    enable sidemenu*/
    await this.menu.enable(true, 'login');
  }

  ionViewWillLeave() {
    if (this.loggedUserSub$) {
      this.loggedUserSub$.unsubscribe();
    }

  }

  ngOnDestroy(): void {
    if (this.loggedUserSub$) {
      this.loggedUserSub$.unsubscribe();
    }

  }

  onSignIn() {
    this.isLoading = true;
    this.sendVerificationEmail = false;
    this.forgotPassword = false;
    this.authService.requestToken({username: this.signInForm.value.username, password: this.signInForm.value.password, deviceInfo: this.platformService.returnDeviceInfo() }).subscribe(
        async response => {

          if (!response.hasOwnProperty('loginFailure')) {
            this.loginFailure = undefined;
            const jwtToken = response['accessToken'];

            /*store token in local storage*/
            await this.localStorage.writeObject('bookanappProviderJWT', jwtToken);
            await this.localStorage.writeObject('bookanappRefreshProviderJWT', response['refresh_token']);

            // store obtained token in subscription
            this.authService.authToken$.next(jwtToken);

            /*set user to authenticated*/
            this.authService.setAuthenticated(true);

            //store authorities
            this.authService.userAuthorities$.next(response['authorities']);

            /*redirect to user page*/
            if (!response['forcePasswordChange']) {
              await this.authService.redirectUnauthorizedUser(this.authService.userRole(response['authorities']));
              // this.router.navigate(['/user/management/schedule']).then(loaded => {
              // });
            } else {
              await this.modalService.openResetPasswordModal(ResetpasswordComponent, null, '', this.routerOutlet.nativeEl);
            }
            this.isLoading = false;

          } else {
            this.isLoading = false;
            /*handle login failure*/
            switch (response['loginFailure']) {
              case 'Bad credentials':
                this.forgotPassword = true;
                this.loginFailure = this.localizationService.getFromKey('login-failure-credentials');
                break;
              case  'User account has expired':
                this.loginFailure = this.localizationService.getFromKey('login-failure-expired');
                break;
              case  'User account is locked':
                this.loginFailure = this.localizationService.getFromKey('login-failure-disabled');
                break;
              case  'User credentials have expired':
                this.loginFailure = this.localizationService.getFromKey('login-failure-credentials-expired');
                break;
              case  'User is disabled':
                this.sendVerificationEmail = true;
                this.loginFailure = this.localizationService.getFromKey('login-failure-locked');
                break;
              case  'User is userPrincipal':
                window.location.href = 'https://www.bookanapp.com/login';
                break;
              default :
                await this.toast.presentToast(this.localizationService.getFromKey('login-failure'), 'middle', 'danger', null, [{
                  text: 'X',
                  role: 'cancel'
                }]);
            }
          }

        }
        , async error => {
          this.isLoading = false;
          /*handle connection errors*/
          await this.toast.presentToast(this.localizationService.getFromKey('login-failure'), 'middle', 'danger', null, [{
            text: 'X',
            role: 'cancel'
          }]);

        });
  }


  showPassword(field: string) {
    if (field === 'login') {
      if (this.showLoginPassword) {
        return 'text';
      } else {
        return 'password';
      }
    }

  }


  setShowPassword(field: string) {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    }

    if (field === 'register') {
      this.showRegisterPassword = !this.showRegisterPassword;
    }

    if (field === 'confirmRegister') {
      this.showRegisterConfirmPassword = !this.showRegisterConfirmPassword;
    }
  }

  async resendVerificationEmail() {
    const loading = await this.loadingService.showLoading(this.localizationService.getFromKey('processing'));
    await loading.present();
    this.authService.resendVerificationEmail(this.signInForm.controls.username.value).subscribe(
        async response => {
          await this.loadingService.dismissLoading();
          const dismissToast = [
            {
              text: 'X',
              role: 'cancel',

            }
          ];
          switch (response.message) {
            case 'verifEmailResent':
              await this.toast.presentToast(this.localizationService.getFromKey('welcome-verifEmailResent'), alertPosition, 'success' , null, dismissToast);
              this.signUpformSubmitted = false;
              break;
            case 'alreadyVerified':
              await this.toast.presentToast(this.localizationService.getFromKey('welcome-alreadyVerified'), alertPosition, 'danger' , 4000);
              break;
            case 'verifEmailResendError':
              await this.toast.presentToast(this.localizationService.getFromKey('welcome-verifEmailResendError'), alertPosition, 'danger' , 5000);
              break;
            case 'emailNotFound':
              await this.toast.presentToast(this.localizationService.getFromKey('emailNotFound'), alertPosition, 'danger' , 4000);
              break;
            case 'bindingError':
              await this.toast.presentToast(this.localizationService.getFromKey('app-bookingBindingError'), alertPosition, 'danger' , 4000);
              break;
          }
        } , async error => {
          await this.loadingService.dismissLoading();
          await this.toast.presentToast(this.localizationService.getFromKey('welcome-verifEmailResendError'), alertPosition, 'danger' , 5000);
        }
    );

  }

  async resetPasswordSendEmailModal() {
    let cssClass;
    if (!mobile) {
      cssClass = 'reset-password-send-email-modal';
    }
    await this.modalService.resetPasswordSendEmailModal(ResetpasswordsendComponent, cssClass, this.routerOutlet.nativeEl);
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }
}
