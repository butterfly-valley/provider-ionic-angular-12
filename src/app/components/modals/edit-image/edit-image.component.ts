import {Component, Input, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, tablet} from '../../../app.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {ImageCroppedEvent, ImageCropperComponent} from 'ngx-image-cropper';
import {distinctUntilChanged} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../services/auth/auth.service';
import {PageService} from '../../../services/user/page.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {Router} from '@angular/router';
import {EmployeeService} from "../../../services/user/employee.service";
import {CustomerService} from "../../../services/user/customer.service";
import {ScheduleService} from "../../../services/user/schedule.service";

@Component({
    selector: 'app-edit-image',
    templateUrl: './edit-image.component.html',
    styleUrls: ['./edit-image.component.scss'],
})
export class EditImageComponent implements OnDestroy {
    tablet = tablet;
    @Input() image;
    @Input() mainImagePicked;
    @Input() imageToEdit;
    @Input() employeeId;
    @Input() newEmployee;
    @Input() customerId;
    @Input() newCustomer;
    @Input() pagePic;
    @Input() scheduleId;
    @Input() newSchedule;

    imageSub$: Subscription;

    @ViewChild('cropper', {static: false}) cropper: ImageCropperComponent;

    croppedImage: any = '';
    rotate = 0;
    isLoading;

    constructor(private modalService: ModalService,
                private auth: AuthService,
                private pageService: PageService,
                private toast: ToastService,
                private translate: LocalizationService,
                private router: Router,
                private employeeService: EmployeeService,
                private customerService: CustomerService,
                private scheduleService: ScheduleService) { }

    ngOnDestroy() {
        this.modalService.editImageModalOpen = false;
    }

    async dismiss() {
        await this.modalService.dismissEditImageModal();
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }

    imageLoaded() {
        // show cropper
    }
    cropperReady() {
        // cropper ready
    }
    loadImageFailed() {
        // show message
    }

    rotateRight() {
        if (this.rotate === 180) {
            this.rotate = 0;
        }
        this.rotate = this.rotate + 45;

    }

    async submitImage() {
        this.isLoading = true;
        const b: any = await fetch(this.croppedImage).then(r => r.blob());
        b.lastModifiedDate = new Date();
        b.name = 'avatar.jpg';
        this.imageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    this.pageService.uploadImage(token, b, this.mainImagePicked, this.imageToEdit).subscribe(
                        async response => {
                            if (response['link']) {
                                this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                                    this.router.navigateByUrl('/user/profile/page'));
                                await this.dismiss();
                                this.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-success'), alertPosition, 'success', 2000);
                            } else if (response['message']) {
                                this.isLoading = false;
                                switch (response['message']) {
                                    case 'invalidImage':
                                        await this.toast.presentToast(this.translate.getFromKey('prof-avatar-invalid'), alertPosition, 'danger', 6000);
                                        break;
                                    case 'imageUploadError':
                                        await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
                                        break;

                                }
                                // tslint:disable-next-line:align
                            } if (response['message']) {
                                this.isLoading = false;
                                switch (response['message']) {
                                    case 'overLimit':
                                        await this.toast.presentToast(this.translate.getFromKey('phot-over-limit'), alertPosition, 'warning', 6000);
                                        break;
                                }
                            }
                            this.isLoading = false;
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                        }
                    );
                } else {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                }
            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
            }
        );

    }

    async editEmployeeAvatar() {
        this.isLoading = true;
        const b: any = await fetch(this.croppedImage).then(r => r.blob());
        b.lastModifiedDate = new Date();
        b.name = 'avatar.jpg';
        this.imageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    this.employeeService.uploadAvatar(token, b, this.employeeId).subscribe(
                        async response => {
                            if (response['link']) {
                                const currentEmployee = this.employeeService.employee$.value;
                                currentEmployee.avatar = response['link'];
                                this.employeeService.employee$.next(currentEmployee);
                                this.isLoading = false;
                                await this.dismiss();
                                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-success'), alertPosition, 'success', 2000);
                            } else {
                                if (response['error']) {
                                    this.isLoading = false;
                                    switch (response['error']) {
                                        case 'invalidImage':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-invalid'), alertPosition, 'danger', 6000);
                                            break;
                                        case 'imageUploadError':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
                                            break;
                                    }
                                }

                            }
                            this.isLoading = false;
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                        }
                    );
                } else {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                }
            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
            }
        );
    }

    async newEmployeeAvatar() {
        this.employeeService.imageSrc$.next(this.croppedImage);
        await this.dismiss();

    }

    async editCustomerAvatar() {
        this.isLoading = true;
        const b: any = await fetch(this.croppedImage).then(r => r.blob());
        b.lastModifiedDate = new Date();
        b.name = 'avatar.jpg';
        this.imageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    this.customerService.uploadAvatar(token, b, this.customerId).subscribe(
                        async response => {
                            if (response['link']) {
                                const currentCustomer = this.customerService.customer$.value;
                                currentCustomer.avatar = response['link'];
                                this.customerService.customer$.next(currentCustomer);
                                this.isLoading = false;
                                await this.dismiss();
                                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-success'), alertPosition, 'success', 2000);
                            } else {
                                if (response['error']) {
                                    this.isLoading = false;
                                    switch (response['error']) {
                                        case 'invalidImage':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-invalid'), alertPosition, 'danger', 6000);
                                            break;
                                        case 'imageUploadError':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
                                            break;
                                    }
                                }

                            }
                            this.isLoading = false;
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                        }
                    );
                } else {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                }
            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
            }
        );
    }

    async newCustomerAvatar() {
        this.customerService.imageSrc = this.croppedImage;
        await this.dismiss();

    }

    async editScheduleAvatar() {
        this.isLoading = true;
        this.imageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                const b: any = await fetch(this.croppedImage).then(r => r.blob());
                b.lastModifiedDate = new Date();
                b.name = 'avatar.jpg';
                if (token) {
                    this.scheduleService.uploadAvatar(token, b, this.scheduleId).subscribe(
                        async response => {
                            this.isLoading = false;
                            if (response.link) {
                                const currentSchedule = this.scheduleService.schedule$.value;
                                currentSchedule.avatar = response.link;
                                this.scheduleService.schedule$.next(currentSchedule);
                                await this.dismiss();
                            } else {
                                if (response.error) {
                                    switch (response.error) {
                                        case 'invalidImage':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-invalid'), alertPosition, 'danger', 6000);
                                            break;
                                        case 'imageUploadError':
                                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
                                            break;
                                    }
                                }

                            }
                            this.isLoading = false;
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                        }
                    );
                } else {
                    await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);

                }
            }, async error => {
                this.isLoading = false;
                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-error'), alertPosition, 'danger', 6000);
            }
        );


    }

    async newScheduleAvatar() {
        this.scheduleService.imageSrc = this.croppedImage;
        await this.dismiss();
    }
}
