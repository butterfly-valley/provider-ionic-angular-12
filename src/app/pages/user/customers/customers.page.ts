import {Component, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {CustomerService} from '../../../services/user/customer.service';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {BookanappCustomer, Customer} from '../../../store/models/user.model';
import {AuthService} from '../../../services/auth/auth.service';
import {catchError, distinctUntilChanged, take} from 'rxjs/operators';
import {faAd, faCalendarCheck, faSms, faUsers} from '@fortawesome/free-solid-svg-icons';
import {ModalService} from '../../../services/overlay/modal.service';
import {CustomerComponent} from '../../../components/modals/customer/customer.component';
import {ImageComponent} from '../../../components/modals/image/image.component';
import {CreateCustomerComponent} from '../../../components/modals/customer/create-customer/create-customer.component';
import {AlertService} from '../../../services/overlay/alert.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {CampaignComponent} from '../../../components/modals/customer/campaign/campaign.component';
import {IonContent, IonRouterOutlet, IonSegment, PopoverController} from '@ionic/angular';
import {PaginatorComponent} from '../../../components/popover/paginator/paginator.component';
import {animate, query, stagger, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-customers',
    templateUrl: './customers.page.html',
    styleUrls: ['./customers.page.scss'],
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
                                '50ms',
                                animate(
                                    '50ms ease-out',
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
export class CustomersPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;
    appointmentIcon = faCalendarCheck;
    own: boolean;
    bookanapp: boolean;
    page = 1;
    bookanappPage = 1;
    ownCustomersPerPage = 10;
    bookanappCustomersPerPage = 10;

    totalOwnCustomers$ = new BehaviorSubject<number>(null);
    ownCustomer$ = new BehaviorSubject<Customer[]>(null);
    totalBookanappCustomers$ = new BehaviorSubject<number>(null);
    bookanappCustomers$ = new BehaviorSubject<BookanappCustomer[]>(null);
    ownCustomerSub$: Subscription;
    downloadGDPRSub$: Subscription;
    bookanappCustomerSub$: Subscription;
    loadingError;
    isLoading = false;
    isDownloading = false;
    customersIds = [];
    bookanappCustomersIds = [];
    smsIcon = faSms;
    adsIcon = faAd;
    deleteCustomerSub$: Subscription;
    allChecked = false;
    allBookanappChecked = false;
    isPaginatorLoading: boolean;
    pageIndex = 0;
    pageIndexBookanapp = 0;
    customersIcon = faUsers;

    authorized = true;

    @ViewChild('container', {static: false}) container: IonContent;
    @ViewChild('segment', {static: false}) segment: IonSegment;

    constructor(public customerService: CustomerService,
                private auth: AuthService,
                private modalService: ModalService,
                private alert: AlertService,
                private translate: LocalizationService,
                private toast: ToastService,
                private popoverController: PopoverController,
                private routerOutlet: IonRouterOutlet) { }

    ionViewWillEnter() {
        this.isLoading = true;
        this.own = true;
        this.bookanapp = false;
        this.segment.value = 'own';
        this.loadCustomers();
    }

    ionViewWillLeave() {
        this.page = 1;
        this.bookanappPage = 1;
        this.cancelSubs();
    }


    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        if (this.ownCustomerSub$) {
            this.ownCustomerSub$.unsubscribe();
        }

        if (this.bookanappCustomerSub$) {
            this.bookanappCustomerSub$.unsubscribe();
        }

        if (this.downloadGDPRSub$) {
            this.downloadGDPRSub$.unsubscribe();
        }
    }

    searchCustomers(ev: CustomEvent) {
        this.isLoading = true;
        const searchTerm = ev.target['value'];
        if (searchTerm && searchTerm.toString().length>1) {
            this.ownCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                token => {
                    if (token) {
                        this.customerService.searchOwnCustomers(token, searchTerm, true).pipe(
                            catchError((err) => {
                                this.loadingError = err;
                                this.isLoading = false;
                                return throwError(err);
                            })).subscribe(
                            response => {
                                this.ownCustomer$.next(response as Customer[]);
                                this.totalOwnCustomers$.next(undefined);
                                this.isLoading = false;
                            }
                        );

                    } else {
                        this.isLoading = false;
                    }
                }
            );
        } else if (!searchTerm) {
            this.loadCustomers();
        }
    }


    searchBookanappCustomers(ev: CustomEvent) {
        this.isLoading = true;
        const searchTerm = ev.target['value'];
        if (searchTerm && searchTerm.toString().length>1) {
            this.bookanappCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                token => {
                    if (token) {
                        this.customerService.searchOwnCustomers(token, searchTerm, false).pipe(
                            catchError((err) => {
                                this.loadingError = err;
                                this.isLoading = false;
                                return throwError(err);
                            })).subscribe(
                            response => {
                                this.bookanappCustomers$.next(response as BookanappCustomer[]);
                                this.totalBookanappCustomers$.next(undefined);
                                this.isLoading = false;
                            }
                        );
                    } else {
                        this.isLoading = false;
                    }
                }
            );
        } else if (!searchTerm) {
            this.loadBookanappCustomers();
        }
    }


    private loadCustomers() {
        this.isPaginatorLoading = true;
        this.ownCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
                        authorities => {
                            if (this.auth.userPlan(authorities) === 'PRO' || this.auth.userPlan(authorities) === 'BUSINESS' ||  this.auth.userPlan(authorities) === 'ENTERPRISE') {
                                this.customerService.getOwnCustomers(token, this.page, this.ownCustomersPerPage, true).pipe(
                                    catchError((err) => {
                                        this.loadingError = err;
                                        this.isPaginatorLoading = false;
                                        return throwError(err);
                                    })).subscribe(
                                    async response => {
                                        this.totalOwnCustomers$.next(response['total']);
                                        this.ownCustomer$.next(response['entities'] as Customer[]);
                                        await this.container.scrollToTop();
                                        this.isPaginatorLoading = false;
                                    }
                                );
                            } else {
                                this.authorized = false;
                                this.isPaginatorLoading = false;
                            }
                        }
                    );

                    this.auth.loadProviderFromServer(token).subscribe(
                        provider => {
                            this.auth.setLoggedUser(provider);
                            this.auth.userStats$.next(provider.userStats);
                        }
                    );
                } else {
                    this.isPaginatorLoading = false;
                }
            }
        );
    }

    private loadBookanappCustomers() {
        this.isPaginatorLoading = true;
        this.bookanappCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.customerService.getOwnCustomers(token, this.page, this.bookanappCustomersPerPage, false).pipe(
                        catchError((err) => {
                            this.loadingError = err;
                            this.isPaginatorLoading = false;
                            return throwError(err);
                        })).subscribe(
                        async response => {
                            this.totalBookanappCustomers$.next(response['total']);
                            this.bookanappCustomers$.next(response['entities'] as BookanappCustomer[]);
                            await this.container.scrollToTop();
                            this.isPaginatorLoading = false;
                        }
                    );
                } else {
                    this.isPaginatorLoading = false;
                }
            }
        );
    }


    /*toggle between own and BOOKanAPP*/

    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.own = value === 'own';
        this.bookanapp = value === 'bookanapp';

        if (!this.bookanappCustomers$.value) {
            this.loadBookanappCustomers();
        }

    }

    doRefresh(event: any) {
        if (this.own) {
            this.loadCustomers();
        } else {
            this.loadBookanappCustomers();
        }
        event.target.complete();
    }

    async showAvatar(avatar: string) {
        await this.modalService.openImageModal(ImageComponent, avatar);

    }

    async showCustomer(id: string, bookanapp: boolean) {

        let css = '';
        if (!this.mobile || this.tablet) {
            css = 'customer-modal'
        }
        await this.modalService.openCustomerModal(CustomerComponent, css, id, bookanapp, undefined, undefined);
    }

    async addNew() {
        let css = '';
        if (!this.mobile || this.tablet) {
            css = 'customer-modal'
        }
        await this.modalService.openCreateCustomerModal(CreateCustomerComponent, css, this.routerOutlet.nativeEl);
    }

    paginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.ownCustomersPerPage = ev['pageSize'] as number;
        this.page = pageIndex + 1;
        this.loadCustomers();

    }

    paginatorBookanapp(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.bookanappCustomersPerPage = ev['pageSize'] as number;
        this.bookanappPage = pageIndex + 1;
        this.loadBookanappCustomers();
    }

    async deleteCustomers() {
        this.performDelete();

    }

    selectAllCheckboxes(customers: any, event: any) {
        this.allChecked = event.detail.checked;
        customers.forEach(
            customer => {
                customer.checked = !!this.allChecked;
            }
        );
    }

    selectAllCheckboxesBookanapp(customers: any, event: any) {
        this.allBookanappChecked = event.detail.checked;
        customers.forEach(
            customer => {
                customer.checked = !!this.allBookanappChecked;
            }
        );
    }

    addToDeleteCustomer(id: string, event: any) {
        const checked = event.detail.checked;
        if (checked) {
            this.customersIds.push(id.toString());
        } else {
            this.customersIds.splice(this.customersIds.indexOf(id.toString()), 1);
        }
    }

    addBookanappCustomer(id: string, event: any) {
        const checked = event.detail.checked;
        if (checked) {
            this.bookanappCustomersIds.push(id.toString());
        } else {
            this.bookanappCustomersIds.splice(this.bookanappCustomersIds.indexOf(id.toString()), 1);
        }
    }


    async deleteCustomer(id) {
        this.performDelete(id);
    }


    async smsCampaign(id?) {
        let ids = [];
        if (id) {
            ids.push(id);
        } else {
            ids = this.customersIds;
        }

        let cssClass = '';
        if(!mobile) {
            cssClass = 'campaign-modal';
        }
        await this.modalService.openCampaignModal(CampaignComponent, cssClass, ids, false, false, this.routerOutlet.nativeEl);
    }

    async promoCampaign(id?) {
        let ids = [];
        if (id) {
            ids.push(id);
        } else {
            ids = this.bookanappCustomersIds;
        }

        let cssClass = '';
        if(!mobile) {
            cssClass = 'ads-campaign-modal';
        }
        await this.modalService.openCampaignModal(CampaignComponent, cssClass, ids, false, true, this.routerOutlet.nativeEl);
    }

    async promoCampaignAll() {
        if (this.allBookanappChecked) {
            await this.alert.presentAlert(
                this.translate.getFromKey('customer-promo'),
                null,
                this.translate.getFromKey('customer-promo-all'),
                [
                    {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                    },
                    {
                        text: this.translate.getFromKey('continue'),
                        handler: async () => {
                            let cssClass = '';
                            if (!mobile) {
                                cssClass = 'campaign-modal';
                            }
                            await this.modalService.openCampaignModal(CampaignComponent, cssClass, this.bookanappCustomersIds, true, true, this.routerOutlet.nativeEl);
                        }
                    }

                ]
            );
        } else {
            await this.alert.presentAlert(
                this.translate.getFromKey('customer-promo'),
                null,
                this.translate.getFromKey('customer-promo-send'),
                [
                    {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                    },
                    {
                        text: this.translate.getFromKey('continue'),
                        handler: async () => {
                            let cssClass = '';
                            if (!mobile) {
                                cssClass = 'campaign-modal';
                            }
                            await this.modalService.openCampaignModal(CampaignComponent, cssClass, this.bookanappCustomersIds, false, true, this.routerOutlet.nativeEl);
                        }
                    }

                ]
            );
        }
    }

    async smsCampaignAll() {
        if (this.allChecked) {
            await this.alert.presentAlert(
                this.translate.getFromKey('customer-sms-campaign'),
                null,
                this.translate.getFromKey('customer-sms-all'),
                [
                    {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                    },
                    {
                        text: this.translate.getFromKey('continue'),
                        handler: async () => {
                            let cssClass = '';
                            if(!mobile) {
                                cssClass = 'campaign-modal';
                            }
                            await this.modalService.openCampaignModal(CampaignComponent, cssClass, this.customersIds, true, false, this.routerOutlet.nativeEl);
                        }
                    }

                ]
            );
        } else {
            await this.alert.presentAlert(
                this.translate.getFromKey('customer-sms-campaign'),
                null,
                this.translate.getFromKey('customer-sms-send'),
                [
                    {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                    },
                    {
                        text: this.translate.getFromKey('continue'),
                        handler: async () => {
                            let cssClass = '';
                            if(!mobile) {
                                cssClass = 'campaign-modal';
                            }
                            await this.modalService.openCampaignModal(CampaignComponent, cssClass, this.customersIds, false, false, this.routerOutlet.nativeEl);
                        }
                    }

                ]
            );

        }

    }


    downloadGDPR(customerId: string, ads: boolean) {
        this.isDownloading = true;
        this.downloadGDPRSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
                if (token) {
                    const id = {
                        customerId: customerId
                    }
                    this.customerService.downloadGDPR(token, id, ads).subscribe(
                        response => {
                            this.isDownloading = false;
                            const blob = new Blob([response], { type: 'application/pdf' });
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.download = 'gdpr.pdf';
                            link.target = '_self';
                            link.click();
                        }, async error => {
                            this.isDownloading = false;
                            await this.toast.presentToast(this.translate.getFromKey('customer-gdpr-download-error'), alertPosition, 'danger', 4000);

                        }
                    )
                } else {
                    this.isDownloading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-gdpr-download-error'), alertPosition, 'danger', 4000);
                }
            },async error => {
                this.isDownloading = false;
                await this.toast.presentToast(this.translate.getFromKey('customer-gdpr-download-error'), alertPosition, 'danger', 4000);
            }
        );

    }


    private async performDelete(id?) {
        await this.alert.presentAlert(
            this.translate.getFromKey('customer-deleteCustomer-message'),
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
                        this.deleteCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                            token => {
                                if (token) {
                                    const idsToArchive = {
                                        idsToDelete: []
                                    };
                                    if (id) {
                                        idsToArchive.idsToDelete.push(id);
                                    } else {
                                        idsToArchive.idsToDelete = this.customersIds;
                                    }

                                    this.customerService.deleteCustomers(token, idsToArchive).subscribe(
                                        async response => {
                                            this.isLoading = false;
                                            switch (response['message']) {
                                                case 'deleteCustomerError':
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'invalidCustomer':
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-invalidCustomer'), alertPosition, 'danger', 4000);
                                                    break;
                                                case 'bindingError':
                                                    await this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), alertPosition, 'danger', 4000);
                                                    break;
                                                default:
                                                    await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerSuccess'), alertPosition, 'success', 1000);
                                                    this.page = 1;
                                                    this.customersIds = [];
                                                    this.loadCustomers();

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

    async loadMore(total, bookanapp) {
        let pageIndex = this.pageIndex;
        if (bookanapp) {
            pageIndex = this.pageIndexBookanapp;
        }

        let customersPerPage = this.ownCustomersPerPage;
        if (bookanapp) {
            customersPerPage = this.bookanappCustomersPerPage;
        }

        const popover = await this.popoverController.create({
            component: PaginatorComponent,
            event: undefined,
            translucent: true,
            mode: 'md',
            componentProps: {
                total : total,
                bookanapp : bookanapp,
                customersPerPage: customersPerPage,
                pageIndex: pageIndex},
            cssClass: 'paginator-popover',
        });
        await popover.present();
        return popover.onDidDismiss().then(
            (data: any) => {
                if (data) {
                    const paginatorData = data.data;
                    this.pageIndex = paginatorData.pageIndex;
                    if (!paginatorData.bookanapp) {
                        this.paginator(paginatorData.paginatorEvent);
                    } else {
                        this.paginatorBookanapp(paginatorData.paginatorEvent);
                    }
                }
            }
        );
    }


}
