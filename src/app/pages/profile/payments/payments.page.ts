import {Component, OnDestroy, ViewChild} from '@angular/core';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {BehaviorSubject, Subscription, throwError} from "rxjs";
import {Payment, Plan, Provider} from '../../../store/models/provider.model';
import {AuthService} from "../../../services/auth/auth.service";
import {PaymentsService} from "../../../services/user/payments.service";
import {catchError, distinctUntilChanged} from "rxjs/operators";
import {faSms} from "@fortawesome/free-solid-svg-icons";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {LocalizationService} from "../../../services/localization/localization.service";
import {LoadingService} from "../../../services/loading/loading.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {DateTimeUtilService} from "../../../services/util/date-time-util.service";
import {CountryCodesService} from "../../../services/arrays/countrycodes.service";
import {InfoComponent} from "../../../components/popover/info/info.component";
import {InfoPopoverService} from "../../../services/util/info-popover.service";
import {ContactComponent} from '../../../components/modals/contact/contact.component';
import {IonRouterOutlet} from '@ionic/angular';
import {ModalService} from '../../../services/overlay/modal.service';

declare let paypal: any;

@Component({
    selector: 'app-payments',
    templateUrl: './payments.page.html',
    styleUrls: ['./payments.page.scss'],
    animations: [
        standardAnimation
    ]
})
export class PaymentsPage implements OnDestroy{
    alertPosition = alertPosition;

    mobile = mobile;
    tablet = tablet;
    isLoading = false;
    plan$  = new BehaviorSubject<Plan>(null);
    payments$ = new BehaviorSubject<Payment[]>(null);
    totalPayments$ = new BehaviorSubject<number>(null);
    planSub$: Subscription;
    paymentSub$: Subscription;
    submitPaymentSub$: Subscription;
    loadingError: any;
    viewPlan = true;
    history = false;

    smsIcon = faSms;

    page = 1;
    paymentsPerPage = 20;
    isPaginatorLoading: boolean;
    pageIndex = 0;

    paymentForm: FormGroup;
    smsForm: FormGroup;

    ratesTable = false;

    smsPrice = '6.00';
    smsPayButtonRendered = false;

    planChanged = false;

    smsCredits = [
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
        '1000',
        '2000',
        '3000',
        '4000',
        '5000',
        '6000',
        '7000',
        '8000',
        '9000',
        '10000',
    ];


    @ViewChild('submitPlanBtn', {static: false}) submitPlanBtn;
    @ViewChild('submitSMSBtn', {static: false}) submitSMSBtn;

    planBasic = false;
    private planBUSINESS: boolean;
    // tslint:disable-next-line:variable-name
    private planBUSINESS_YEAR: boolean;
    private planPLUS: boolean;
    private planPRO: boolean;
    // tslint:disable-next-line:variable-name
    private planPLUS_YEAR: boolean;
    // tslint:disable-next-line:variable-name
    private planPRO_YEAR: boolean;
    formChanged: boolean;
    isSMSLoading: boolean;
    paypalButtonGenerated: boolean;

    provider$ = new BehaviorSubject<Provider>(null);

    constructor(private auth: AuthService,
                public paymentsService: PaymentsService,
                private router: Router,
                public translate: LocalizationService,
                private loadingService: LoadingService,
                private toast: ToastService,
                public dateTimeUtilService: DateTimeUtilService,
                public countryCodesService: CountryCodesService,
                private popoverService: InfoPopoverService,
                private routerOutlet: IonRouterOutlet,
                private modalService: ModalService) { }

    ionViewWillEnter() {
        this.isLoading = true;
        this.cancelAllPlans();
        this.planSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.paymentsService.getPlan(token).pipe(
                        catchError((err) => {
                            this.loadingError = err;
                            this.isLoading = false;
                            return throwError(err)})).subscribe(response => {
                            this.plan$.next(response);
                            this.setForm();

                            this.isLoading = false;
                        }
                    );

                    this.auth.loadProviderFromServer(token, true).subscribe(
                        provider => {
                            this.provider$.next(provider);
                            this.auth.setLoggedUser(provider);
                        });

                } else {
                    this.loadingError = true;
                    this.isLoading = false;
                }
            }, error => {
                this.loadingError = error;
                this.isLoading = false;
            });
    }

    ionViewWillLeave() {
        this.cancelSubs();
    }

    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        if (this.planSub$) {
            this.planSub$.unsubscribe();
        }

        if (this.paymentSub$) {
            this.paymentSub$.unsubscribe();
        }

        if (this.submitPaymentSub$) {
            this.submitPaymentSub$.unsubscribe();
        }

    }

    private setForm() {
        this.formChanged = false;
        this.paymentsService.editPlan = false;
        this.paymentsService.buySMS = false;
        this.paymentForm = new FormGroup({
            plan: new FormControl(null, Validators.required),
        });
        this.paymentForm.statusChanges.subscribe(
            () => {
                if (this.paymentForm.valid) {
                    this.formChanged = true;
                }
            }
        )
    }

    private setSmsForm() {
        this.smsForm = new FormGroup({
            smsCount: new FormControl('400', Validators.required),
        });
    }

    private loadPayments() {
        this.isLoading = true;
        this.paymentSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.paymentsService.getPayments(token, this.page, this.paymentsPerPage).pipe(
                        catchError((err) => {
                            this.loadingError = err;
                            this.isLoading = false;
                            return throwError(err)})).subscribe(response => {
                            this.payments$.next(response['payments']);
                            this.totalPayments$.next(response['total']);
                            this.isLoading = false;
                        }
                    )
                } else {
                    this.loadingError = true;
                    this.isLoading = false;
                }
            }, error => {
                this.loadingError = error;
                this.isLoading = false;
            });
    }

    async segmentChanged(ev: any) {
        const value = ev.detail.value;
        this.viewPlan = value === 'plan';
        this.history = value === 'history';

        if (this.history) {
            if (!this.payments$.value) {
                this.loadPayments();
            }
        }
    }

    paginator(ev: any) {
        const pageIndex = ev['pageIndex'] as number;
        this.paymentsPerPage = ev['pageSize'] as number;
        this.page = pageIndex + 1;
        this.loadPayments();

    }

    buy(name: string) {
        if (name === 'plan') {
            this.paymentsService.editPlan = true;
        }

        if (name === 'sms') {
            this.paymentsService.buySMS = true;
            this.setSmsForm();
        }
    }

    submitPlan() {
        const button: HTMLElement = this.submitPlanBtn.nativeElement;
        button.click();
    }
    onSubmitPlanForm() {
        if (this.paymentForm.valid) {
            this.isLoading = true;
            this.submitPaymentSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                token => {
                    if (token) {
                        this.paymentsService.submitPlanPayment(token, this.paymentForm.value).subscribe(async response => {
                                if (response['planId']) {
                                    this.planChanged = false;
                                    await this.setPayPalButton(response['planId']);
                                    this.formChanged = false;
                                } else if (response['message']) {
                                    switch (response['message']) {
                                        case 'paymentError':
                                            await this.toast.presentToast(this.translate.getFromKey('plan-update-error'), alertPosition, 'danger' , 4000);
                                            break;
                                        default:
                                            this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                                                this.router.navigateByUrl('/user/profile/payments'));
                                            await this.toast.presentToast(this.translate.getFromKey('plan-update-success'), alertPosition, 'success' , 2000);
                                    }

                                }
                                this.isLoading = false;
                            }, error => {
                                this.isLoading = false;
                            }
                        )
                    } else {
                        this.isLoading = false;
                    }
                }, error => {
                    this.isLoading = false;
                });
        } else {
            return;
        }

    }

    async buySms() {
        const button: HTMLElement = this.submitSMSBtn.nativeElement;
        button.click();
    }

    onSubmitSmsForm() {
        if (this.smsForm.valid) {
            this.isSMSLoading = true;
            this.paypalButtonGenerated = false;
            this.submitPaymentSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                token => {
                    if (token) {
                        this.paymentsService.submitSMSPayment(token, this.smsForm.value).subscribe(async response => {
                                if (response['total']) {
                                    this.paypalButtonGenerated = true;
                                    this.setSMSPayPalButton(response['total'], response['tax'], response['base']);
                                } else if (response['message']) {
                                    await this.toast.presentToast(this.translate.getFromKey('page400'), alertPosition, 'danger' , 4000);
                                }
                                this.isSMSLoading = false;
                            }, error => {
                                this.isSMSLoading = false;
                            }
                        )
                    } else {
                        this.isSMSLoading = false;
                    }
                }, error => {
                    this.isSMSLoading = false;
                });

        } else {
            return;
        }

    }


    changePlanValue(ev: any) {
        const plan = ev.detail.value;
        this.planBasic = plan === 'BASIC';
        switch (plan) {
            default:
                this.cancelAllPlans();
                break;
            case 'PLUS':
                this.cancelAllPlans();
                this.planPLUS  = true;
                break;
            case 'PRO':
                this.cancelAllPlans();
                this.planPRO = true;
                break;
            case 'PRO_YEAR':
                this.cancelAllPlans();
                this.planPRO_YEAR = true;
                break;
            case 'PLUS_YEAR':
                this.cancelAllPlans();
                this.planPLUS_YEAR = true;
                break;
            case 'BUSINESS':
                this.cancelAllPlans();
                this.planBUSINESS = true;
                break;
            case 'BUSINESS_YEAR':
                this.cancelAllPlans();
                this.planBUSINESS_YEAR = true;
                break;



        }

    }

    private cancelAllPlans(){
        this.planChanged = true;
        this.planPRO_YEAR = false;
        this.planPLUS_YEAR = false;
        this.planBasic = false;
        this.planPLUS = false;
        this.planPRO = false;
        this.planBUSINESS = false;
        this.planBUSINESS_YEAR = false;
        this.paypalButtonGenerated = false;

    }

    private async setPayPalButton(id: string) {
        const paymentsService = this.paymentsService;
        let submitPaymentSub$ = this.submitPaymentSub$;
        const auth = this.auth;
        const planPRO = this.planPRO;
        const planPLUS = this.planPLUS;
        const planPRO_YEAR = this.planPRO_YEAR;
        const planPLUS_YEAR = this.planPLUS_YEAR;
        const planBUSINESS = this.planBUSINESS;
        const planBUSINESS_YEAR = this.planBUSINESS_YEAR;

        const loadingService = this.loadingService;
        const translate = this.translate;
        const toast = this.toast;
        const alertPosition = this.alertPosition;
        const router = this.router;

        setTimeout(() => {
            paypal.Buttons({
                style: {
                    layout:  'vertical',
                    color:   'blue',
                    shape:   'pill',
                    label:   'paypal'
                },
                // tslint:disable-next-line:only-arrow-functions
                createSubscription: function(data, actions) {
                    return actions.subscription.create({
                        'plan_id': id
                    });
                },
                // tslint:disable-next-line:only-arrow-functions
                onApprove: async function(data, actions) {
                    const loading = await loadingService.showLoading(translate.getFromKey('processing'));
                    await loading.present();
                    submitPaymentSub$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                        async token => {
                            if (token) {
                                const form = {
                                    subscriptionId: data.subscriptionID,
                                    plus: planPLUS,
                                    pro: planPRO,
                                    plus_year: planPLUS_YEAR,
                                    pro_year: planPRO_YEAR,
                                    business: planBUSINESS,
                                    business_year: planBUSINESS_YEAR
                                };

                                paymentsService.submitSubscription(token, form).subscribe(async response => {
                                        switch (response['message']) {
                                            case 'paymentError':
                                                await toast.presentToast(translate.getFromKey('plan-update-error'), alertPosition, 'danger' , 4000);
                                                break;
                                            default:
                                                router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                                                    router.navigateByUrl('/user/profile/payments'));
                                                await toast.presentToast(translate.getFromKey('plan-update-success'), alertPosition, 'success' , 2000);
                                        }

                                        await loadingService.dismissLoading();
                                    }, async error => {
                                        await loadingService.dismissLoading();
                                    }
                                )
                            } else {
                                await loadingService.dismissLoading();
                            }
                        }, async error => {
                            await loadingService.dismissLoading();
                        });
                }

            }).render('#paypal-button-container');

        }, 100)
    }

    private async setSMSPayPalButton(total: string, tax: string, base: string) {
        const paymentsService = this.paymentsService;
        let submitPaymentSub$ = this.submitPaymentSub$;
        const auth = this.auth;
        const loadingService = this.loadingService;
        const translate = this.translate;
        const toast = this.toast;
        const alertPosition = this.alertPosition;
        const router = this.router;

        setTimeout(() => {
            paypal.Buttons({
                style: {
                    layout:  'vertical',
                    shape:   'pill',
                    label:   'paypal',
                },
                createOrder: function(data, actions) {
                    // This function sets up the details of the transaction, including the amount and line item details.
                    return actions.order.create(
                        {
                            purchase_units: [{
                                amount: {
                                    currency_code: 'EUR',
                                    value: total,
                                    breakdown : {
                                        item_total: {
                                            currency_code: 'EUR',
                                            value: base
                                        },
                                        tax_total: {
                                            currency_code: 'EUR',
                                            value: tax
                                        }
                                    }

                                }
                            }],
                            application_context: {
                                locale: translate.getLocale()
                            }
                        }
                    );
                },
                onApprove:async function(data, actions) {
                    const loading = await loadingService.showLoading(translate.getFromKey('processing'));
                    await loading.present();

                    submitPaymentSub$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                        async token => {
                            if (token) {
                                paymentsService.submitSMSOrder(token, {orderId: data.orderID}).subscribe(async response => {
                                        switch (response['message']) {
                                            case 'paymentError':
                                                await toast.presentToast(translate.getFromKey('pay-paymentError'), alertPosition, 'danger' , 4000);
                                                break;
                                            default:
                                                router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                                                    router.navigateByUrl('/user/profile/payments'));
                                                await toast.presentToast(translate.getFromKey('pay-paymentSuccess'), alertPosition, 'success' , 2000);
                                        }

                                        await loadingService.dismissLoading();
                                    }, async error => {
                                        await loadingService.dismissLoading();
                                    }
                                )
                            } else {
                                await loadingService.dismissLoading();
                            }
                        }, async error => {
                            await loadingService.dismissLoading();
                        });
                }

            }).render('#paypal-sms-button-container');

        }, 100);
    }

    seeRates() {
        this.ratesTable = !this.ratesTable;

    }

    getValue(event: any) {
        let value;
        if (event.target) {
            value = +event.target.value;
        } else {
            value = event.value;
        }

        if (value >= 400) {
            const price = (value * 1.5) / 100;
            this.smsPrice = price.toFixed(2).toString();
        }
    }

    async infoPopover(info: string, event: any) {
        await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event);
    }

    showSms(sms: string) {
        const credits = +sms;
        return credits.toFixed(2);

    }

    async contact(provider: Provider) {
        let cssClass = '';
        if (!mobile) {
            cssClass = 'contact-modal';
        }
        await this.modalService.openContactUsModal(ContactComponent, cssClass, this.routerOutlet.nativeEl, true, provider);
    }
}
