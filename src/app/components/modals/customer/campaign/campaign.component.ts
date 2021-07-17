import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {alertPosition, mobile, tablet} from "../../../../app.component";
import {ModalService} from "../../../../services/overlay/modal.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ToastService} from "../../../../services/overlay/toast.service";
import {LocalizationService} from "../../../../services/localization/localization.service";
import {distinctUntilChanged} from "rxjs/operators";
import {Subscription} from "rxjs";
import {AuthService} from "../../../../services/auth/auth.service";
import {CampaignService} from "../../../../services/user/campaign.service";
import {faAd} from "@fortawesome/free-solid-svg-icons";


@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss'],
})
export class CampaignComponent implements OnInit, OnDestroy {

  @Input() ids: string[];
  @Input() all: boolean;
  @Input() bookanapp: boolean;
  @ViewChild('submitBtn', {static: false}) submitBtn;

  mobile = mobile;
  tablet = tablet;
  formChanged = false;
  isLoading = false;
  campaignForm: FormGroup;
  submitCampaignSub$: Subscription;
  adsIcon = faAd;
  messageLength = 0;
  messagesRequired = 0;
  providerName = this.auth.getLoggedUser().value.name;
  campaignFormBookanapp: FormGroup;

  constructor(private modalService: ModalService,
              private toast: ToastService,
              private translate: LocalizationService,
              private auth: AuthService,
              private campaignService: CampaignService) { }

  ngOnInit() {
    if (!this.bookanapp) {

      this.campaignForm = new FormGroup({
        ids: new FormControl(this.ids, Validators.required),
        message: new FormControl(null, Validators.required),
        all: new FormControl(this.all),
        gdpr: new FormControl(false)
      });

      this.campaignForm.valueChanges.subscribe(
          value => {
            this.formChanged = true;
            if (value.message) {
              this.messageLength = value.message.length;
              this.messagesRequired = this.calculateMessages(this.messageLength);
            } else if (!this.campaignForm.controls.message.value) {
              this.messageLength = 0;
              this.messagesRequired = 0;
            }

          }
      );
    } else {
      this.campaignFormBookanapp = new FormGroup({
        ids: new FormControl(this.ids, Validators.required),
        message: new FormControl(null, Validators.required),
        all: new FormControl(this.all)
      });

      this.campaignFormBookanapp.valueChanges.subscribe(
          value => {
            this.formChanged = true;
          }
      );
    }
  }

  ngOnDestroy() {
    if (this.submitCampaignSub$){
      this.submitCampaignSub$.unsubscribe();
    }
    this.dismiss();
  }

  async dismiss() {
    await this.modalService.dismissCampaignModal();
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  async onSubmitForm() {
    if (this.campaignForm.valid) {
      this.isLoading = true;
      this.submitCampaignSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          async token => {
            if (token) {
              this.campaignService.sendSMSCampaign(token, this.campaignForm.value).subscribe(
                  async response => {
                    switch (response['message']) {
                      case 'noNumbers':
                        await this.toast.presentToast(this.translate.getFromKey('customer-noNumbers'), alertPosition, 'danger' , 4000);
                        break;
                      case 'bindingError':
                        await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                        break;
                      case 'insufficientMessages':
                        await this.toast.presentToast(this.translate.getFromKey('customer-insufficientMessages'), alertPosition, 'danger' , 4000);
                        break;
                      case 'sendCampaignError':
                        await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
                        break;
                      default:
                        await this.toast.presentToast(this.translate.getFromKey('customer-sms-campaignSent'), alertPosition, 'success' , 2000);
                        this.dismiss();
                    }

                    this.isLoading = false;
                  } , async error1 => {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
                  }
              )
            } else {
              this.isLoading = false;
            }
          }, async error => {
            this.isLoading = false;
            await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
          }
      );
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
      return;
    }

  }

  async onSubmitFormBookanapp() {
    if (this.campaignFormBookanapp.valid) {
      this.isLoading = true;
      this.submitCampaignSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          async token => {
            if (token) {
              this.campaignService.sendPromoCampaign(token, this.campaignFormBookanapp.value).subscribe(
                  async response => {
                    switch (response['message']) {
                      case 'noNumbers':
                        await this.toast.presentToast(this.translate.getFromKey('customer-noNumbers'), alertPosition, 'danger' , 4000);
                        break;
                      case 'bindingError':
                        await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                        break;
                      case 'sendCampaignError':
                        await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
                        break;
                      default:
                        await this.toast.presentToast(this.translate.getFromKey('customer-sms-campaignSent'), alertPosition, 'success' , 2000);
                        await this.dismiss();
                    }

                    this.isLoading = false;
                  } , async error1 => {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
                  }
              )
            } else {
              this.isLoading = false;
            }
          }, async error => {
            this.isLoading = false;
            await this.toast.presentToast(this.translate.getFromKey('customer-sendCampaignError'), alertPosition, 'danger' , 4000);
          }
      );
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
      return;
    }

  }

  calculateMessages(textCount) {
    if (textCount <= 160) {
      return 1;
    } else if (textCount <= 306) {
      return 2;
    } else {
      return 2 + Math.ceil((textCount - 306) / 153.0);
    }
  }

}
