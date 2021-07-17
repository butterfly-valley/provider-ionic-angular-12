import {ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {OpsHours, Provider} from '../../../store/models/provider.model';
import {catchError, distinctUntilChanged, take} from 'rxjs/operators';
import {AuthService} from "../../../services/auth/auth.service";
import {PageService} from "../../../services/user/page.service";
import {ImageComponent} from "../../../components/modals/image/image.component";
import {ModalService} from "../../../services/overlay/modal.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {LocalizationService} from "../../../services/localization/localization.service";
import {ActionSheetController} from "@ionic/angular";
import {MapsAPILoader} from "@agm/core";
import {EditPageComponent} from "../../../components/modals/edit-page/edit-page.component";
import {Router} from "@angular/router";
import {EditImageComponent} from "../../../components/modals/edit-image/edit-image.component";
import {DateTimeUtilService} from "../../../services/util/date-time-util.service";
import {ScheduleService} from '../../../services/user/schedule.service';


@Component({
    selector: 'app-page',
    templateUrl: './page.page.html',
    styleUrls: ['./page.page.scss'],
    animations: [
        standardAnimation
    ]
})
export class PagePage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;
    @ViewChild('submitBtn', {static: false}) submitBtn;

    providerSub$: Subscription;
    imageSub$: Subscription;
    editPageSub$: Subscription;
    loadingError: any;

    formChanged = false;
    isLoading = false;

    providerImages = [];

    @ViewChild('imagePicker', {static: false}) imagePicker: any;
    mainImagePicked = false;
    imageToEdit;
    formSubmitted: boolean;

    /* get access to autocomplete element*/
    @ViewChild('googlePlacesAutocomplete', {static: false}) googlePlacesAutocomplete: ElementRef;
    addressPicked = '';
    opsHours$ = new BehaviorSubject<OpsHours[]>([]);

    constructor(public auth: AuthService,
                public pageService: PageService,
                private modalService: ModalService,
                private toast: ToastService,
                public translate: LocalizationService,
                private actionSheetController: ActionSheetController,
                public cd: ChangeDetectorRef,
                private mapsAPILoader: MapsAPILoader,
                private router: Router,
                public dateTimeUtil: DateTimeUtilService,
                private scheduleService: ScheduleService) { }

    ionViewWillEnter() {
        this.isLoading = true;
        this.providerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.auth.loadProviderFromServer(token, true).subscribe(
                        provider => {
                            this.pageService.provider$.next(provider);
                            this.auth.setLoggedUser(provider);

                            this.setImages(provider);
                            this.pageService.setForm(provider, true);
                            this.addressPicked = '';

                            if (!mobile || tablet) {
                                setTimeout(() => {
                                    this.pageService.googleMapsAutocomplete(this.googlePlacesAutocomplete.nativeElement,
                                        this.mapsAPILoader);
                                }, 50);
                            }

                            // set address fields after autocomplete
                            this.pageService.location.subscribe(
                                value => {
                                    if (value) {
                                        for (let i = 0; i < value.length; i++) {
                                            const addressType = value[i].types[0];
                                            if (this.pageService.componentForm[addressType]) {
                                                const val = value[i][this.pageService.componentForm[addressType]];
                                                this.pageService.pageForm.controls.address.get(addressType).setValue(val);
                                                this.addressPicked = this.addressPicked + ' ' + val;
                                            }
                                        }

                                        this.pageService.coordinates.subscribe(value1 => {
                                            this.pageService.pageForm.controls.address.get('coordinates').setValue(value1);
                                        });

                                        this.cd.detectChanges();
                                    }
                                }
                            );

                            this.scheduleService.getOpsHoursAndSchedules(token).subscribe(
                                response => {
                                    if (response) {
                                        if (response.opsHours && response.opsHours.length > 0 ) {
                                            this.opsHours$.next(response.opsHours);
                                        }

                                    }

                                }
                            );

                            this.isLoading = false;

                        },
                        catchError((err) => {
                            this.loadingError = err;
                            this.isLoading = false;
                            return throwError(err);
                        })
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

        if (this.imageSub$) {
            this.imageSub$.unsubscribe();
        }
        if (this.editPageSub$) {
            this.editPageSub$.unsubscribe();
        }


    }


    submitForm() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }

    async onSubmitForm() {
        this.formSubmitted = true;
        const form = this.pageService.pageForm;
        if (form.valid) {
            this.isLoading = true;
            this.editPageSub$ = this.auth.getCurrentToken().subscribe(async token => {
                if (token) {
                    this.pageService.editPageRequest(token, form.value).subscribe(
                        async response => {
                            if (response['message']) {
                                await this.pageService.processServerError(response['message'], this.toast);
                            } else if(response['id']) {
                                this.reset();
                                await this.toast.presentToast(this.translate.getFromKey('page-edit-success'), alertPosition, 'success' , 200);

                            } else {
                                await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                            }
                            this.isLoading = false;
                        }, async error => {
                            await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                            this.isLoading = false;
                        }
                    )

                } else {
                    await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                    this.isLoading = false;
                }
            }, async error => {
                await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                this.isLoading = false;
            });
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
            return;
        }

    }

    async showAvatar(avatar: string) {
        await this.modalService.openImageModal(ImageComponent, avatar);

    }

    async choosePic(main, link?) {
        this.imagePicker.nativeElement.click();
        this.mainImagePicked = main;
        if (link) {
            this.imageToEdit = link;
        }
    }

    async chooseAvatarAction(main, link?) {
        const actionSheet = await this.actionSheetController.create({
            buttons: [
                {
                    text: this.translate.getFromKey('upload'),
                    icon: 'camera',
                    handler: () => {
                        this.choosePic(main, link);
                    }
                },
                {
                    text: this.translate.getFromKey('delete'),
                    icon: 'trash',
                    cssClass: 'actionsheet-delete',
                    handler: () => {
                        this.deleteAvatar(link, main);
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

    async onImagePicked(event: any) {

        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            let cssClass = '';
            if (!this.mobile && !this.tablet) {
                cssClass = 'edit-image-modal';
            } else if (this.tablet) {
                cssClass = 'edit-image-modal-tablet';
            }
            await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, this.mainImagePicked, this.imageToEdit, true);
        };

    }

    async deleteAvatar(imageLink, main) {
        this.isLoading = true;
        this.imageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    if (main) {
                        this.mainImagePicked = true;
                    }
                    this.pageService.deleteImage(token, imageLink, this.mainImagePicked).subscribe(
                        async response => {
                            this.isLoading = false;
                            if (response['message'] === 'imageDeleteSuccess') {
                                const currentProvider = this.pageService.provider$.value;
                                if (main) {
                                    currentProvider.image = undefined;
                                } else {
                                    currentProvider.images.splice(currentProvider.images.indexOf(imageLink), 1);
                                    this.setImages(currentProvider);
                                }
                                this.pageService.provider$.next(currentProvider);
                            } else {
                                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);                            }
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);

                        }
                    );

                } else {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);
                }
            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);
            });
    }

    private setImages(provider: Provider) {
        this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
            async authorities => {

                let allowedPics = 24;

                if (authorities.includes('ROLE_PLUS')) {
                    allowedPics = 6;
                } else if (authorities.includes('ROLE_PRO')) {
                    allowedPics = 12;
                }

                this.providerImages = [];
                provider.images.forEach(
                    image => {
                        this.providerImages.push(image);
                    }
                );

                const numberOfImages = provider.images.length;



                if (numberOfImages < allowedPics) {
                    const difference = allowedPics - numberOfImages;
                    for (let i = 0; i < difference; i++) {
                        this.providerImages.push('not-set');
                    }
                }
            }
        );
    }

    edit(field: string, provider?) {
        if (field === 'description') {
            this.pageService.editDescription = true;
        }

        if ( field === 'opsHours') {
            this.pageService.editOpsHours = true;

        }

        if ( field === 'restricted') {
            this.pageService.editRestricted = true;
        }

        if ( field === 'addressVisible') {
            this.pageService.editAddressVisible = true;
        }

        if ( field === 'anonymousApps') {
            this.pageService.editAnonymousApps = true;
        }

        if (field === 'address') {
            this.pageService.editAddress = true;
        }
        this.cd.detectChanges();

    }

    whatsappLink(provider: Provider) {
        let invitationLink = '';
        if (provider.invitationLink) {
            invitationLink = '?invitationLink=' + provider.invitationLink;
        }
        return 'whatsapp://send?text=https://www.bookanapp.com/search/provider/' + provider.id + invitationLink;
    }

    emailLink(provider: Provider) {
        let invitationLink = '';
        if (provider.invitationLink) {
            invitationLink = '?invitationLink=' + provider.invitationLink;
        }
        return  'mailto:?subject=' + this.translate.getFromKey('share-provider-subject') + '&body=' +
            this.translate.getFromKey('share-provider-body') + 'https://www.bookanapp.com/search/provider/' + provider.id + invitationLink;
    }



    async copyLink(provider: Provider) {
        let invitationLink = '';
        if (provider.invitationLink) {
            invitationLink = '?invitationLink=' + provider.invitationLink;
        }
        const link = 'https://www.bookanapp.com/search/provider/' + provider.id + invitationLink;
        const x = document.createElement('TEXTAREA') as HTMLTextAreaElement;
        x.value = link;
        document.body.appendChild(x);
        x.select();
        document.execCommand('copy');
        document.body.removeChild(x);
        await this.toast.presentToast(this.translate.getFromKey('copied'), alertPosition, 'primary', 2000);

    }

    async redirectToMobileEdit(field: string, provider?) {
        this.edit(field, provider);
        await this.modalService.openEditPageModal(EditPageComponent, this.opsHours$.value);
    }

    resetFacilityAddress() {
        this.pageService.pageForm.controls.address.reset();
        this.googlePlacesAutocomplete.nativeElement.value = '';
        this.addressPicked = '';
        this.cd.detectChanges();
    }

    reset() {
        this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigateByUrl('/user/profile/page'));
    }
}
