import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {alertPosition, BASE_URL} from "../../app.component";
import {distinctUntilChanged} from "rxjs/operators";
import {AlertService} from "../overlay/alert.service";
import {LocalizationService} from "../localization/localization.service";
import {AuthService} from "../auth/auth.service";
import {ToastService} from "../overlay/toast.service";
import {faBirthdayCake, faCalendarCheck, faSms} from "@fortawesome/free-solid-svg-icons";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {Customer} from "../../store/models/user.model";
import {BehaviorSubject} from "rxjs";
import {ActionSheetController} from "@ionic/angular";
import {ModalService} from "../overlay/modal.service";
import {LoadingService} from '../loading/loading.service';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  customer$ = new BehaviorSubject<Customer>(null);
  BASE_URL = 'http://localhost:8086/provider/customer';


  birthdayIcon = faBirthdayCake;
  appointmentIcon = faCalendarCheck;
  smsIcon = faSms;

  editName: boolean;
  editPhone: boolean;
  editEmail: boolean;
  editDob: boolean;
  editSub: boolean;
  editNote: boolean;
  editGDPR: boolean;

  editForm: FormGroup;
  formChanged = false;
  isLoading = false;
  imageSrc: string | ArrayBuffer;

  constructor(private http: HttpClient,
              private alert: AlertService,
              private translate: LocalizationService,
              private toast: ToastService,
              private actionSheetController: ActionSheetController,
              private modalService: ModalService,
              private loadingService: LoadingService,
              private auth: AuthService) { }
  // BASE_URL = BASE_URL + '/rest/customers';
  AUTH_HEADER = 'Bearer ';

  getOwnCustomers(token, page, customersPerPage, own: boolean) {
    let url = '/show';
    if (!own) {
      url = '/show/bookanapp';
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('page', String(page));
    params = params.append('customersPerPage', String(customersPerPage));
    return this.http.get(this.BASE_URL + url, { headers: tokenHeaders, params: params});
  }

  searchOwnCustomers(token, term, own: boolean) {
    let url = '/search';
    if (!own) {
      url = '/search/bookanapp';
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    params = params.append('term', String(term));
    return this.http.get(this.BASE_URL + url, { headers: tokenHeaders, params: params});
  }

  loadCustomer(token, id, bookanapp) {
    let url = '/show/';
    if (bookanapp) {
      url = '/show/bookanapp/';
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get(this.BASE_URL + url + id, { headers: tokenHeaders});
  }

  uploadAvatar(token: string, file: any, customerId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', file, file.name);
    return this.http.post(this.BASE_URL + '/upload/image/' + customerId, formData,{ headers: tokenHeaders});
  }

  deleteAvatarRequest(token: string, customerId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get(this.BASE_URL + '/delete/image/' + customerId, { headers: tokenHeaders});
  }

  createCustomer(token: string, form: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/create', form, { headers: tokenHeaders});
  }
  editCustomer(token: string, editForm: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/edit', editForm, { headers: tokenHeaders});
  }


  /*get all appointments*/
  getAllAppointments(token: string, page: number, history: boolean, itemsPerPage, customerId, bookanapp) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params = new HttpParams();
    let url = '/show/appointments';
    if (history) {
      url = '/show/appointments/history';
    }
    if (bookanapp) {
      url = url + '/bookanapp';
    }
    params = params.append('appointmentPage', String(page));
    params = params.append('customerId', String(customerId));

    if (itemsPerPage) {
      params = params.append('itemsPerPage', itemsPerPage);
    }
    return this.http.get<any>(this.BASE_URL + url, { headers: tokenHeaders, params: params});
  }

  getAllAppointmentsBadge(token, customerId, bookanapp: boolean) {
    let url = '/show/appointments/total/';
    if (bookanapp) {
      url = '/show/appointments/total/bookanapp/';
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + url + customerId, { headers: tokenHeaders});
  }


  deleteCustomers(token: string, ids) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/delete', ids, { headers: tokenHeaders});
  }


  downloadGDPR(token: string, id: any, ads: boolean) {
    let params = new HttpParams();
    if(ads) {
      params = params.append('ads', 'true');
    }
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<Blob>(this.BASE_URL + '/print/gdpr', id, { headers: tokenHeaders, params: params, responseType :
          'blob' as 'json'});
  }


  blockUser(token: string, id: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/block/' + id, { headers: tokenHeaders});
  }

  registerUser(token: string, id: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post<any>(this.BASE_URL + '/register/user', {customerId: id}, { headers: tokenHeaders});
  }

  uploadGDPRRequest(token: string, file: any, id: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', file, file.name);
    return this.http.post(this.BASE_URL + '/upload/gdpr/' + id, formData,{ headers: tokenHeaders});
  }

  deleteGDPRRequest(token: string, id: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/delete/gdpr/' + id, { headers: tokenHeaders});
  }


  editField(field: string) {
    if (field === 'name') {
      this.editName = true;
    }

    if (field === 'phone') {
      this.editPhone = true;
      this.editForm.controls.deletePhone.setValue(false);
    }

    if (field === 'email') {
      this.editEmail = true;
    }

    if (field === 'dob') {
      this.editDob = true;
    }

    if (field === 'sub') {
      this.editSub = true;
    }

    if (field === 'note') {
      this.editNote = true;
    }

    if (field === 'GDPR') {
      this.editGDPR = true;
    }
  }


  async onSubmitForm(editCustomerSub$, auth: AuthService) {
    if (this.editForm.valid) {
      this.isLoading = true;
      editCustomerSub$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          async token => {
            if (token) {

              if (this.editForm.value.dob) {
                const date: Date = new Date(this.editForm.value.dob);
                const today = new Date();

                this.editForm.value.dob = new Date(date.getTime() - today.getTimezoneOffset() * 60000).toISOString();
              }

              this.editCustomer(token, this.editForm.value).subscribe(
                  async response => {
                    if (response['id']) {
                      const customer = response as Customer
                      this.customer$.next(customer);
                      this.setEditForm(customer);
                      this.resetFields();
                    } else {
                      if (response['message']) {
                        switch (response['message']) {
                          case 'invalidCustomer':
                            await this.toast.presentToast(this.translate.getFromKey('customer-invalidCustomer'), alertPosition, 'danger' , 4000);
                            break;
                          case 'bindingError':
                            await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 4000);
                            break;
                          case 'existingCustomer':
                            this.editForm.controls['internationalPhone'].reset();
                            await this.toast.presentToast(this.translate.getFromKey('customer-existingCustomer'), alertPosition, 'danger' , 4000);
                            break;
                          default:
                            await this.toast.presentToast(this.translate.getFromKey('customer-updateCustomerError'), alertPosition, 'danger' , 4000);
                            break;
                        }
                      }
                    }
                    this.isLoading = false;
                  } , async error1 => {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-updateCustomerError'), alertPosition, 'danger' , 4000);
                  }
              )
            } else {
              this.isLoading = false;
            }
          }, async error => {
            this.isLoading = false;
            await this.toast.presentToast(this.translate.getFromKey('customer-updateCustomerError'), alertPosition, 'danger' , 4000);
          }
      );
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger' , 4000);
      return;
    }
  }

  resetFields() {
    this.editName = false;
    this.editPhone = false;
    this.editEmail = false;
    this.editDob = false;
    this.editNote = false;
    this.editGDPR = false;
    this.editSub = false;
    this.formChanged = false;
  }

  deletePhone() {
    const currentCustomer = this.customer$.value;
    currentCustomer.phone = undefined;
    this.editForm.controls.deletePhone.setValue(true);
  }

  async onImagePicked(event: any, editCustomerImage$, auth: AuthService, id, mobile, tablet, imageComponent) {
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
      await this.modalService.openEditImageModal(imageComponent, reader.result, cssClass, undefined, undefined, false, undefined, false,
          id);
    };

  }

  async editPickedPic(avatar: string, imagePicker, event: any, editCustomerImage$, auth: AuthService, id) {
    if (!this.imageSrc && !avatar) {
      imagePicker.nativeElement.click();
    } else {
      const actionSheet = await this.actionSheetController.create({
        buttons: [
          {
            text: this.translate.getFromKey('upload'),
            icon: 'camera',
            handler: () => {
              imagePicker.nativeElement.click();
            }
          },
          {
            text: this.translate.getFromKey('delete'),
            icon: 'trash',
            cssClass: 'actionsheet-delete',
            handler: () => {
              this.deleteAvatar(event, editCustomerImage$, auth, id);
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

  async deleteAvatar(event: any, editCustomerImage$, auth: AuthService, id) {
    this.isLoading = true;
    editCustomerImage$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
        async token => {
          this.isLoading = false;
          if (token) {
            this.deleteAvatarRequest(token, id).subscribe(
                async response => {
                  this.isLoading = false;
                  if (response['message'] === 'avatarDeleteSuccess') {
                    const currentCustomer = this.customer$.value;
                    currentCustomer.avatar = undefined;
                    this.customer$.next(currentCustomer);
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



  async uploadGDPR(GDPRPicker) {
    await this.alert.presentAlert(
        this.translate.getFromKey('customer-gdpr'),
        null,
        null,
        [
          {
            text: this.translate.getFromKey('close'),
            role: 'cancel'

          },
          {
            cssClass: 'actionsheet-submit',
            text: this.translate.getFromKey('upload'),
            handler: () => {
              GDPRPicker.nativeElement.click();
            }
          }

        ]
    );

  }

  onGDPRPicked(event: any, editCustomerImage$, auth: AuthService, id) {
    this.isLoading = true;
    const file = event.target.files[0];
    editCustomerImage$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
        async token => {
          if (token) {
            this.uploadGDPRRequest(token, file, id).subscribe(
                async response => {
                  if (response['link']) {
                    const currentCustomer = this.customer$.value;
                    currentCustomer.docPhoto = response['link'];
                    this.customer$.next(currentCustomer);
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('customer-gdpr-success'), alertPosition, 'success', 2000);
                  } else {
                    if (response['error']) {
                      this.isLoading = false;
                      switch (response['error']) {
                        case 'invalidFile':
                          await this.toast.presentToast(this.translate.getFromKey('mess-attach-invalid'), alertPosition, 'danger', 6000);
                          break;
                        case 'imageUploadError':
                          await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
                          break;
                      }
                    }

                  }
                  this.isLoading = false;
                }, async error => {
                  this.isLoading = false;
                  await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);

                }
            );
          } else {
            this.isLoading = false;
            await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);

          }
        }, async error => {
          this.isLoading = false;
          await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
        }
    );


  }

  async deleteGDPR(editCustomerImage$, auth: AuthService, id) {
    await this.alert.presentAlert(
        this.translate.getFromKey('customer-gdpr'),
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
              editCustomerImage$ = auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
                  async token => {
                    if (token) {
                      this.deleteGDPRRequest(token, id).subscribe(
                          async response => {
                            switch (response['message']) {
                              case 'invalidFile':
                                await this.toast.presentToast(this.translate.getFromKey('mess-attach-invalid'), alertPosition, 'danger', 6000);
                                break;
                              case 'imageUploadError':
                                await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
                                break;
                              default:
                                const currentCustomer = this.customer$.value;
                                currentCustomer.docPhoto = undefined;
                                this.customer$.next(currentCustomer);
                                await this.toast.presentToast(this.translate.getFromKey('customer-gdpr-delete-success'), alertPosition, 'success', 2000);
                            }
                            this.isLoading = false;
                          }, async error => {
                            this.isLoading = false;
                            await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);

                          }
                      );
                    } else {
                      this.isLoading = false;
                      await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);

                    }
                  }, async error => {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
                  }
              );
            }
          }

        ]
    );

  }


  setEditForm(customer: Customer) {
    this.editForm = new FormGroup({
          userId: new FormControl(customer.id, [Validators.required]),
          name: new FormControl(customer.name, [Validators.minLength(3), Validators.maxLength(50), Validators.required]),
          remark: new FormControl(null, [Validators.minLength(3), Validators.maxLength(255)]),
          sendSms: new FormControl(customer.sendSms),
          dob: new FormControl(null),
          subEnd: new FormControl(null),
          email: new FormControl(customer.email, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
          internationalPhone: new FormControl(null),
          deletePhone: new FormControl(false),
        }
    );

    this.editForm.valueChanges.subscribe(
        value => {
          this.formChanged = true;
        }
    );
  }

  deleteNote(token: string, timestamp: string, customerId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.get<any>(this.BASE_URL + '/delete/note?customerId=' + customerId + '&timestamp=' + timestamp, { headers: tokenHeaders});
  }

  async registerBookanAppUser(id: string) {
    const currentCustomer = this.customer$.value;
    if (currentCustomer.email) {
      const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));

      if (loading) {
        await loading.present();
      }

      this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          async token => {
            if (token) {
              this.registerUser(token, id).subscribe(
                  async response => {
                    if (response) {
                      await this.loadingService.dismissLoading();
                      if (response.message) {
                        switch (response.message) {
                          case 'No email':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-no-email'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;
                          case 'Invalid customer':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('customer-invalidCustomer'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;
                          case 'regUserError':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;
                          case 'bindingError':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;
                          case 'alreadyRegistered':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-alreadyRegistered'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;
                          case 'Email error':
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [{
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'

                            }]);
                            break;

                        }
                      } else {
                        this.customer$.next(response);
                        await this.alert.presentAlert(undefined, undefined, this.translate.getFromKey('register-user-success'), [{
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'

                        }]);

                      }
                    } else {
                      await this.loadingService.dismissLoading();
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [   {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'

                      }]);
                    }

                  }, async error => {
                    await this.loadingService.dismissLoading();
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [   {
                      text: this.translate.getFromKey('close'),
                      role: 'cancel'

                    }]);
                  }
              );
            } else {
              await this.loadingService.dismissLoading();
              await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'

              }]);
            }
          }, async error => {
            await this.loadingService.dismissLoading();
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-error'), [   {
              text: this.translate.getFromKey('close'),
              role: 'cancel'

            }]);
          }

      );


    } else {
      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('register-user-no-email'), [   {
        text: this.translate.getFromKey('close'),
        role: 'cancel'

      }]);
    }
  }
}
