import {Component, ViewChild} from '@angular/core';
import {BASE_URL, mobile, standardAnimation, tablet} from '../../../app.component';
import {EmployeeProfileService} from '../../../services/user/employee-profile.service';
import {AuthService} from '../../../services/auth/auth.service';
import {catchError, distinctUntilChanged, filter, take} from 'rxjs/operators';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {Router} from '@angular/router';
import {Employee} from '../../../store/models/provider.model';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {CountryCodesService} from '../../../services/arrays/countrycodes.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {UserService} from '../../../services/user/user.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {EmployeeService} from '../../../services/user/employee.service';
import {animate, query, stagger, style, transition, trigger} from '@angular/animations';
import {LoadingService} from '../../../services/loading/loading.service';

@Component({
    selector: 'app-employee-profile',
    templateUrl: './employee-profile.page.html',
    styleUrls: ['./employee-profile.page.scss'],
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
    ],
})
export class EmployeeProfilePage {

    mobile = mobile;
    tablet = tablet;
    BASE_URL = BASE_URL;

    @ViewChild('submitBtn', {static: false}) submitBtn;
    @ViewChild('filePicker', {static: false}) filePicker: any;

    isLoading = true;
    private employeeSub$: Subscription;
    private downloadSub$: Subscription;
    editProfileForm: FormGroup;

    roster = true;
    timeOff: boolean;
    profile: boolean;

    absences = true;
    overtime: boolean;


    allEmployeesMap$ = new BehaviorSubject<any>(null);

    editAddress: boolean;
    editBankAccount: boolean;
    editPhone: boolean;
    editFamily: boolean;
    editPersonalEmail: boolean;

    formChanged: boolean;
    formSubmitted: boolean;
    phoneControls: any;
    familyControls: any;
    isSubmitting: boolean;

    renderRosters = true;
    subdivisionId: string | undefined;
    divisionId: string | undefined;

    // show all employees with no division
    all: boolean;

    // for attachment submission
    requestId: number;

    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    year = new Date().getFullYear();

    constructor(public employeeProfileService: EmployeeProfileService,
                public auth: AuthService,
                private router: Router,
                public countryCodesService: CountryCodesService,
                public translate: LocalizationService,
                public userService: UserService,
                private alert: AlertService,
                private toast: ToastService,
                public timeUtil: DateTimeUtilService,
                private employeeService: EmployeeService,
                private loadingService: LoadingService) {
    }

    async ionViewWillEnter() {
        this.employeeSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
            token => {
                if (token) {
                    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).pipe(filter(value => value !== undefined)).subscribe(
                        async authorities => {
                            if (this.auth.userRole(authorities).includes('PROVIDER')) {
                                await this.router.navigateByUrl('/user/profile/account');
                            } else {
                                this.employeeProfileService.getProfile(token).subscribe(
                                    response => {
                                        this.employeeProfileService.employee$.next(response);
                                        this.setForm(response);
                                        this.isLoading = false;


                                    }, error => {
                                        this.isLoading = false;
                                    }
                                );

                            }

                        });

                    if (!this.auth.getLoggedUser().value) {
                        this.auth.loadLoggedUserFromServer(token).subscribe(
                            provider => {
                                this.auth.setLoggedUser(provider);
                            }
                        );
                    }

                    this.employeeService.getAllEmployeesForSharedRosterView(token).pipe(
                        catchError((err) => {
                            this.isLoading = false;
                            return throwError(err);
                        })).pipe(distinctUntilChanged(), take(1)).subscribe(
                        async response => {
                            this.allEmployeesMap$.next(this.reduceGroupDivision(response));
                            this.isLoading = false;
                        }
                    );

                    this.employeeProfileService.getTimeRequests(token).pipe(
                        catchError((err) => {
                            return throwError(err);
                        })).pipe(distinctUntilChanged(), take(1)).subscribe(
                        async response => {
                            this.employeeProfileService.timeRequests$.next(response);
                        }
                    );



                } else {
                    this.isLoading = false;
                }
            }, error => {
                this.isLoading = false;
            }

        );


    }

    async ionViewWillLeave() {
        if (this.downloadSub$) {
            this.downloadSub$.unsubscribe();
        }

        if (this.employeeSub$) {
            this.employeeSub$.unsubscribe();
        }
    }

    private setForm(employee: Employee) {

        this.editAddress = false;
        this.editBankAccount = false;
        this.editFamily = false;
        this.editPhone = false;
        this.editPersonalEmail = false;

        this.phoneControls = undefined;
        this.familyControls = undefined;
        this.formChanged = false;

        this.editProfileForm = new FormGroup({
            address: new FormGroup({
                street: new FormControl(employee.homeAddress ? employee.homeAddress.street : null),
                postalCode: new FormControl(employee.homeAddress ? employee.homeAddress.postalCode : null),
                city: new FormControl(employee.homeAddress ? employee.homeAddress.city : null),
                province: new FormControl(employee.homeAddress ? employee.homeAddress.province : null),
                country: new FormControl(employee.homeAddress ? employee.homeAddress.country : null)
            }),
            phones:  new FormArray([]),
            bankAccount: new FormControl(employee.bankAccount),
            family:  new FormArray([]),
            personalEmail: new FormControl(employee ? employee.personalEmail : null, [Validators.email,
                Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+'), Validators.maxLength(50)]),
        });

        this.phoneControls = this.editProfileForm.get('phones')['controls'];
        this.familyControls = this.editProfileForm.get('family')['controls'];

        this.editProfileForm.valueChanges.subscribe(() => {
            this.formChanged = this.editProfileForm.valid;
        });

    }

    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.roster = value === 'roster';
        this.timeOff = value === 'timeOff';
        this.profile = value === 'profile';
        this.setForm(this.employeeProfileService.employee$.value);
    }

    async timeRequestSegmentChanged(ev: any) {
        const value = ev.detail.value;
        this.absences = value === 'absences';
        this.overtime = value === 'overtime';
    }


    calculateFirstDateOfMonth(monthIndex: number) {
        const today = new Date();
        const year = today.getFullYear();
        return new Date(year, monthIndex);
    }

    async onSubmitForm() {
        this.formSubmitted = true;

        if (this.editProfileForm.valid) {
            this.isSubmitting = true;
            this.employeeSub$ = this.auth.getCurrentToken().subscribe(async token => {
                    if (token) {
                        this.employeeProfileService.editProfile(token, this.editProfileForm.value).subscribe(
                            async response => {
                                this.isSubmitting = false;
                                if (response.id) {
                                    this.employeeProfileService.employee$.next(response);
                                    this.setForm(response);
                                    this.isSubmitting = false;
                                    await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                                } else {
                                    if (response.message) {
                                        switch (response.message) {
                                            case 'phoneTypeError':
                                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('phone-type-error'), [   {
                                                    text: this.translate.getFromKey('close'),
                                                    role: 'cancel'
                                                }]);
                                                break;
                                            case 'bindingError':
                                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [   {
                                                    text: this.translate.getFromKey('close'),
                                                    role: 'cancel'
                                                }]);
                                                break;
                                        }

                                    } else {
                                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('pay-mainError'), [   {
                                            text: this.translate.getFromKey('close'),
                                            role: 'cancel'
                                        }]);
                                    }
                                }
                            }, async error => {
                                this.isSubmitting = false;
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('pay-mainError'), [   {
                                    text: this.translate.getFromKey('close'),
                                    role: 'cancel'
                                }]);
                            }
                        );

                    } else {
                        this.isSubmitting = false;
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                        }]);
                    }
                }, async error => {
                    this.isSubmitting = false;
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('pay-mainError'), [   {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'
                    }]);

                }

            );
        } else {
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
            }]);
        }

    }

    submitForm() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }

    editField(field: string) {
        this.formChanged = false;
        if (field === 'bank') {
            this.editBankAccount = true;
        }

        if (field === 'address') {
            this.editAddress = true;
            this.editProfileForm.get('address.street').setValidators([Validators.minLength(3), Validators.required]);
            this.editProfileForm.get('address.postalCode').setValidators([Validators.minLength(3), Validators.required]);
            this.editProfileForm.get('address.city').setValidators([Validators.minLength(3), Validators.required]);
            this.editProfileForm.get('address.country').setValidators([Validators.minLength(3), Validators.required]);
        }

        if (field === 'phone') {
            this.editPhone = true;
            this.setPhoneFields();
        }

        if (field === 'family') {
            this.editFamily = true;
            this.setFamilyFields();
        }

        if (field === 'personalEmail') {
            this.editPersonalEmail = true;
        }
    }

    removePhone(i: number) {
        const formArray = this.editProfileForm.get('phones') as FormArray;
        formArray.removeAt(i);
    }

    removeFamilyMember(i: number) {
        const formArray = this.editProfileForm.get('family') as FormArray;
        formArray.removeAt(i);
    }

    addFamilyMember(kinship?: number, name?: string) {
        const formArray = this.editProfileForm.get('family') as FormArray;
        formArray.push(new FormGroup({
            kinship: new FormControl(kinship ? kinship : 0, Validators.required),
            name: new FormControl(name ? name : null, Validators.required)
        }));
    }

    translateKinship(kinship: number) {

        switch (kinship) {
            case 0:
                return this.translate.getFromKey('spouse');
            case 1:
                return this.translate.getFromKey('partner');
            default:
                return this.translate.getFromKey('child');
        }

    }

    setPhoneFields() {
        this.employeeProfileService.employee$.value.phones.forEach(
            phone => {
                this.userService.addPhoneField(this.editProfileForm, this.formChanged, phone.phoneType, '+' + phone.code + phone.number);
            }
        );
    }

    setFamilyFields() {
        this.employeeProfileService.employee$.value.family.forEach(
            member => {
                this.addFamilyMember(member.kinship, member.name);
            }
        );
    }

    cancel() {
        this.setForm(this.employeeProfileService.employee$.value);
    }

    private reduceGroupDivision(employees: Employee[]) {
        const list = employees.reduce((acc: Map<string, any>, item) => {
            if (Object.keys(acc).includes(item.division)) { return acc; }
            acc.set(item.division !== null ? item.division :  this.translate.getFromKey('no-division'), this.reduceGroupBySubdivision(employees.filter(g => g.division === item.division), true));
            return acc;
        }, new Map<string, any>());
        return list;
    }

    // group employees by subdivision name
    private reduceGroupBySubdivision(employees: Employee[], omitDivision?: boolean) {
        const list = employees.reduce((acc: {}, item) => {
            if (Object.keys(acc).includes(item.subdivision)) { return acc; }
            const divisionDetails = omitDivision ? '' : ' (' + item.division + ')';
            acc[item.subdivision !== null ? item.subdivision + divisionDetails :  this.translate.getFromKey('no-subdivision')] = employees.filter(g => g.subdivision === item.subdivision);
            return acc;
        }, {});
        return list;
    }


    getDivisionId(division: string) {
        const allDivisions = this.allEmployeesMap$.value;
        const divisionMap = allDivisions.get(division);
        if (divisionMap) {
            const [first] = Object.keys(divisionMap);
            return divisionMap[first][0].divisionId;
        }

    }

    pickEmployeeRoster(ev: any) {

        this.renderRosters = false;
        const value = ev.value;
        this.subdivisionId = undefined;
        this.divisionId = undefined;

        const splitId = value.split('=');

        if (splitId[0] === 'subdivisionId') {

            if (splitId[1].toString() !== 'null') {
                this.subdivisionId = splitId[1];
            } else {
                this.all = true;
            }
        }

        if (splitId[0] === 'divisionId') {
            this.divisionId = splitId[1];

            if (splitId[1].toString() !== 'null') {
                this.divisionId = splitId[1];
            } else {
                this.all = true;
            }
        }


        setTimeout(() => {
            this.renderRosters = true;
        }, 1);
    }

    downloadAttachment(requestId: number, attachment: string) {
        this.downloadSub$ = this.auth.getCurrentToken().subscribe(async token => {
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

    removeAttachment(requestId: number, key: string) {
        this.downloadSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {
                const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
                await loading.present();
                this.employeeProfileService.deleteTimeRequestAttachment(token, requestId, key).subscribe(
                    async response => {
                        await this.loadingService.dismissLoading();
                        if (response) {
                            switch (response.message) {
                                case 'bindingError':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;
                                default:
                                    const currentTimeRequestList = this.employeeProfileService.timeRequests$.value;
                                    const timeRequest = currentTimeRequestList.filter(req => req.id === requestId)[0];
                                    if (timeRequest) {
                                        timeRequest.attachments = timeRequest.attachments.filter(attach => attach !== key);
                                    }
                                    this.employeeProfileService.timeRequests$.next(currentTimeRequestList);
                                    await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);

                            }

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

    openFilePicker(requestId: number) {
        this.requestId = requestId;
        this.filePicker.nativeElement.click();
    }

    onFilePicked(event: any) {
        const file = event.target.files[0];
        this.downloadSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {
                const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
                await loading.present();
                this.employeeProfileService.uploadTimeRequestAttachment(token, file, this.requestId).subscribe(
                    async serverResponse => {

                        await this.loadingService.dismissLoading();

                        if (serverResponse.link as string | null) {
                            if (serverResponse.link.includes('https://bookanapp-employee-absence-request-attachment.s3.eu-west-3.amazonaws.com/')) {
                                const splitLink = serverResponse.link.split('https://bookanapp-employee-absence-request-attachment.s3.eu-west-3.amazonaws.com/')[1];
                                const currentTimeRequestList = this.employeeProfileService.timeRequests$.value;
                                const timeRequest = currentTimeRequestList.filter(req => req.id === this.requestId)[0];
                                if (timeRequest) {
                                    timeRequest.attachments.push(splitLink);
                                }
                                this.employeeProfileService.timeRequests$.next(currentTimeRequestList);
                            }
                            await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                        }
                        if (serverResponse.message) {
                            switch (serverResponse.message) {
                                case 'invalidFile':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-invalid'), [{
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;
                                case 'invalidRequest':
                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-error'), [{
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                    }]);
                                    break;

                            }
                        }
                    }, async error => {
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-error'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                        }]);
                        await this.loadingService.dismissLoading();

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

    async deleteFamily(id: number, name: string) {

        await this.alert.presentAlert(
            '',
            '',
            this.translate.getFromKey('delete') + ' ' + name +'?',
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    text: this.translate.getFromKey('submit'),
                    handler: async () => {
                        this.downloadSub$ = this.auth.getCurrentToken().subscribe(async token => {
                            if (token) {
                                const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
                                await loading.present();
                                this.employeeProfileService.deleteFamilyMember(token, id).subscribe(
                                    async response => {
                                        await this.loadingService.dismissLoading();
                                        if (response) {
                                            switch (response.message) {
                                                case 'invalidMember':
                                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                                                        text: this.translate.getFromKey('close'),
                                                        role: 'cancel'
                                                    }]);
                                                    break;
                                                default:
                                                    const employee = this.employeeProfileService.employee$.value;
                                                    employee.family = employee.family.filter(member => member.id !== id);
                                                    this.employeeProfileService.employee$.next(employee);
                                                    await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);

                                            }

                                        }


                                    }, async error => {
                                        await this.loadingService.dismissLoading();
                                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                            text: this.translate.getFromKey('close'),
                                            role: 'cancel'
                                        }]);
                                    }
                                );

                            }
                        }, async error => {
                            await this.loadingService.dismissLoading();
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                text: this.translate.getFromKey('close'),
                                role: 'cancel'
                            }]);

                        });
                    }
                }]
        );


    }

    async deletePhone(id: number, phone: string) {
        await this.alert.presentAlert(
            '',
            '',
            this.translate.getFromKey('delete') + ' ' + phone + '?',
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    text: this.translate.getFromKey('submit'),
                    handler: async () => {
                        this.downloadSub$ = this.auth.getCurrentToken().subscribe(async token => {
                            if (token) {
                                const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
                                await loading.present();
                                this.employeeProfileService.deletePhone(token, id).subscribe(
                                    async response => {
                                        await this.loadingService.dismissLoading();
                                        if (response) {
                                            switch (response.message) {
                                                case 'invalidPhone':
                                                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                                                        text: this.translate.getFromKey('close'),
                                                        role: 'cancel'
                                                    }]);
                                                    break;
                                                default:
                                                    const employee = this.employeeProfileService.employee$.value;
                                                    employee.phones = employee.phones.filter(ph => ph.id !== id);
                                                    this.employeeProfileService.employee$.next(employee);
                                                    await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);

                                            }

                                        }


                                    }, async error => {
                                        await this.loadingService.dismissLoading();
                                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                            text: this.translate.getFromKey('close'),
                                            role: 'cancel'
                                        }]);
                                    }
                                );

                            }
                        }, async error => {
                            await this.loadingService.dismissLoading();
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                                text: this.translate.getFromKey('close'),
                                role: 'cancel'
                            }]);

                        });
                    }
                }]
        );


    }

    changeYear(back: boolean) {
        this.renderRosters = false;
        if (back) {
            this.year = this.year - 1;
        } else {
            this.year = this.year + 1;
        }
        setTimeout(() => {
            this.renderRosters = true;

        }, 50);
    }
}
