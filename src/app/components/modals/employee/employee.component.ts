import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalService} from "../../../services/overlay/modal.service";
import {AuthService} from '../../../services/auth/auth.service';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {catchError, distinctUntilChanged, take} from 'rxjs/operators';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {converterDataURItoBlob, Employee, Schedule, Subdivision, TimeRequest} from '../../../store/models/provider.model';
import {EmployeeService} from "../../../services/user/employee.service";
import {SignInForm} from "../../forms/signin.model";
import {LocalizationService} from "../../../services/localization/localization.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {Router} from "@angular/router";
import {ActionSheetController} from "@ionic/angular";
import {EditImageComponent} from "../edit-image/edit-image.component";
import {ImageComponent} from "../image/image.component";
import {AlertService} from "../../../services/overlay/alert.service";
import {MatStepper} from '@angular/material/stepper';
import {RosterService} from '../../../services/user/roster.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {DateAdapter} from '@angular/material/core';
import {EmployeeProfileService} from '../../../services/user/employee-profile.service';
import {LoadingService} from '../../../services/loading/loading.service';
import {animate, query, stagger, style, transition, trigger} from '@angular/animations';


@Component({
    selector: 'app-employee',
    templateUrl: './employee.component.html',
    styleUrls: ['./employee.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        standardAnimation,
        trigger(
            'listAnimation', [
                transition('* <=> *', [
                    query(
                        ':enter',
                        [
                            style({ opacity: 0, transform: 'translateY(-15px)' }),
                            stagger(
                                '100ms',
                                animate(
                                    '100ms ease-out',
                                    style({ opacity: 1, transform: 'translateY(0px)' })
                                )
                            )
                        ],
                        { optional: true }
                    )
                ])

            ])
    ]
})
export class EmployeeComponent implements OnInit, OnDestroy {
    mobile = mobile;
    tablet = tablet;

    @Input() id;
    private loadEmployeeSub$: Subscription;
    private editEmployeeSub$: Subscription;
    // employee$ = new BehaviorSubject<Employee>(null);
    schedules$ = new BehaviorSubject<Schedule[]>(null);

    formChanged = false;
    isLoading = false;
    createForm: FormGroup;
    editForm: FormGroup;
    formSubmitted = false;

    @ViewChild('imagePicker', {static: false}) imagePicker: any;
    @ViewChild('createImagePicker', {static: false}) createImagePicker: any;
    @ViewChild('submitBtn', {static: false}) submitBtn;
    loadingError: any;

    pickedAuthorities = [];
    pickedSchedules = [];
    selectedAvatar: any;
    private showPsswd = false;
    private editEmployeeImage$: Subscription;
    editName: boolean;
    editEmail: boolean;
    editPassword: boolean;
    editAuthorities: boolean;
    editSchedules: boolean;
    editSubdivision: boolean;
    editHireDate: boolean;
    editRosters = false;
    editTimeOff = false;
    editTaxId = false;
    editPersonalEmail = false;

    @ViewChild('stepper', {static: false}) stepper: MatStepper;
    showSchedules = false;
    showRosters = false;
    isSubmitting = false;
    allSubdivisions$ = new BehaviorSubject<Subdivision[]>([]);
    alternateSubdivision = false;

    translateMap = {
        'SUBPROVIDER_FULL' : 'prof-norestrictions',
        'SUBPROVIDER_SCHED' : 'specialist',
        'SUBPROVIDER_SCHED_VIEW' : 'prof-schedule-view',
        'SUBPROVIDER_ADMIN' : 'prof-admin',
        'SUBPROVIDER_PAY' : 'prof-payments',
        'SUBPROVIDER_CUSTOMERS' : 'pricing-8',
        'SUBPROVIDER_ROSTER' : 'roster',
        'SUBPROVIDER_ROSTER_VIEW' : 'roster-view'

    };

    pickedSubdivisions = [];
    timeManagement: boolean;
    profile = true;
    absences = true;
    overtime: boolean;
    timeRequests$ = new BehaviorSubject<TimeRequest[]>(null);
    loadingTimeRequests = true;


    constructor(private modalService: ModalService,
                private auth: AuthService,
                public employeeService: EmployeeService,
                private signInForm: SignInForm,
                public translate: LocalizationService,
                private toast: ToastService,
                private router: Router,
                private actionSheetController: ActionSheetController,
                private alert: AlertService,
                private ref: ChangeDetectorRef,
                private rosterService: RosterService,
                public timeUtil: DateTimeUtilService,
                private dateAdapter: DateAdapter<any>,
                public employeeProfileService: EmployeeProfileService,
                private loadingService: LoadingService) {
        this.dateAdapter.setLocale(this.translate.getLocale());
        this.dateAdapter.getFirstDayOfWeek = () => 1;
    }

    ngOnInit() {
        this.isLoading = true;
        this.employeeService.employee$.next(null);
        this.employeeService.imageSrc$.next('no-pic');
        this.loadEmployeeSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    if (this.id) {
                        this.employeeService.getEmployee(token, this.id).subscribe(
                            response => {

                                const serverResponse = response as Employee;
                                this.employeeService.getSchedules(token).subscribe(
                                    response => {
                                        this.editForm = this.setForm(serverResponse, response);
                                        this.schedules$.next(response);
                                        this.employeeService.employee$.next(serverResponse);
                                    }
                                );
                                this.isLoading = false;
                            }, error => {
                                this.loadingError = error;
                                this.isLoading = false;
                            }
                        );
                    } else {
                        this.employeeService.getSchedules(token).subscribe(
                            response => {
                                this.schedules$.next(response);
                                this.createForm = this.setForm(undefined, response);
                                this.isLoading = false;
                            }, error => {
                                this.loadingError = error;
                                this.isLoading = false;
                            }
                        );
                    }

                    this.employeeService.loadSubdivisions(token).subscribe(
                        response => {
                            if (response) {
                                this.allSubdivisions$.next(response);
                            }
                        }
                    );

                    if (this.id) {
                        this.employeeService.getTimeRequestsForEmployee(token, this.id).pipe(
                            catchError((err) => {
                                this.loadingTimeRequests = false;
                                return throwError(err);
                            })).pipe(distinctUntilChanged(), take(1)).subscribe(
                            async response => {
                                this.timeRequests$.next(response);
                                this.loadingTimeRequests = false;
                            }
                        );
                    }

                } else {
                    this.isLoading = false;
                }
            } , error => {
                this.loadingError = error;
                this.isLoading = false;
            }
        );

    }

    ngOnDestroy(): void {
        if (this.loadEmployeeSub$) {
            this.loadEmployeeSub$.unsubscribe();
        }

        if (this.editEmployeeSub$) {
            this.editEmployeeSub$.unsubscribe();
        }

        this.modalService.employeeModalOpen = false;
    }

    async dismiss() {
        await this.modalService.dismissEmployeeModal();
    }

    private setForm(employee?: Employee, schedules?) {
        this.editPassword = false;
        this.editName = false;
        this.editEmail = false;
        this.editSchedules = false;
        this.editAuthorities = false;
        this.editRosters = false;
        this.editSubdivision = false;
        this.editHireDate = false;
        this.editTaxId = false;
        this.editPersonalEmail = false;
        this.editTimeOff = false;

        const passwordValidators = [
            this.signInForm.patternValidator(/\d/, { hasNumber: true }),
            this.signInForm.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
            this.signInForm.patternValidator(/[a-z]/, { hasSmallCase: true }),
            Validators.minLength(8)
        ];

        let name = null;
        let email = null;

        let allSchedules = false;

        if (employee) {
            name = employee.name;
            email = employee.username;
            allSchedules = employee.authorizedSchedules && employee.authorizedSchedules.length === 0;
        } else {
            passwordValidators.push(Validators.required);
        }

        const form: FormGroup = new FormGroup( {
            name: new FormControl(name, [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
            email: new FormControl(email, [Validators.required, Validators.email,
                Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+'), Validators.maxLength(50)]),
            personalEmail: new FormControl(employee ? employee.personalEmail : null, [Validators.email,
                Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+'), Validators.maxLength(50)]),
            division: new FormControl(null, Validators.maxLength(255)),
            subdivision: new FormControl(null, Validators.maxLength(255)),
            jobTitle: new FormControl(employee ? employee.jobTitle : null, Validators.maxLength(255)),
            subdivisionId: new FormControl(employee ? employee.subdivisionId : null),
            password: new FormControl(null, Validators.compose(passwordValidators)),
            authorizations: new FormControl(null, Validators.required),
            availabilityIds: new FormControl(null),
            subdivisionIds: new FormControl(null),
            allSchedules: new FormControl(allSchedules),
            timeOffBalance: employee ? new FormGroup({
                vacationDays: new FormControl(employee.timeOffBalance.vacationDays),
                vacationRolloverDays: new FormControl(employee.timeOffBalance.vacationRolloverDays),
                complimentaryBankHolidayDays: new FormControl(employee.timeOffBalance.complimentaryBankHolidayRolloverDays),
                complimentaryBankHolidayRolloverDays: new FormControl(employee.timeOffBalance.complimentaryBankHolidayRolloverDays),
                compensationDays: new FormControl(employee.timeOffBalance.compensationDays),
                compensationRolloverDays: new FormControl(employee.timeOffBalance.compensationRolloverDays)
            }) : new FormControl(),
            hireDate: new FormControl(employee ? employee.registerDate : null),
            taxId: new FormControl(employee ? employee.taxPayerId : null)
        });

        if (employee) {
            employee.authorities.forEach(
                authority => {
                    this.populateControlToArray(authority, 'authorizations', this.pickedAuthorities, form);
                }
            );
        } else {
            this.populateControlToArray('SUBPROVIDER_ROSTER_VIEW', 'authorizations', this.pickedAuthorities, form);
        }

        form.valueChanges.subscribe(
            value => {
                this.formChanged = form.valid;
            }
        );

        return form;
    }

    submitForm() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }

    async onSubmitForm() {
        this.formSubmitted = true;
        if (this.createForm.valid) {

            if ((this.createForm.controls.subdivision.value && !this.createForm.controls.division.value)
                || (!this.createForm.controls.subdivision.value && this.createForm.controls.division.value)
                || (this.createForm.controls.subdivision.value && this.createForm.controls.subdivision.value.length > 0
                    && this.createForm.controls.division.value && this.createForm.controls.division.value.length < 1)
                || (this.createForm.controls.subdivision.value && this.createForm.controls.subdivision.value.length < 1
                    && this.createForm.controls.division.value && this.createForm.controls.division.value.length > 0)
            ) {
                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('subdivision-nodivision'), [   {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'
                }]);
                return;

            }

            this.isSubmitting = true;

            this.loadEmployeeSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                async token => {
                    if (token) {
                        const form = this.createForm.value;

                        if (this.alternateSubdivision) {
                            form.subdivisionId = null;
                        }

                        this.employeeService.createEmployee(token, form).subscribe(
                            async response => {
                                if (response['message']) {
                                    this.isSubmitting = false;
                                    this.ref.detectChanges();
                                    switch (response['message']) {
                                        case 'bindingError':
                                            await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'existingUser':
                                            await this.toast.presentToast(this.translate.getFromKey('reg-alreadyRegistered'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'createCustomerError':
                                            await this.toast.presentToast(this.translate.getFromKey('emp-new-error'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'newUserError':
                                            await this.toast.presentToast(this.translate.getFromKey('emp-new-error'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'limitExceeded':
                                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('upgrade-more-employees'), [
                                                {
                                                    text: this.translate.getFromKey('close'),
                                                    role: 'destructive'
                                                },
                                                {
                                                    text: this.translate.getFromKey('upgrade-plan'),
                                                    handler: async () => {
                                                        await this.router.navigateByUrl('/user/profile/payments');
                                                    }

                                                },

                                            ]);
                                            await this.dismiss();

                                    }
                                } else {
                                    this.employeeService.imageSrc$.pipe(distinctUntilChanged(), take(1)).subscribe(
                                        async image => {
                                            if (image !== 'no-pic') {
                                                const b: any = converterDataURItoBlob(image);
                                                b.lastModifiedDate = new Date();
                                                b.name = 'avatar.jpg';
                                                this.employeeService.uploadAvatar(token, b, response['id'].toString()).subscribe(
                                                    async () => {
                                                        this.isLoading = false;
                                                        await this.refresh();
                                                        await this.toast.presentToast(this.translate.getFromKey('emp-new-success'), alertPosition, 'success' , 2000);
                                                    }, async () => {
                                                        this.isLoading = false;
                                                        await this.refresh();
                                                        await this.toast.presentToast(this.translate.getFromKey('emp-new-success'), alertPosition, 'success' , 2000);
                                                    }
                                                );
                                            } else {
                                                await this.refresh();
                                                await this.toast.presentToast(this.translate.getFromKey('emp-new-success'), alertPosition, 'success' , 2000);
                                            }

                                        }
                                    );

                                }

                            } , async error1 => {
                                this.isSubmitting = false;
                                this.ref.detectChanges();
                                await this.toast.presentToast(this.translate.getFromKey('emp-new-error'), alertPosition, 'danger' , 4000);
                            }
                        );
                    } else {
                        this.isSubmitting = false;
                        this.ref.detectChanges();
                        await this.toast.presentToast(this.translate.getFromKey('emp-new-error'), alertPosition, 'danger' , 4000);
                    }
                }, async error => {
                    this.isSubmitting = false;
                    this.ref.detectChanges();
                    await this.toast.presentToast(this.translate.getFromKey('emp-new-error'), alertPosition, 'danger' , 4000);
                }
            );
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }

    }

    async onSubmitEditForm() {
        this.formSubmitted = true;
        if (this.editForm.valid) {

            if ((this.editForm.controls.subdivision.value && !this.editForm.controls.division.value)
                || (!this.editForm.controls.subdivision.value && this.editForm.controls.division.value)
                || (this.editForm.controls.subdivision.value && this.editForm.controls.subdivision.value.length > 0
                    && this.editForm.controls.division.value && this.editForm.controls.division.value.length < 1)
                || (this.editForm.controls.subdivision.value && this.editForm.controls.subdivision.value.length < 1
                    && this.editForm.controls.division.value && this.editForm.controls.division.value.length > 0)
            ) {
                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('subdivision-nodivision'), [   {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'
                }]);
                return;

            }

            this.isLoading = true;
            this.loadEmployeeSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                async token => {
                    if (token) {
                        const form = this.editForm.value;

                        if (this.pickedSchedules && this.pickedSchedules.length > 0) {
                            form.availabilityIds = this.pickedSchedules;
                        }

                        if (this.alternateSubdivision) {
                            form.subdivisionId = null;
                        }

                        this.employeeService.editEmployee(token, form, this.id).subscribe(
                            async response => {
                                if (response['message']) {
                                    switch (response['message']) {
                                        case 'bindingError':
                                            await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'invalidEmployee':
                                            await this.toast.presentToast(this.translate.getFromKey('emp-invalid'), alertPosition, 'danger' , 4000);
                                            break;
                                        case 'editError':
                                            await this.toast.presentToast(this.translate.getFromKey('emp-new-edit'), alertPosition, 'danger' , 4000);
                                            break;
                                    }
                                    this.isLoading = false;
                                    this.ref.detectChanges();
                                } else {
                                    this.employeeService.employee$.next(null);
                                    const employee = response as Employee;
                                    this.employeeService.employee$.next(employee);
                                    this.setForm(employee);
                                    this.isLoading = false;
                                    this.formChanged = false;
                                    this.pickedSchedules = [];
                                    this.pickedSchedules = [];
                                    await this.toast.presentToast(this.translate.getFromKey('emp-edit-success'), alertPosition, 'success' , 2000);
                                    await this.refresh(true);

                                }

                            } , async error1 => {
                                this.isLoading = false;
                                this.ref.detectChanges();
                                await this.toast.presentToast(this.translate.getFromKey('emp-new-edit'), alertPosition, 'danger' , 4000);
                            }
                        );

                    } else {
                        this.isLoading = false;
                        this.ref.detectChanges();
                        await this.toast.presentToast(this.translate.getFromKey('emp-new-edit'), alertPosition, 'danger' , 4000);
                    }
                }, async error => {
                    this.isLoading = false;
                    this.ref.detectChanges();
                    await this.toast.presentToast(this.translate.getFromKey('emp-new-edit'), alertPosition, 'danger' , 4000);
                }
            );
        } else {
            await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
            return;
        }

    }

    private async refresh(noDismiss?: boolean) {
        this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigate(['/user/profile/employees']));
        if (!noDismiss) {
            await this.dismiss();
        }
    }

    async choosePic(employee?: Employee) {
        if (!employee) {
            this.createImagePicker.nativeElement.click();
        } else {
            if (!employee.avatar) {
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
                                this.deleteEmployeeAvatar();
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
    }


    async editPickedPic(value) {
        if (value === 'no-pic') {
            this.createImagePicker.nativeElement.click();
        } else {
            const actionSheet = await this.actionSheetController.create({
                buttons: [
                    {
                        text: this.translate.getFromKey('upload'),
                        icon: 'camera',
                        handler: () => {
                            this.createImagePicker.nativeElement.click();
                        }
                    },
                    {
                        text: this.translate.getFromKey('delete'),
                        icon: 'trash',
                        cssClass: 'actionsheet-delete',
                        handler: () => {
                            this.deleteAvatar();
                            this.employeeService.imageSrc$.next('no-pic');
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

    async onCreateImagePicked(event: any) {
        this.selectedAvatar = event.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event: any) => {
            let cssClass = '';
            if (!this.mobile && !this.tablet) {
                cssClass = 'edit-image-modal';
            } else if (this.tablet) {
                cssClass = 'edit-image-modal-tablet';
            }
            await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, undefined, undefined,
                undefined, undefined, true);

        };
        reader.readAsDataURL(event.target.files[0]);
    }

    onImagePicked(event: any) {
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
            await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, undefined, undefined, false, this.id);
        };
    }


    deleteAvatar() {
        this.selectedAvatar = undefined;
        this.employeeService.imageSrc$.next('no-pic');
    }

    deleteEmployeeAvatar() {
        this.isLoading = true;
        this.editEmployeeImage$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                this.isLoading = false;
                if (token) {
                    this.employeeService.deleteAvatar(token, this.id).subscribe(
                        async response => {
                            this.isLoading = false;
                            if (response['message'] === 'avatarDeleteSuccess') {
                                const currentEmployee = this.employeeService.employee$.value;
                                currentEmployee.avatar = undefined;
                                this.employeeService.employee$.next(currentEmployee);
                                this.isLoading = false;
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


    showPassword() {
        if (this.showPsswd) {
            return 'text';
        } else {
            return 'password';
        }
    }

    setShowPassword() {
        this.showPsswd = !this.showPsswd;
    }


    addControlToArray(ev: any, control, array: any[]) {
        const checked = ev.detail.checked;
        const value = ev.detail.value;
        let controlArray;
        if (!this.id) {
            controlArray = this.createForm.get(control);
        } else {
            controlArray = this.editForm.get(control);
        }

        if (checked) {
            if (!array.includes(value)) {
                array.push(value);
                if (controlArray) {
                    controlArray.patchValue(array);
                } else {
                    this.formChanged = true;
                }
            }
        } else {
            array.splice(array.indexOf(value), 1);
            if (controlArray) {
                controlArray.patchValue(array);
                if (array.length === 0) {
                    controlArray.patchValue(null);
                } else {
                    this.formChanged = true;
                }
            }

        }

        if (control === 'authorizations') {

            if (controlArray.value && (controlArray.value.includes('SUBPROVIDER_SCHED') || controlArray.value.includes('SUBPROVIDER_SCHED_VIEW') || controlArray.value.includes('SUBPROVIDER_FULL'))) {
                this.showSchedules = true;
            } else {
                this.showSchedules = false;
            }

            if (controlArray.value && (controlArray.value.includes('SUBPROVIDER_ROSTER')
                || controlArray.value.includes('SUBPROVIDER_FULL'))) {
                this.showRosters = true;
            } else {
                this.showRosters = false;
            }

        }


    }

    populateControlToArray(value: string, control, array: any[], form: FormGroup) {
        const controlArray = form.get(control);
        if (!array.includes(value)) {
            array.push(value);
            controlArray.patchValue(array);
        }


    }

    checkIfChecked(value: any, array: any[]) {
        return array.includes(value);
    }

    editField(field: string) {
        if (field === 'name') {
            this.editName = true;
        }

        if (field === 'subdivision') {
            this.editSubdivision = true;
        }
        if (field === 'email') {
            this.editEmail = true;
        }

        if (field === 'password') {
            this.editPassword = true;
        }

        if (field === 'authorities') {
            this.editAuthorities = true;
        }

        if (field === 'schedules') {
            this.editSchedules = true;
        }

        if (field === 'rosters') {
            this.editRosters = true;
        }

        if (field === 'timeOff') {
            this.editTimeOff = true;
        }

        if (field === 'hireDate') {
            this.editHireDate = true;
        }

        if (field === 'taxId') {
            this.editTaxId = true;
        }

        if (field === 'personalEmail') {
            this.editPersonalEmail = true;
        }



    }

    translateAuthority(authority: string) {
        if (authority.includes('SUBPROVIDER')) {
            return this.translate.getFromKey(this.translateMap[authority]);
        }
    }


    allSchedules(ev: any, control) {
        const checked = ev.detail.checked;
        let controlArray;
        if (!this.id) {
            controlArray = this.createForm.get(control);
        } else {
            controlArray = this.editForm.get(control);
        }
        if (checked) {
            controlArray.setValue([]);
        }
    }

    async showAvatar(avatar: string) {
        await this.modalService.openImageModal(ImageComponent, avatar);
    }

    async performDelete() {
        await this.alert.presentAlert(
            this.translate.getFromKey('emp-delete'),
            null,
            null,
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    cssClass: 'actionsheet-delete',
                    text: this.translate.getFromKey('delete'),
                    handler: () => {
                        this.isLoading = true;
                        this.editEmployeeSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {
                                    const idsToArchive = {
                                        idsToDelete: []
                                    };
                                    idsToArchive.idsToDelete.push(this.id);
                                    this.employeeService.deleteEmployees(token, idsToArchive).subscribe(
                                        async response => {
                                            this.isLoading = false;
                                            switch (response['message']) {
                                                case 'deleteEmployeeError':
                                                    // tslint:disable-next-line:max-line-length
                                                    await this.toast.presentToast(this.translate.getFromKey('emp-delete-error'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'invalidEmployee':
                                                    // tslint:disable-next-line:max-line-length
                                                    await this.toast.presentToast(this.translate.getFromKey('emp-invalid'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'bindingError':
                                                    // tslint:disable-next-line:max-line-length
                                                    await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 4000);
                                                    break;
                                                default:
                                                    await this.toast.presentToast(this.translate.getFromKey('emp-delete-success'), alertPosition, 'success', 1000);
                                                    this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                                                        this.router.navigate(['/user/profile/employees']));
                                                    await this.dismiss();

                                            }
                                        }, async error => {
                                            this.isLoading = false;
                                            await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                                        }
                                    );

                                } else {
                                    this.isLoading = false;
                                }
                            }, async error => {
                                this.isLoading = false;
                                await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                            }
                        );
                    }
                }

            ]
        );
    }

    async roster(employee: Employee) {
        await this.rosterService.editRoster(employee);
    }

    nextStep() {
        this.stepper.next();
    }

    prevStep() {
        this.stepper.previous();
    }

    otherSubdivision(event: CustomEvent) {
        this.alternateSubdivision = event.detail.value === 'other';
    }

    getAuthorizedRosters() {
        const employee = this.employeeService.employee$.value;
        const allRosters = this.allSubdivisions$.value;
        const rosters = [];
        allRosters.filter(subdivision => employee.authorizedRosters.includes(subdivision.subdivisionId)).forEach(
            roster => {
                rosters.push(roster.subdivision + ' (' + roster.division + ')')
            }
        );

        return rosters.join(', ');
    }

    updateTimeOffInput(control, event: number) {
        control.setValue(event);
    }

    async openTimeRequests(open: boolean) {
        this.timeManagement = open;
        this.profile = !open;
    }

    async timeRequestSegmentChanged(ev: any) {
        const value = ev.detail.value;
        this.absences = value === 'absences';
        this.overtime = value === 'overtime';
    }

    downloadAttachment(requestId: number, attachment: string) {
        this.editEmployeeSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {
                const loading = await this.loadingService.showLoading(this.translate.getFromKey('loading'));
                await loading.present();
                this.employeeProfileService.getTimeRequestAttachment(token, requestId, attachment).subscribe(
                    async response => {
                        if (response) {

                            let type = 'image/jpeg';

                            if (attachment.includes('.pdf')) {
                                type = 'application/pdf';
                            }

                            if (attachment.includes('.png')) {
                                type = 'image/png';
                            }

                            const blob = new Blob([response], {type: type});
                            const url = window.URL.createObjectURL(blob);
                            window.open(url);
                            await this.loadingService.dismissLoading();
                        }

                    }, async error => {
                        await this.loadingService.dismissLoading();
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('customer-gdpr-download-error'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                        }]);
                    }
                );

            }
        }, async error => {
            await this.loadingService.dismissLoading();
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('customer-gdpr-download-error'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
            }]);

        });
    }

    async approveTimeRequest(timeRequest: TimeRequest) {

        const actionSheet = await this.actionSheetController.create({
            header: this.translate.getFromKey(timeRequest.overtime ? 'overtime' : 'absence') + ' - ' +
                this.timeUtil.showLocalDateFromDateString(this.translate.getLocale(), timeRequest.start) + ', ' +
                this.timeUtil.showLocalTimeFromDateString(this.translate.getLocale(), timeRequest.start) + ' - ' +
                this.timeUtil.showLocalTimeFromDateString(this.translate.getLocale(), timeRequest.end),
            buttons: this.renderApproveButtons(timeRequest)
        });
        await actionSheet.present();

    }

    private renderApproveButtons(timeRequest: TimeRequest) {
        if (timeRequest.toBeApproved) {
            return [
                {
                    text: this.translate.getFromKey('deny'),
                    icon: 'close-outline',
                    cssClass: 'actionsheet-delete',
                    handler: async () => {
                        await this.processApproveTimeRequest(true, timeRequest.id);
                    }
                },
                {
                    text: this.translate.getFromKey('approve'),
                    icon: 'checkmark-outline',
                    handler: async () => {
                        await this.processApproveTimeRequest(false, timeRequest.id);

                    }
                },
                {
                    text: this.translate.getFromKey('close'),
                    icon: 'close',
                    role: 'cancel',

                }
            ];
        }

        if (timeRequest.approved) {
            return [
                {
                    text: this.translate.getFromKey('deny'),
                    icon: 'close-outline',
                    cssClass: 'actionsheet-delete',
                    handler: async () => {
                        await this.processApproveTimeRequest(true, timeRequest.id);
                    }
                },
                {
                    text: this.translate.getFromKey('close'),
                    icon: 'close',
                    role: 'cancel',

                }
            ];
        }

        return [

            {
                text: this.translate.getFromKey('approve'),
                icon: 'checkmark-outline',
                handler: async () => {
                    await this.processApproveTimeRequest(false, timeRequest.id);

                }
            },
            {
                text: this.translate.getFromKey('close'),
                icon: 'close',
                role: 'cancel',

            }
        ];

    }

    private async processApproveTimeRequest(deny: boolean, timeRequestId: number) {
        const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
        await loading.present();
        this.editEmployeeSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {

                this.employeeService.approveTimeRequest(token, timeRequestId, deny).subscribe(
                    async response => {
                        await this.loadingService.dismissLoading();
                        switch (response.message) {
                            case 'success':
                                const currentTimeRequestList = this.timeRequests$.value;
                                const timeRequest = currentTimeRequestList.filter(req => req.id === timeRequestId)[0];
                                if (timeRequest) {
                                    timeRequest.toBeApproved = false;
                                    timeRequest.approved = !deny;
                                }
                                this.timeRequests$.next(currentTimeRequestList);
                                await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                                break;
                            case 'invalidRequest':
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                                    text: this.translate.getFromKey('close'),
                                    role: 'cancel'
                                }]);
                                break;
                            default:
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                    text: this.translate.getFromKey('close'),
                                    role: 'cancel'
                                }]);
                        }


                    }, async error => {
                        await this.loadingService.dismissLoading();
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                        }]);
                    }
                );

            } else {
                await this.loadingService.dismissLoading();
                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'
                }]);

            }}, async error => {
            await this.loadingService.dismissLoading();
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
            }]);

        });
    }
}
