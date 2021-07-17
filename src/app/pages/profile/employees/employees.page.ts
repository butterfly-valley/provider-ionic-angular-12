import {Component, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {AuthService} from '../../../services/auth/auth.service';
import {EmployeeService} from '../../../services/user/employee.service';
import {Employee} from '../../../store/models/provider.model';
import {faUserTie} from '@fortawesome/free-solid-svg-icons';
import {catchError, distinctUntilChanged, filter, take} from 'rxjs/operators';
import {IonContent, IonRouterOutlet, IonSegment, PopoverController} from '@ionic/angular';
import {ModalService} from '../../../services/overlay/modal.service';
import {EmployeeComponent} from '../../../components/modals/employee/employee.component';
import {PaginatorComponent} from '../../../components/popover/paginator/paginator.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {LoadingService} from '../../../services/loading/loading.service';
import {Router} from '@angular/router';
import {EditSubdivisionComponent} from '../../../components/modals/edit-subdivision/edit-subdivision.component';
import {MatSelectChange} from '@angular/material';
import {RosterService} from '../../../services/user/roster.service';
import {animate, query, stagger, state, style, transition, trigger} from '@angular/animations';


@Component({
    selector: 'app-employees',
    templateUrl: './employees.page.html',
    styleUrls: ['./employees.page.scss'],
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
export class EmployeesPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;

    @ViewChild('container', {static: false}) container: IonContent;

    isDownloading: any;
    isPaginatorLoading: any;
    employeeMap$ = new BehaviorSubject<any>(null);
    employeeDivisionMap$ = new BehaviorSubject<any>(null);
    allEmployees$ = new BehaviorSubject<Employee[]>(null);
    allEmployeesMap$ = new BehaviorSubject<any>(null);
    allDivisionsMap$ = new BehaviorSubject<any>(null);
    totalEmployees$ = new BehaviorSubject<number>(null);
    totalRosters$ = new BehaviorSubject<Employee[]>(null);
    employeesIds = [];
    loadingError: any;
    employeeIcon = faUserTie;
    isLoading: boolean;
    page = 1;
    employeesPerPage = 10;
    private employeesSub$: Subscription;
    private deleteEmployeesSub$: Subscription;

    allChecked: boolean;
    private pageIndex: number;

    authorized = true;

    @ViewChild('segment', {static: false}) segment: IonSegment;
    employees = true;
    schedule = false;

    renderRosters = false;
    preferredView;
    enteredPage = false;
    all = true;
    employee: Employee;
    subdivisionId;
    divisionId;
    noRosterSearchResults = false;
    searchingRoster = false;
    searchingEmployee = false;
    copiedSlot: any;
    rosterView = false;

    employeesLength: number;

    constructor(private auth: AuthService,
                public employeeService: EmployeeService,
                private modalService: ModalService,
                private popoverController: PopoverController,
                private translate: LocalizationService,
                private alert: AlertService,
                private toast: ToastService,
                public fullcalendarService: FullcalendarService,
                private localStorage: LocalStorageService,
                private loadingService: LoadingService,
                private router: Router,
                private routerOutlet: IonRouterOutlet,
                public rosterService: RosterService) { }

    async ionViewWillEnter() {
        this.preferredView = await this.localStorage.getItem('BOOKanAPPPreferredRosterView');
        this.isLoading = true;
        this.loadEmployees();
    }



    ionViewWillLeave() {
        this.cancelSubs();
    }

    ngOnDestroy(): void {
        this.cancelSubs();
    }


    private cancelSubs() {
        this.page = 1;
        if (this.employeesSub$) {
            this.employeesSub$.unsubscribe();
        }
        if (this.deleteEmployeesSub$) {
            this.deleteEmployeesSub$.unsubscribe();
        }
    }

    private loadEmployees() {
        this.isPaginatorLoading = true;
        this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
            token => {
                if (token) {
                    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).pipe(filter(value => value !== undefined)).subscribe(
                        authorities => {
                            if (this.auth.userPlan(authorities) === 'PRO' || this.auth.userPlan(authorities) === 'BUSINESS' ||  this.auth.userPlan(authorities) === 'ENTERPRISE') {
                                if (this.auth.userRole(authorities) === 'roster') {
                                    this.rosterView = true;
                                }

                                if (!this.rosterView) {

                                    this.employeeService.getAllEmployees(token, this.page, this.employeesPerPage).pipe(
                                        catchError((err) => {
                                            this.loadingError = err;
                                            this.isPaginatorLoading = false;
                                            return throwError(err);
                                        })).pipe(distinctUntilChanged(), take(1)).subscribe(
                                        async response => {
                                            this.authorized = true;

                                            const employees = response['entities'] as Employee[];
                                            this.employeesLength = employees.length;
                                            this.auth.userId$.pipe(distinctUntilChanged(), take(1)).subscribe(
                                                async id => {
                                                    if (id) {
                                                        // tslint:disable-next-line:only-arrow-functions
                                                        const filteredEmployees = employees.filter(function(employee) {
                                                            return employee.id.toString() !== id.toString();
                                                        });
                                                        this.allDivisionsMap$.next(this.reduceGroupDivision(filteredEmployees));
                                                        this.employeeMap$.next(this.reduceGroupBySubdivision(filteredEmployees));
                                                    } else {
                                                        this.employeeMap$.next(this.reduceGroupBySubdivision(employees));
                                                        this.allDivisionsMap$.next(this.reduceGroupDivision(employees));
                                                    }

                                                    this.totalEmployees$.next(response['total']);
                                                    await this.container.scrollToTop();
                                                    this.isPaginatorLoading = false;
                                                }
                                            );
                                        }
                                    );
                                } else {
                                    this.isPaginatorLoading = false;
                                    this.employeeMap$.next([]);
                                }

                                this.loadAllEmployees(token);

                            } else {
                                this.authorized = false;
                                this.isPaginatorLoading = false;
                            }
                        });
                } else {
                    this.isPaginatorLoading = false;
                }
            }
        );

    }


    paginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.employeesPerPage = ev['pageSize'] as number;
        this.page = pageIndex + 1;
        this.pageIndex = pageIndex;
        this.loadEmployees();

    }

    addToDeleteEmployee(id: string, event: any) {
        const checked = event.detail.checked;
        if (checked) {
            if (!this.employeesIds.includes(id.toString())) {
                this.employeesIds.push(id.toString());
            }
        } else {
            this.employeesIds.splice(this.employeesIds.indexOf(id.toString()), 1);
        }

    }


    async deleteEmployee(id: string) {
        await this.performDelete(id);
    }

    async deleteEmployees() {
        await this.performDelete();
    }

    private async performDelete(id?) {
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
                        this.deleteEmployeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {
                                    const idsToArchive = {
                                        idsToDelete: []
                                    };
                                    if (id) {
                                        idsToArchive.idsToDelete.push(id);
                                    } else {
                                        idsToArchive.idsToDelete = this.employeesIds;
                                    }

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
                                                    // tslint:disable-next-line:max-line-length
                                                    await this.toast.presentToast(this.translate.getFromKey('emp-delete-success'), alertPosition, 'success', 1000);
                                                    this.page = 1;
                                                    this.employeesIds = [];
                                                    this.loadEmployees();

                                            }
                                        }
                                    );

                                }
                            });
                    }
                }

            ]
        );
    }

    async addNew() {

        this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
            async authorities => {
                if ((authorities.includes('ROLE_PRO'))  && this.allEmployees$.value.length > 9) {
                    await this.showEmployeeLimitAlert();
                    return;
                } else if ((authorities.includes('ROLE_BUSINESS'))  && this.allEmployees$.value.length > 19) {
                    await this.showEmployeeLimitAlert();
                    return;
                } else {
                    let css = '';
                    if (!this.mobile || this.tablet) {
                        css = 'customer-modal';
                    }
                    await this.modalService.openEmployeeModal(EmployeeComponent, css, null, null);
                }
            }
        );

    }

    doRefresh(event: any) {
        this.loadEmployees();
        event.target.complete();
    }

    selectAllCheckboxes(employees: any[], event: any) {
        this.allChecked = event.detail.checked;
        employees.forEach(
            employee => {
                employee.checked = !!this.allChecked;
                if (employee.checked) {
                    if (!this.employeesIds.includes(employee.id.toString())) {
                        this.employeesIds.push(employee.id.toString());
                    }
                }
            }
        );
        if (!this.allChecked) {
            this.employeesIds = [];
        }
    }

    async openEmployee(employee: Employee) {

        let css = '';
        if (!this.mobile || this.tablet) {
            css = 'customer-modal';
        }
        await this.modalService.openEmployeeModal(EmployeeComponent, css, undefined, undefined, employee.id);
    }

    async loadMore(total) {
        const pageIndex = this.pageIndex;
        const employeesPerPage = this.employeesPerPage;

        const popover = await this.popoverController.create({
            component: PaginatorComponent,
            event: undefined,
            translucent: true,
            mode: 'md',
            componentProps: {
                total : total,
                bookanapp : undefined,
                customersPerPage: employeesPerPage,
                pageIndex: pageIndex},
            cssClass: 'paginator-popover',
        });
        await popover.present();
        return popover.onDidDismiss().then(
            (data: any) => {
                if (data) {
                    const paginatorData = data.data;
                    this.pageIndex = paginatorData.pageIndex;
                    this.paginator(paginatorData.paginatorEvent);

                }
            }
        );
    }

    searchEmployees(ev: CustomEvent) {
        this.isLoading = true;
        const searchTerm = ev.target['value'];
        if (searchTerm && searchTerm.toString().length > 1) {
            this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                token => {
                    if (token) {
                        this.employeeService.searchEmployees(token, searchTerm).pipe(
                            catchError((err) => {
                                this.loadingError = err;
                                this.isLoading = false;
                                return throwError(err);
                            })).subscribe(
                            response => {
                                this.searchingEmployee = true;
                                this.employeeDivisionMap$.next(this.reduceGroupBySubdivision(response as Employee[]));
                                // this.totalEmployees$.next(undefined);
                                this.isLoading = false;
                                setTimeout(() => {
                                    this.searchingEmployee = false;
                                }, 10);

                            }
                        );
                    } else {
                        this.isLoading = false;
                    }
                }
            );
        } else if (!searchTerm) {
            this.loadEmployees();
        }
    }


    /*toggle between employees and their schedule*/

    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.employees = value === 'employees';
        this.schedule = value === 'schedule';

        if (!this.enteredPage) {
            // this.renderRosters = false;
            setTimeout(() => {
                this.fullcalendarService.rosters$.next([]);
                // this.renderRosters = true;
            });

        }

    }

    private async showEmployeeLimitAlert() {
        return await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('upgrade-more-employees'), [
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
    }

    async editSubdivision(subdivisionId: number, divisionId: number, subdivisionName: string, divisionName: string) {
        let cssClass = '';
        if (!this.mobile) {
            cssClass = 'reset-password-modal';
        }

        await this.modalService.openEditSubdivisionModal(EditSubdivisionComponent, cssClass, subdivisionId, divisionId, subdivisionName, divisionName, this.routerOutlet.nativeEl);

    }

    // group employees by subdivision name
    private reduceGroupBySubdivision(employees: Employee[], omitDivision?: boolean) {
        const list = employees.reduce((acc: {}, item) => {
            if (Object.keys(acc).includes(item.subdivision)) { return acc; }
            const divisionDetails = omitDivision ? '' : ' (' + item.division + ')';
            acc[item.subdivision !== null ? item.subdivision + divisionDetails :  this.translate.getFromKey('no-subdivision')] = employees.filter(g => g.subdivision === item.subdivision);
            return acc;
        }, {});
        if (!omitDivision) {
            this.employeeMap$.next(list);
        }
        return list;
    }

    private reduceGroupDivision(employees: Employee[]) {
        const list = employees.reduce((acc: Map<string, any>, item) => {
            if (Object.keys(acc).includes(item.division)) { return acc; }
            acc.set(item.division !== null ? item.division :  this.translate.getFromKey('no-division'), this.reduceGroupBySubdivision(employees.filter(g => g.division === item.division), true));
            return acc;
        }, new Map<string, any>());

        this.employeeDivisionMap$.next(list);
        return list;
    }

    // extract divisionId from map
    getDivisionId(division: string) {
        const allDivisions = this.allEmployeesMap$.value;
        const divisionMap = allDivisions.get(division);
        if (divisionMap) {
            const [first] = Object.keys(divisionMap);
            return divisionMap[first][0].divisionId;
        } else {
            return undefined;
        }

    }

    pickEmployee(ev: MatSelectChange) {
        const value = ev.value;

        if (value === 'all') {
            this.loadPickedEmployees();
        } else {
            const splitId = value.split('=');

            if (splitId[0] === 'employeeId') {
                this.loadPickedEmployees(splitId[1], undefined, undefined);
            } else if (splitId[0] === 'subdivisionId') {
                this.loadPickedEmployees(undefined, splitId[1], undefined);
            } else if (splitId[0] === 'divisionId') {
                this.loadPickedEmployees(undefined, undefined, splitId[1]);
            }


        }
    }

    loadPickedEmployees(employeeId?: string, subdivisionId?: string, divisionId?: string) {
        this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
            token => {
                if (token) {
                    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).pipe(filter(value => value !== undefined)).subscribe(
                        authorities => {
                            if (this.auth.userPlan(authorities) === 'PRO' || this.auth.userPlan(authorities) === 'BUSINESS' ||  this.auth.userPlan(authorities) === 'ENTERPRISE') {
                                this.employeeService.getAllEmployees(token, this.page, this.employeesPerPage, employeeId, subdivisionId, divisionId).pipe(
                                    catchError((err) => {
                                        this.loadingError = err;
                                        this.isPaginatorLoading = false;
                                        return throwError(err);
                                    })).pipe(distinctUntilChanged(), take(1)).subscribe(
                                    async response => {
                                        this.authorized = true;
                                        const employees = response['entities'] as Employee[];
                                        this.auth.userId$.pipe(distinctUntilChanged(), take(1)).subscribe(
                                            async id => {
                                                if (id) {
                                                    // tslint:disable-next-line:only-arrow-functions
                                                    const filteredEmployees = employees.filter(function(employee) {
                                                        return employee.id.toString() !== id.toString();
                                                    });
                                                    // this.employees$.next(filteredEmployees);
                                                    this.reduceGroupBySubdivision(filteredEmployees);
                                                    this.reduceGroupDivision(filteredEmployees);
                                                } else {
                                                    // this.employees$.next(employees);
                                                    this.reduceGroupBySubdivision(employees);
                                                    this.reduceGroupDivision(employees);
                                                }
                                                // this.totalEmployees$.next(response['total']);
                                                await this.container.scrollToTop();
                                                this.isPaginatorLoading = false;
                                            }

                                        );
                                    }
                                );

                            } else {
                                this.authorized = false;
                                this.isPaginatorLoading = false;
                            }
                        });
                } else {
                    this.isPaginatorLoading = false;
                }
            }
        );
    }

    loadAllEmployees(token: string) {
        this.employeeService.getAllEmployeesForRosterView(token).pipe(
            catchError((err) => {
                this.loadingError = err;
                this.isPaginatorLoading = false;
                return throwError(err);
            })).pipe(distinctUntilChanged(), take(1)).subscribe(
            async response => {
                this.allEmployees$.next(response);
                this.allEmployeesMap$.next(this.reduceGroupDivision(response));
            }
        );
    }

}
