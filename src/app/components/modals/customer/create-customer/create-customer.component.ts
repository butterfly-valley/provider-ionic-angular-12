import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../../../services/auth/auth.service';
import {ModalService} from '../../../../services/overlay/modal.service';
import {alertPosition, mobile, preferredCountries, tablet} from '../../../../app.component';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {LocalizationService} from '../../../../services/localization/localization.service';
import {faBirthdayCake, faSms} from '@fortawesome/free-solid-svg-icons';
import {ToastService} from '../../../../services/overlay/toast.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {CustomerService} from '../../../../services/user/customer.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {ActionSheetController} from '@ionic/angular';
import {ImageComponent} from '../../image/image.component';
import {EditImageComponent} from '../../edit-image/edit-image.component';
import {converterDataURItoBlob} from '../../../../store/models/provider.model';

@Component({
    selector: 'app-create-customer',
    templateUrl: './create-customer.component.html',
    styleUrls: ['./create-customer.component.scss'],
})
export class CreateCustomerComponent implements OnInit, OnDestroy {
    mobile = mobile;
    tablet = tablet;
    formChanged = false;
    formSubmitted = false;
    createForm: FormGroup;
    isLoading = false;
    createCustomerSub$: Subscription;
    selectedAvatar: any;



    @ViewChild('submitBtn', {static: false}) submitBtn;
    @ViewChild('imagePicker', {static: false}) imagePicker: any;
    preferredCountries  = preferredCountries;
    birthdayIcon = faBirthdayCake;
    smsIcon = faSms;

    constructor(private auth: AuthService,
                private modalService: ModalService,
                public translate: LocalizationService,
                private toast: ToastService,
                public customerService: CustomerService,
                private router: Router,
                private actionSheetController: ActionSheetController) { }

    ngOnInit() {
        this.customerService.imageSrc = undefined;
        this.setForm();
    }

    ngOnDestroy(): void {
        if (this.createCustomerSub$) {
            this.createCustomerSub$.unsubscribe();
        }
        this.dismiss();
    }

    async dismiss() {
        await this.modalService.dismissCreateCustomerModal();
    }

    submitForm() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }

    async onSubmitForm() {
        this.formSubmitted = true;
        if (this.createForm.valid) {
            this.isLoading = true;
            this.createCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                async token => {
                    if (token) {
                        this.customerService.createCustomer(token, this.createForm.value).subscribe(
                            async response => {
                                if (response['message']) {
                                    switch (response['message']) {
                                        case 'bindingError':
                                            this.createForm.controls['internationalPhone'].reset();
                                            await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'existingCustomer':
                                            this.createForm.controls['internationalPhone'].reset();
                                            await this.toast.presentToast(this.translate.getFromKey('customer-existingCustomer'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'createCustomerError':
                                            this.createForm.controls['internationalPhone'].reset();
                                            await this.toast.presentToast(this.translate.getFromKey('customer-createCustomerError'), alertPosition, 'danger' , 4000);
                                            break;
                                    }
                                    this.isLoading = false;
                                } else {
                                    await this.toast.presentToast(this.translate.getFromKey('customer-newCustomerSuccess'), alertPosition, 'success' , 2000);
                                    if (this.customerService.imageSrc) {
                                        const b: any = converterDataURItoBlob(this.customerService.imageSrc);
                                        b.lastModifiedDate = new Date();
                                        b.name = 'avatar.jpg';
                                        this.customerService.uploadAvatar(token, b, response.toString()).subscribe(
                                            response => {
                                                this.refresh();
                                                this.isLoading = false;
                                            }, error => {
                                                this.refresh();
                                                this.isLoading = false;
                                            }
                                        );
                                    } else {
                                        await this.refresh();
                                        this.isLoading = false;
                                    }
                                }

                            } , async error1 => {
                                this.isLoading = false;
                                this.createForm.controls['internationalPhone'].reset();
                                await this.toast.presentToast(this.translate.getFromKey('customer-createCustomerError'), alertPosition, 'danger' , 4000);
                            }
                        );
                    } else {
                        this.isLoading = false;
                        this.createForm.controls['internationalPhone'].reset();
                        await this.toast.presentToast(this.translate.getFromKey('customer-createCustomerError'), alertPosition, 'danger' , 4000);
                    }
                }, async error => {
                    this.isLoading = false;
                    this.createForm.controls['internationalPhone'].reset();
                    await this.toast.presentToast(this.translate.getFromKey('customer-createCustomerError'), alertPosition, 'danger' , 4000);
                }
            );
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }

    }

    private async refresh() {
        this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigate(['/user/management/customers']));
        await this.dismiss();
    }

    private setForm() {
        this.createForm = new FormGroup({
                name: new FormControl(null, [Validators.minLength(3), Validators.maxLength(50), Validators.required]),
                remark: new FormControl(null, [Validators.minLength(3), Validators.maxLength(255)]),
                sendSms: new FormControl(null),
                dob: new FormControl(null),
                email: new FormControl(null, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
                internationalPhone: new FormControl(null)

            }
        );

        this.createForm.valueChanges.subscribe(
            value => {
                this.formChanged = true;
            }
        );
    }

    onImagePicked(event: any) {
        const reader = new FileReader();
        reader.onload = async (event: any) => {
            let cssClass = '';
            if (!this.mobile && !this.tablet) {
                cssClass = 'edit-image-modal';
            } else if (this.tablet) {
                cssClass = 'edit-image-modal-tablet';
            }
            await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, undefined, undefined,
                undefined, undefined, false, undefined, true);

        };
        reader.readAsDataURL(event.target.files[0]);
    }

    async editPickedPic() {
        if (!this.customerService.imageSrc) {
            this.imagePicker.nativeElement.click();
        } else {
            const actionSheet = await this.actionSheetController.create({
                buttons: [
                    {
                        text: this.translate.getFromKey('upload'),
                        icon: 'camera',
                        handler: () => {
                            this.imagePicker.nativeElement.click();
                        }
                    },
                    {
                        text: this.translate.getFromKey('delete'),
                        icon: 'trash',
                        cssClass: 'actionsheet-delete',
                        handler: () => {
                            this.deleteAvatar();
                        }
                    },
                    {
                        text: this.translate.getFromKey('cancel'),
                        icon: 'close',
                        role: 'cancel',
                    }]
            });
            await actionSheet.present();
        }
    }

    deleteAvatar() {
        this.selectedAvatar = undefined;
        this.customerService.imageSrc = undefined;
    }

    async showAvatar(imageSrc: string | ArrayBuffer) {
        if (typeof imageSrc === 'string') {
            await this.modalService.openImageModal(ImageComponent, imageSrc);
        }
    }
}
