import {ChangeDetectorRef, Component, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import { Subscription, throwError} from 'rxjs';
import {Provider} from '../../../store/models/provider.model';
import {FormArray, FormGroup} from '@angular/forms';
import {catchError, distinctUntilChanged, filter} from 'rxjs/operators';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {IconService} from '../../../services/util/icon.service';
import {ActionSheetController} from '@ionic/angular';
import {AlertService} from '../../../services/overlay/alert.service';
import {PlatformDetectionService} from '../../../services/platformdetection/platformdetection.service';
import {CountryCodesService} from '../../../services/arrays/countrycodes.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {EditAccountComponent} from '../../../components/modals/edit-account/edit-account.component';
import {categories} from "../../register/register.page";

@Component({
    selector: 'app-account',
    templateUrl: './account.page.html',
    styleUrls: ['./account.page.scss'],
    animations: [
        standardAnimation
    ]
})
export class AccountPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;

    @ViewChild('submitBtn', {static: false}) submitBtn;

    providerSub$: Subscription;
    // provider$ = new BehaviorSubject<Provider>(null);

    editProfileForm: FormGroup;
    /* edit profile subscription*/
    editProfileSub$: Subscription;

    formChanged = false;

    phoneControls: any;
    formSubmitted: boolean;

    loadingError: any;
    isLoading = false;

    fieldSelected = false;
    categories = categories;

    constructor(private auth: AuthService,
                public userService: UserService,
                public translate: LocalizationService,
                private toast: ToastService,
                private cd: ChangeDetectorRef,
                public iconService: IconService,
                private actionSheetController: ActionSheetController,
                private alertService: AlertService,
                private platformService: PlatformDetectionService,
                private modalService: ModalService,
                public countryCodesService: CountryCodesService) { }

    ionViewWillEnter() {
        this.providerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.auth.userAuthorities$.pipe(distinctUntilChanged()).pipe(filter (authorities => !!authorities)).subscribe(
                        async authorities => {
                              if (this.auth.userRole(authorities) === 'full' || this.auth.userRole(authorities) === 'admin' || this.auth.userRole(authorities) === 'provider') {
                                this.auth.loadProviderFromServer(token, true).subscribe(
                                    provider => {
                                        this.userService.provider$.next(provider);
                                        this.auth.setLoggedUser(provider);
                                        this.setForm(provider);

                                      },
                                    catchError((err) => {
                                        this.loadingError = err;
                                        return throwError(err);
                                    })
                                );
                            } else {
                                await this.toast.presentToast(this.translate.getFromKey('page403'), alertPosition, 'warning' , 6000);
                                await this.auth.redirectUnauthorizedUser(this.auth.userRole(authorities));
                            }


                        }
                    );
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
        if (this.providerSub$) {
            this.providerSub$.unsubscribe();
        }

        if (this.editProfileSub$) {
            this.editProfileSub$.unsubscribe();
        }
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
                            if(response['message']) {
                                await this.userService.processServerError(response['message'], this.toast);
                            } else if(response['id']) {
                                this.userService.provider$.next(response);
                                this.setForm(response);
                                this.fieldSelected = false;
                                await this.toast.presentToast(this.translate.getFromKey('prof-editSuccess'), alertPosition, 'success' , 2000);

                            } else {
                                await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                            }
                            this.isLoading = false;
                        }, async error => {
                            await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                            this.isLoading = false;
                        }
                    )

                } else {
                    await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                    this.isLoading = false;
                }
            }, async error => {
                await this.toast.presentToast(this.translate.getFromKey('prof-editError'), alertPosition, 'danger' , 4000);
                this.isLoading = false;
            });
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
            return;
        }

    }


    edit(field: string, provider?) {
        this.fieldSelected = true;
        if (field === 'name') {
            this.userService.editName = true;
        }
        if (field === 'companyName') {
            this.userService.editCompanyName = true;
        }

        if (field === 'username') {
            this.userService.editUsername = true;
        }
        if (field === 'vat') {
            this.userService.editVAT = true;
        }

        if (field === 'services') {
            this.userService.editServices = true;
        }
        if (field === 'phone') {
            this.userService.editPhone = true;
            this.userService.setPhoneFields(provider, this.editProfileForm, this.formChanged);
        }

        if (field === 'address') {
            this.userService.editAddress = true;
        }

        if (field === 'password') {
            this.userService.editPassword = true;
        }

        if (field === 'notifications') {
            this.userService.editNotifications = true;
        }

        if (field === 'locale') {
            this.userService.editLocale = true;
        }

    }

    setForm(provider: Provider, reset?) {
        this.userService.resetEditFields();
        this.phoneControls = undefined;
        this.formChanged = false;

        if (reset) {
            this.fieldSelected = false;
            this.editProfileForm.controls.address = null;
            this.formChanged = false;
        }

        this.editProfileForm = this.userService.getProfileForm(provider);
        this.phoneControls = this.editProfileForm.get('phones')['controls'];

        // listen to user input
        this.editProfileForm.valueChanges.subscribe(() => {
            this.formChanged = this.editProfileForm.valid;
        });

    }

    async changeLocale() {
        const actionSheet = await this.actionSheetController.create({
            buttons: [{
                text: 'English',
                icon: 'globe',
                handler: () => {
                    this.translate.changeLocale('en-US');
                    this.setLocale('en-US');
                    this.submitForm();
                }
            }, {
                text: 'Português (Portugal)',
                icon: 'globe',
                handler: () => {
                    this.translate.changeLocale('pt-PT');
                    this.setLocale('pt-PT');
                    this.submitForm();
                }
            }, {
                text: 'Русский',
                icon: 'globe',
                handler: () => {
                    this.translate.changeLocale('ru-RU');
                    this.setLocale('ru-RU');
                    this.submitForm();
                }
            }]
        });
        await actionSheet.present();
    }

    private setLocale(locale: string) {
        this.editProfileForm.controls.locale.setValue(locale);
    }

    removePhone(i: number) {
        const formArray = this.editProfileForm.get('phones') as FormArray;
        formArray.removeAt(i);
    }

    async deleteAccount() {
        const actionSheet = await this.actionSheetController.create({
            buttons: [
                {
                    text: this.translate.getFromKey('delete-profile'),
                    icon: 'trash',
                    cssClass: 'actionsheet-delete',
                    handler: () => {
                        this.alertService.presentAlert(
                            null,
                            null,
                            this.translate.getFromKey('delete-profile-text'),
                            [
                                {
                                    text: this.translate.getFromKey('cancel'),
                                    role: 'cancel'

                                },
                                {
                                    text: this.translate.getFromKey('delete-profile'),
                                    cssClass: 'actionsheet-delete',
                                    handler: () => {
                                        /*handle profile deletion */
                                        this.isLoading = true;
                                        this.editProfileSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                                            token => {
                                                if (token) {
                                                    this.userService.deleteProfile(token, this.platformService.returnDeviceInfo()).subscribe(
                                                        async response => {
                                                            this.isLoading = false;
                                                            if (response.message === 'userDeleteSuccess') {
                                                                await this.toast.presentToast(this.translate.getFromKey('welcome-userDeleteSuccess'), 'top', 'success', 4000);
                                                                setTimeout(() => { this.auth.signOut()}, 4000);

                                                            } else {
                                                                await this.toast.presentToast(this.translate.getFromKey('welcome-userDeleteError'), 'bottom', 'danger', 4000);
                                                                this.isLoading = false;
                                                            }
                                                        }, async error => {
                                                            await this.toast.presentToast(this.translate.getFromKey('welcome-userDeleteError'), 'bottom', 'danger', 4000);
                                                            this.isLoading = false;
                                                        }
                                                    );

                                                }
                                            }, async error => {
                                                await this.toast.presentToast(this.translate.getFromKey('welcome-userDeleteError'), 'bottom', 'danger', 4000);
                                                this.isLoading = false;

                                            }
                                        );

                                    }

                                }
                            ]
                        );
                    }
                }, {
                    text: this.translate.getFromKey('migrate-profile'),
                    icon: 'share',
                    handler: () => {
                        /*this.translate.changeLocale('pt');
                        window.location.reload();*/
                    }
                }, {
                    text: this.translate.getFromKey('cancel'),
                    icon: 'close',
                    role: 'cancel',
                }]
        });
        await actionSheet.present();
    }

    async redirectToMobileEdit(field: string, provider?) {
        this.edit(field, provider);
        await this.modalService.openEditAccountModal(EditAccountComponent);
    }

}
