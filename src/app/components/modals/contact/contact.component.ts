import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BASE_URL, mobile, tablet} from '../../../app.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth/auth.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {Provider} from '../../../store/models/provider.model';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, OnDestroy {

    @Input() sales: boolean;
    @Input() provider: Provider;

    mobile = mobile;
    tablet = tablet;
    contactForm;
    anonymousUser$ = new BehaviorSubject<boolean>(false);
    submitted = false;
    isLoading = false;
    userSub$: Subscription;

    /*  get access to button to be submitted programmatically*/
    @ViewChild('submitBtn', {static: false}) submitBtn;
    constructor(private modalService: ModalService,
                private auth: AuthService,
                private http: HttpClient,
                private toast: ToastService,
                private translate: LocalizationService) { }

    ngOnInit() {
        this.contactForm = new FormGroup({
            email: new FormControl(this.provider ? this.provider.username : null, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
            name: new FormControl(this.provider ? this.provider.name : null),
            subject: new FormControl(this.sales ? 'Sales' : null, [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
            message: new FormControl(null, [Validators.required, Validators.minLength(50), Validators.maxLength(255)]),
            recaptcha: new FormControl('', [Validators.required])
        });

        this.userSub$ = this.auth.getLoggedUser().subscribe(
            user => {
                if (!user) {
                    this.contactForm.controls.email.setValidators([Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+'),
                        Validators.required]);
                    this.contactForm.controls.name.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(30)]);
                    this.anonymousUser$.next(true);
                }
            }
        );

    }

    ngOnDestroy(): void {
        if (this.userSub$) {
            this.userSub$.unsubscribe();
        }

        this.dismiss();
    }

    async dismiss() {
        await this.modalService.dismissContactModal();
    }

    async onSubmit() {
        this.submitted = true;
        if (this.contactForm.valid) {
            this.isLoading = true;
            this.userSub$ = this.auth.getLoggedUser().subscribe(
                user => {
                    let email;
                    let name;
                    if (!user) {
                        email = this.contactForm.controls.email.value;
                        name = this.contactForm.controls.name.value;

                    } else {
                        email = user.username;
                        name = user.name;
                    }

                    const contactRequest = {
                        email: email,
                        name: name,
                        subject: this.contactForm.controls.subject.value,
                        message: this.contactForm.controls.message.value,
                        recaptcha: this.contactForm.controls.recaptcha.value
                    };

                    let position;
                    if (mobile) {
                        position = 'bottom';
                    } else {
                        position = 'top';
                    }
                    this.http.post<any>(BASE_URL + '/info/contact/rest', contactRequest).subscribe(
                        response => {
                            this.isLoading = false;
                            switch (response.message) {
                                case 'bindingError':
                                    this.toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), position, 'danger', 6000);
                                    break;
                                case 'captchaException':
                                    this.toast.presentToast(this.translate.getFromKey('reg-captchaException'), position, 'danger', 6000);
                                    break;
                                case 'maxAttemptsReached':
                                    this.toast.presentToast(this.translate.getFromKey('contact-maxAttemptsReached'), position, 'danger', 6000);
                                    break;
                                case 'emailError':
                                    this.toast.presentToast(this.translate.getFromKey('contact-emailError'), position, 'danger', 6000);
                                    break;
                                default:
                                    this.toast.presentToast(this.translate.getFromKey('contact-emailSuccess'), position, 'success', 2000);
                                    this.dismiss();
                                    break;
                            }

                        }, error => {
                            this.isLoading = false;
                            this.toast.presentToast(this.translate.getFromKey('contact-emailError'), position, 'danger', 6000);
                        }

                    );

                }
            );

        } else {
            return;
        }

    }


    locale() {
        return this.translate.getLocale();
    }

    siteKey() {
        return '6LdCU1QUAAAAABVt5CVo4wefptdH5YRq8xdT5Wbx';
    }

    submitForm() {
        this.submitBtn.nativeElement.click();
    }
}
