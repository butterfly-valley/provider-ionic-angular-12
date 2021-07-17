import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {alertPosition, dateClass, mobile, tablet} from '../../../app.component';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {OpsHours, Schedule, Service} from '../../../store/models/provider.model';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {ScheduleService} from '../../../services/user/schedule.service';
import {AuthService} from '../../../services/auth/auth.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {catchError, distinctUntilChanged} from 'rxjs/operators';
import {ToastService} from '../../../services/overlay/toast.service';
import {ImageComponent} from '../image/image.component';
import {MatStepper} from '@angular/material/stepper';
import {ActionSheetController} from '@ionic/angular';
import {AlertService} from '../../../services/overlay/alert.service';
import {Router} from '@angular/router';
import {InfoComponent} from '../../popover/info/info.component';
import {InfoPopoverService} from '../../../services/util/info-popover.service';
import {DateAdapter} from '@angular/material/core';
import {EditImageComponent} from "../edit-image/edit-image.component";
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';

@Component({
    selector: 'app-editschedule',
    templateUrl: './editschedule.component.html',
    styleUrls: ['./editschedule.component.scss'],
})
export class EditscheduleComponent implements OnInit, OnDestroy {
    /*edit details*/
    @ViewChildren('serviceItem') serviceItems;
    @ViewChild('editSubmitBtn', {static: false}) editSubmitBtn;
    @ViewChild('imagePicker', {static: false}) imagePicker: any;
    @ViewChild('submitBtn', {static: false}) submitBtn;

    @Input() scheduleId: string;
    mobile = mobile;
    tablet = tablet;
    opsHours$ = new BehaviorSubject<any>(null);
    editScheduleForm: FormGroup;
    editSlotForm: FormGroup;
    editScheduleSub$: Subscription;
    editScheduleSubmitSub$: Subscription;
    isLoading = true;
    formSubmitted = false;
    editScheduleImage$: Subscription;
    formChanged = false;
    editName = false;
    editCategory = false;
    editStart = false;
    editEnd = false;
    loadingError;

    serviceControls;
    serviceSlotControls;

    notifEmail = false;

    imageSrc: string | ArrayBuffer;
    services: Service[] = [];

    /*   edit slots*/

    @ViewChild('stepper', {static: false}) stepper: MatStepper;
    editSlots = false;

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

    pickedWeekdays = [];

    deleteSlots = false;
    deleteSlotsSub$: Subscription;
    multipleServices = true;
    multipleSpots = false;

    submitSchedule$: Subscription;

    slotFormSubmitted = false;
    submitSuccess = false;

    openingHours$ = new BehaviorSubject<OpsHours[]>([]);

    constructor(private modalService: ModalService,
                public scheduleService: ScheduleService,
                private auth: AuthService,
                public translate: LocalizationService,
                private toast: ToastService,
                private actionSheetController: ActionSheetController,
                private alert: AlertService,
                private router: Router,
                private popoverService: InfoPopoverService,
                private dateAdapter: DateAdapter<any>,
                private cd: ChangeDetectorRef,
                public dateTimeUtil: DateTimeUtilService
    ) {
        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;
    }

    ngOnInit() {
        this.auth.getCurrentToken().subscribe(
            token => {
                if (token) {
                    this.editScheduleSub$ = this.scheduleService.getSchedule(token, this.scheduleId).pipe(
                        catchError((err) => {
                            this.loadingError = err;
                            this.toast.presentToast(this.translate.getFromKey('schedule-load-error'), 'bottom', 'danger', 4000);
                            return throwError(err);
                        })).subscribe(
                        schedule => {
                            this.scheduleService.schedule$.next(schedule);
                            this.setEditForm(schedule);
                            this.scheduleService.getOpsHours(token).subscribe(
                                response => {
                                    this.opsHours$.next(response);
                                    this.editSlotForm = new FormGroup({
                                        replace: new FormControl('1', Validators.required),
                                        scheduleId: new FormControl(this.scheduleId, [Validators.required]),
                                        vacancyType: new FormGroup({
                                            type: new FormControl('1', [Validators.required]),
                                            services: new FormArray([]),
                                            duration: new FormControl(30),
                                            numberOfSpots: new FormControl(undefined),
                                        }),
                                        schedule: new FormGroup({
                                            days: new FormGroup({
                                                day: new FormArray([], Validators.required)
                                            })
                                        }),
                                        misc: new FormGroup({
                                            note: new FormControl(undefined, [Validators.minLength(3), Validators.maxLength(255)]),
                                            minimumNotice: new FormControl(2, [Validators.required]),
                                        })
                                    });
                                    if (response && response.length > 0) {
                                        this.openingHours$.next(response);
                                    }

                                    this.serviceSlotControls = this.editSlotForm.get('vacancyType.services')['controls'];

                                }
                            );
                            this.isLoading = false;
                        }
                    );
                } else {
                    this.isLoading = false;
                }
            }
        );

    }

    ngOnDestroy(): void {
        if (this.editScheduleSub$) {
            this.editScheduleSub$.unsubscribe();
        }

        if (this.editScheduleSubmitSub$) {
            this.editScheduleSubmitSub$.unsubscribe();
        }

        if (this.editScheduleImage$) {
            this.editScheduleImage$.unsubscribe();
        }

        if (this.deleteSlotsSub$) {
            this.deleteSlotsSub$.unsubscribe();
        }
        this.dismiss();
    }

    async dismiss() {
        this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigateByUrl('/user/management/schedule?refresh=true'));
        await this.modalService.dismissScheduleEditModal();
    }


    async onSubmitEditForm() {
        this.formSubmitted = true;
        if (this.editScheduleForm.valid) {
            this.isLoading = true;
            this.editScheduleSubmitSub$ = this.auth.getCurrentToken().subscribe(
                token => {
                    if (token) {
                        const editRequest = this.editScheduleForm.value;

                        this.scheduleService.editSchedule(token, editRequest).subscribe(
                            async response => {
                                if (!response['message']) {
                                    this.isLoading = false;
                                    this.scheduleService.schedule$.next(response);
                                    this.setEditForm(response);
                                    this.editCategory = false;
                                    this.editName = false;
                                    this.editStart = false;
                                    this.editEnd = false;
                                    await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateSuccess'), alertPosition, 'success', 4000);
                                    this.submitSuccess = true;
                                } else {
                                    this.isLoading = false;
                                    await  this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [this.translate.getFromKey('close')]);
                                }
                            }, async error => {
                                this.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError'), alertPosition, 'danger', 4000);
                            }
                        );
                    }
                });

        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }
    }

    addService(scheduleList: Service[], slot?: boolean) {
        let control = this.editScheduleForm.get('serviceList.services') as FormArray;
        if (slot) {
            control = this.editSlotForm.get('vacancyType.services') as FormArray;
        }
        control.push(this.pushServiceValues(undefined, '30'));
        scheduleList.push({service: undefined, duration: '30'});
        this.cd.detectChanges();
    }


    deleteService(index: number, scheduleList: Service[], slot?: boolean) {
        let control = this.editScheduleForm.get('serviceList.services') as FormArray;
        if (slot) {
            control = this.editSlotForm.get('vacancyType.services') as FormArray;
        }
        control.removeAt(index);
        scheduleList.splice(index, 1);
    }

    private setEditForm(schedule: Schedule) {
        this.formSubmitted = false;
        this.formChanged = false;
        let category = '';
        const categoryNameValidators = [];
        if (schedule.scheduleCategory !== 'default') {
            category = schedule.scheduleCategory;
            categoryNameValidators.push(Validators.minLength(3), Validators.maxLength(50));
        }

        this.editScheduleForm = new FormGroup({
            scheduleId: new FormControl(this.scheduleId),
            name: new FormControl(schedule.scheduleName, [Validators.minLength(3), Validators.maxLength(50)]),
            category: new FormControl(category, categoryNameValidators),
            visible: new FormControl(schedule.visible),
            smsReminder: new FormControl(schedule.smsReminder),
            mandatoryPhone: new FormControl(schedule.mandatoryPhone),
            minimumNotice: new FormControl(schedule.minimumNotice, [Validators.required, Validators.pattern('^[1-9][0-9]*$')]),
            serviceList: new FormGroup({
                services: new FormArray([])
            }),
            notif: new FormControl(schedule.notif, [Validators.required]),
            notifEmail: new FormControl(schedule.notifEmail, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
            note: new FormControl(schedule.note),
            start: new FormControl(null),
            end: new FormControl(null),
            offset: new FormControl(new Date().getTimezoneOffset())
        });

        if (schedule.serviceList && schedule.serviceList.length > 0) {
            this.returnServiceArray(schedule.serviceList);
        }

        this.editScheduleForm.valueChanges.subscribe(
            value => {
                this.formChanged = true;
            }
        );

        this.serviceControls = this.editScheduleForm.get('serviceList.services')['controls'];
    }

    private returnServiceArray(serviceList: Service[]) {
        const control = this.editScheduleForm.get('serviceList.services') as FormArray;
        serviceList.forEach(
            service => {
                control.push(this.pushServiceValues(service.service, service.duration));
            }
        );
    }

    private pushServiceValues(description, duration) {
        return new FormGroup({
            service: new FormControl(description, [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
            duration: new FormControl(duration, [Validators.required, Validators.pattern('^[1-9][0-9]*$')])
        });
    }

    submitEditForm() {
        const button: HTMLElement = this.editSubmitBtn.nativeElement;
        button.click();
    }

    editField(field: string) {
        if (field === 'name') {
            this.editName = true;
        }

        if (field === 'category') {
            this.editCategory = true;
        }

        if (field === 'start') {
            this.editStart = true;
        }

        if (field === 'end') {
            this.editEnd = true;
        }

    }




    notifEmailToggle(event: any) {
        const notifYByEmail = event.detail.checked;
        this.notifEmail = notifYByEmail;
    }

    segmentChanged(event: any) {
        const value = event.detail.value;
        this.editSlots = value === 'vacancies';
    }

    async onSubmitEditSlotForm() {
        this.slotFormSubmitted = true;

        if (this.editSlotForm.valid) {
            this.isLoading = true;
            this.submitSchedule$ = this.auth.getCurrentToken().subscribe(
                token => {
                    if (token) {
                        this.scheduleService.uploadSlots(token, this.scheduleId, this.editSlotForm.value).subscribe(
                            async response => {

                                await this.processResponse(response);
                            }, async error => {
                                this.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger' , 4000);
                                this.submitSchedule$.unsubscribe();
                            }
                        );
                    }
                }
            );
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }

    }

    nextStep() {
        this.stepper.next();
    }

    prevStep() {
        this.stepper.previous();
    }

    chooseEditOption(ev: any) {
        const value = ev.detail.value;
        if (value === '3') {
            this.deleteSlots = true;
        } else {
            this.deleteSlots = false;
        }

    }

    async deleteScheduleSlots() {
        await this.alert.presentAlert(
            null,
            null,
            this.translate.getFromKey('sched-delete-slots-sure'),
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('delete'),
                    handler: () => {
                        this.confirmDelete(this.scheduleId);
                    }
                }

            ]
        );

    }

    confirmDelete(scheduleId: string) {
        this.isLoading = true;
        this.deleteSlotsSub$ = this.auth.getCurrentToken().subscribe(
            token => {
                if (token) {
                    this.scheduleService.deleteSlots(token, scheduleId).subscribe(
                        async response => {
                            this.isLoading = false;
                            switch (response.message) {
                                case 'Invalid schedule':
                                    await this.toast.presentToast(this.translate.getFromKey('sched-invalidSchedule'), alertPosition, 'danger' , 4000);
                                    break;
                                case 'existingApp':
                                    await this.toast.presentToast(this.translate.getFromKey('sched-existing-apps2'), alertPosition, 'danger' , 4000);
                                    break;
                                case 'deleteError':
                                    await this.toast.presentToast(this.translate.getFromKey('sched-deleteSpecialistError'), alertPosition, 'danger' , 4000);
                                    break;
                                default:
                                    await this.dismiss();
                                    await this.toast.presentToast(this.translate.getFromKey('sched-deleteSlotSuccess'), alertPosition, 'success' , 2000);
                                    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                        this.router.navigateByUrl('/user/management/schedule?refresh=true'));

                            }
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('sched-deleteSpecialistError'), alertPosition, 'danger' , 4000);
                        }
                    );

                }
            });
    }

    pickVacancyType(event: any) {
        const value = event.detail.value;
        this.multipleServices = value === '1';
        this.multipleSpots = value === '3';
        if (this.multipleSpots) {
            this.editSlotForm.get('vacancyType.duration').setValue('30');
            this.editSlotForm.get('vacancyType.numberOfSpots').setValue('5')
        }
        if (!this.multipleSpots && !this.multipleServices) {
            this.editSlotForm.get('vacancyType.duration').setValue('30')
        }

        if (this.multipleServices) {
            this.editSlotForm.get('vacancyType.duration').setValue(null);
            this.editSlotForm.get('vacancyType.numberOfSpots').setValue(null)
        }

    }


    private async processResponse(response: any) {
        this.isLoading = false;
        this.submitSchedule$.unsubscribe();

        switch (response.message) {
            case 'success':
                await this.dismiss();
                await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveSuccess'), alertPosition, 'success' , 2000);
                this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                    this.router.navigateByUrl('/user/management/schedule?refresh=true'));
                break;
            case 'invalidDuration':
                await this.toast.presentToast(this.translate.getFromKey('sched-invalid-duration'), alertPosition, 'danger' , 4000);
                break;
            case 'invalidHour':
                await this.toast.presentToast(this.translate.getFromKey('sched-choose-hours-error'), alertPosition, 'danger' , 4000);
                break;
            case 'existingApp':
                await this.toast.presentToast(this.translate.getFromKey('sched-existing-apps2'), alertPosition, 'danger' , 4000);
                break;
            case 'overlap':
                await this.toast.presentToast(this.translate.getFromKey('sched-overlap'), alertPosition, 'danger' , 4000);
                break;
            case 'bindingError':
                await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                break;
            case 'noService':
                await this.toast.presentToast(this.translate.getFromKey('sched-no-services'), alertPosition, 'danger' , 4000);
                break;
            default:
                await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger' , 4000);
        }
    }

    async infoPopover(info: string, event: any) {
        await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event);
    }


    updateServiceDuration(control, ev: any) {
        control.controls.duration.setValue(ev);
    }

    updateNumberInput(control: any, ev: number) {
        control.setValue(ev);
    }

    submit() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();

    }

    dateClass() {
        return dateClass();
    }

    async editPickedPic(avatar: string) {
        if (!this.imageSrc && !avatar) {
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

    async onImagePicked(event: any) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            let cssClass = '';
            if (!mobile && !tablet) {
                cssClass = 'edit-image-modal';
            } else if (tablet) {
                cssClass = 'edit-image-modal-tablet';
            }
            await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, undefined, undefined, false, undefined, false,
                undefined, false, this.scheduleId, false);
        };

    }

    async deleteAvatar() {
        this.isLoading = true;
        this.editScheduleImage$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                this.isLoading = false;
                if (token) {
                    this.scheduleService.deleteAvatar(token, this.scheduleId).subscribe(
                        async response => {
                            this.isLoading = false;
                            if (response.message === 'avatarDeleteSuccess') {
                                const currentSchedule = this.scheduleService.schedule$.value;
                                currentSchedule.avatar = undefined;
                                this.scheduleService.schedule$.next(currentSchedule);
                            } else {
                                await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);                            }
                        }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('prof-avatar-delete-error'), alertPosition, 'danger', 6000);

                        }
                    );

                }
            });
    }

    async openAvatar(src: string) {
        if (src) {
            await this.modalService.openImageModal(ImageComponent, src);
        }
    }



}
