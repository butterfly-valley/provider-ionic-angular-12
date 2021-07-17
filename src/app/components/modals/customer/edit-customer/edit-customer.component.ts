import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {alertPosition, mobile, tablet} from '../../../../app.component';
import {Subscription} from 'rxjs';
import {CountryISO} from 'ngx-intl-tel-input';
import {faAd, faUserSlash} from '@fortawesome/free-solid-svg-icons';
import {AuthService} from '../../../../services/auth/auth.service';
import {ModalService} from '../../../../services/overlay/modal.service';
import {CustomerService} from '../../../../services/user/customer.service';
import {ToastService} from '../../../../services/overlay/toast.service';
import {LocalizationService} from '../../../../services/localization/localization.service';
import {DateTimeUtilService} from '../../../../services/util/date-time-util.service';
import {DateAdapter} from '@angular/material/core';
import {IconService} from '../../../../services/util/icon.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {Customer} from '../../../../store/models/user.model';
import {CampaignComponent} from '../campaign/campaign.component';
import {ImageComponent} from "../../image/image.component";
import {EditImageComponent} from "../../edit-image/edit-image.component";
import {AlertService} from "../../../../services/overlay/alert.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-edit-customer',
  templateUrl: './edit-customer.component.html',
  styleUrls: ['./edit-customer.component.scss'],
})
export class EditCustomerComponent implements OnInit, OnDestroy {
  mobile = mobile;
  tablet = tablet;

  @Input() id: string;
  @Input() bookanapp: boolean;

  loadCustomerSub$: Subscription;
  editCustomerSub$: Subscription;
  editCustomerImage$: Subscription;
  downloadGDPRSub$: Subscription;
  loadingError;

  adsIcon = faAd;
  missedAppIcon = faUserSlash;
  deleteNoteSub$: Subscription;


  preferredCountries = [CountryISO.Portugal,
    CountryISO.Mozambique,
    CountryISO.UnitedKingdom,
    CountryISO.Spain,
    CountryISO.UnitedStates];

  @ViewChild('imagePicker', {static: false}) imagePicker: any;
  @ViewChild('GDPRPicker', {static: false}) GDPRPicker: any;
  @ViewChild('editSubmitBtn', {static: false}) editSubmitBtn;


  constructor(private auth: AuthService,
              private modalService: ModalService,
              public customerService: CustomerService,
              private toast: ToastService,
              public translate: LocalizationService,
              public timeUtil: DateTimeUtilService,
              private dateAdapter: DateAdapter<any>,
              public iconService: IconService,
              public alert: AlertService,
              private router: Router) {
    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  ngOnInit() {
    this.customerService.isLoading = true;
    this.loadCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
        token => {
          if (token) {
            this.customerService.loadCustomer(token, this.id, this.bookanapp).subscribe(
                response => {
                  if (!response['message']) {
                    const customer = response as Customer;
                    this.customerService.customer$.next(customer);
                    this.customerService.setEditForm(customer);
                  }
                  this.customerService.isLoading = false;
                }, error => {
                  this.loadingError = error;
                  this.customerService.isLoading = false;
                }
            );

          } else {
            this.customerService.isLoading = false;
          }
        });

  }

  ngOnDestroy(): void {

    if (this.loadCustomerSub$) {
      this.loadCustomerSub$.unsubscribe();
    }

    if (this.editCustomerSub$) {
      this.editCustomerSub$.unsubscribe();
    }

    if (this.editCustomerImage$) {
      this.editCustomerImage$.unsubscribe();
    }

    if (this.downloadGDPRSub$) {
      this.downloadGDPRSub$.unsubscribe();
    }
    this.dismiss();

    this.customerService.resetFields();

  }

  async dismiss() {
    await this.modalService.dismissEditCustomerModal();
  }

  submitEditForm() {
    const button: HTMLElement = this.editSubmitBtn.nativeElement;
    button.click();
  }

  async promoCampaign() {
    const ids = [];
    ids.push(this.id);

    let cssClass = '';
    if (!mobile) {
      cssClass = 'ads-campaign-modal';
    }
    await this.modalService.openCampaignModal(CampaignComponent, cssClass, ids, false, true, null);
  }


  onGDPRPicked(event: any) {
    this.customerService.onGDPRPicked(event, this.editCustomerImage$, this.auth, this.id);

  }

  async uploadGDPR() {
    await this.customerService.uploadGDPR(this.GDPRPicker);
  }

  async deleteGDPR() {
    await this.customerService.deleteGDPR(this.editCustomerImage$, this.auth, this.id);
  }

  async onSubmitForm() {
    await this.customerService.onSubmitForm(this.editCustomerSub$, this.auth);
  }

  async onImagePicked(event: any) {
    await this.customerService.onImagePicked(event, this.editCustomerImage$, this.auth, this.id, this.mobile, this.tablet, EditImageComponent);

  }

  async editPickedPic(avatar: string) {
    await this.customerService.editPickedPic(avatar, this.imagePicker, null, this.editCustomerImage$, this.auth, this.id);
  }

  async openAvatar(src: string) {
    if (src) {
      await this.modalService.openImageModal(ImageComponent, src);
    }
  }

  async ban() {
    await this.alert.presentAlert(
        this.translate.getFromKey('app-ban-btn'),
        null,
        this.translate.getFromKey('app-ban-text'),
        [
          {
            text: this.translate.getFromKey('close'),
            role: 'cancel'

          },
          {
            cssClass: 'actionsheet-delete',
            text: this.translate.getFromKey('continue'),
            handler: () => {
              this.customerService.isLoading = true;
              this.editCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                  token => {
                    if (token) {
                      this.customerService.blockUser(token, this.id).subscribe(
                          async response => {
                            this.customerService.isLoading = false;
                            switch (response['message']) {
                              case 'userBlockedError':
                                await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                                break;
                              case 'userIsNull':
                                await this.toast.presentToast(this.translate.getFromKey('app-userIsNullMessage'), alertPosition, 'danger', 4000);
                                break;
                              default:
                                await this.toast.presentToast(this.translate.getFromKey('app-userBlockedSuccess'), alertPosition, 'success', 1000);
                                this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                    this.router.navigate(['/user/management/customers']));
                                await this.dismiss();

                            }
                          }, async error1 => {
                            this.customerService.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                          }
                      );

                    } else {
                      this.customerService.isLoading = false;
                    }
                  },async error1 => {
                    this.customerService.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('app-userBlockedError'), alertPosition, 'danger', 4000);
                  }
              );
            }
          }

        ]
    );
  }

  async smsCampaign() {
    let ids = [];
    ids.push(this.id);
    await this.modalService.openCampaignModal(CampaignComponent, '', ids, false, false, undefined);
  }

  async performDelete() {
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
              this.customerService.isLoading = true;
              this.editCustomerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                  token => {
                    if (token) {
                      const idsToArchive = {
                        idsToDelete: []
                      };
                      idsToArchive.idsToDelete.push(this.id);

                      this.customerService.deleteCustomers(token, idsToArchive).subscribe(
                          async response => {
                            this.customerService.isLoading = false;
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
                                this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                                    this.router.navigate(['/user/management/customers']));
                                await this.dismiss();

                            }
                          }, async error => {
                            this.customerService.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                          }
                      );

                    } else {
                      this.customerService.isLoading = false;
                    }
                  }, async error => {
                    this.customerService.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-deleteCustomerError'), alertPosition, 'danger', 4000);
                  }
              );
            }
          }

        ]
    );
  }

  deleteNote(timestamp: string) {
    this.customerService.isLoading = true;
    this.deleteNoteSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
        async token => {
          if (token) {
            this.customerService.deleteNote(token, timestamp, this.id).subscribe(
                async response => {
                  if (response.id){
                    this.customerService.customer$.next(response);
                    this.customerService.isLoading = false;
                  } else {
                    this.customerService.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
                  }
                }, async error => {
                  this.customerService.isLoading = false;
                  await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
                }
            )
          } else {
            this.customerService.isLoading = false;
            await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
          }
        }, async error => {
          this.customerService.isLoading = false;
          await this.toast.presentToast(this.translate.getFromKey('timeline-delete-error'), alertPosition, 'danger', 4000);
        }

    );
  }


}
