import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Employee, TimeRequest} from '../../../../store/models/provider.model';
import {ModalService} from '../../../../services/overlay/modal.service';
import {mobile, tablet} from '../../../../app.component';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {DateTimeUtilService} from '../../../../services/util/date-time-util.service';
import {LocalizationService} from '../../../../services/localization/localization.service';
import {AlertService} from '../../../../services/overlay/alert.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AuthService} from '../../../../services/auth/auth.service';
import {EmployeeProfileService} from '../../../../services/user/employee-profile.service';
import {ToastService} from '../../../../services/overlay/toast.service';

@Component({
  selector: 'app-timeoff-request',
  templateUrl: './timeoff-request.component.html',
  styleUrls: ['./timeoff-request.component.scss'],
})
export class TimeoffRequestComponent implements OnInit, OnDestroy {
  mobile = mobile;
  tablet = tablet;

  @Input() employee: Employee;
  @Input() date: Date;
  @ViewChild('submitBtn', {static: false}) submitBtn;
  @ViewChild('filePicker', {static: false}) filePicker: any;

  timeOffRequestForm: FormGroup;
  absenceForm: FormGroup;
  isLoading = false;

  timeOff = true;
  absence = false;
  overtime = false;

  formSubmitted: boolean;
  submitSub$: Subscription;
  halfDay: boolean;
  pickedFiles: File[] = [];

  constructor(private modalService: ModalService,
              public dateTimeUtil: DateTimeUtilService,
              public translate: LocalizationService,
              private alert: AlertService,
              private auth: AuthService,
              private employeeService: EmployeeProfileService,
              private toast: ToastService) { }

  ngOnInit() {

    const date = this.date.getFullYear() + '-' + this.dateTimeUtil.addZero(this.date.getMonth() + 1) + '-' + this.dateTimeUtil.addZero(this.date.getDate());

    this.timeOffRequestForm = new FormGroup({
      initialDate: new FormControl(date, Validators.required),
      numberOfDays: new FormControl(1, Validators.required),
      balanceType: new FormControl(null, Validators.required)
    });


    this.absenceForm = new FormGroup({
      date: new FormControl(date, Validators.required),
      start: new FormControl(null, Validators.required),
      end: new FormControl(null, Validators.required),
      comments: new FormControl(null),

    });
  }

  ngOnDestroy() {
    this.dismiss();
  }

  async dismiss() {
    if (this.submitSub$) {
      this.submitSub$.unsubscribe();
    }
    await this.modalService.dismissTimeOffRequestModal();
  }

  async onSubmit() {
    this.formSubmitted = true;
    if (this.timeOffRequestForm.valid) {
      this.isLoading = true;
      this.submitSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {
              this.employeeService.submitTimeOffRequest(token, this.timeOffRequestForm.value).subscribe(
                  async response => {
                    this.isLoading = false;
                    if (response.message) {
                      switch (response.message) {
                        case 'bindingError':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [{
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                          break;
                        case 'invalidEmployee':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('emp-invalid'), [{
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                          break;
                        case 'noDecimalsAllowed':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('no-decimals'), [{
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                          break;
                        case 'insufficientBalance':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('insufficient-timeoff-balance'), [{
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
                    } else {
                      if (response.id) {
                        await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                        this.employeeService.timeOffCalendar$.value.getApi().refetchEvents();
                        this.employeeService.employee$.next(response);
                        await this.dismiss();
                      }
                    }
                  } , async error =>  {
                    this.isLoading = false;
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                      text: this.translate.getFromKey('close'),
                      role: 'cancel'
                    }]);
                  }
              );
            } else {
              this.isLoading = false;
              await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
              }]);
            }
          }, async error => {
            this.isLoading = false;
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
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

  async onSubmitTimeRequest() {
    this.formSubmitted = true;
    if (this.absenceForm.valid) {
      this.isLoading = true;
      this.submitSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {

              const form = this.absenceForm.value;
              form.overtime = this.overtime;

              this.employeeService.submitTimeRequest(token, this.absenceForm.value).subscribe(
                  async response => {
                    this.isLoading = false;
                    if (response.message) {
                      switch (response.message) {
                        case 'bindingError':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [{
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                          break;
                        case 'invalidEmployee':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('emp-invalid'), [{
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
                    } else {
                      if (response.id) {


                        const currentRequests = this.employeeService.timeRequests$.value;
                        const newRequest = response as TimeRequest;
                        newRequest.attachments = [];

                        if (this.pickedFiles.length > 0) {
                          const filesUploaded$ = new BehaviorSubject<number>(0);

                          // tslint:disable-next-line:prefer-for-of
                          for (let i = 0; i < this.pickedFiles.length; i++) {

                            const file = this.pickedFiles[i];

                            this.isLoading = true;
                            this.employeeService.uploadTimeRequestAttachment(token, file, response.id).subscribe(
                                async serverResponse => {

                                  this.isLoading = false;
                                  filesUploaded$.next(i + 1);

                                  // push new attachment
                                  if (serverResponse.link) {
                                    if (serverResponse.link.includes('https://bookanapp-employee-time-request-attachment.s3.eu-west-3.amazonaws.com/')) {
                                      const splitLink = serverResponse.link.split('https://bookanapp-employee-time-request-attachment.s3.eu-west-3.amazonaws.com/')[1];
                                      newRequest.attachments.push(splitLink);
                                    }
                                  }

                                  switch (serverResponse.message) {
                                    case 'invalidFile':
                                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-invalid'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                      }]);
                                      break;
                                    case 'invalidRequest':
                                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-error'), [   {
                                        text: this.translate.getFromKey('close'),
                                        role: 'cancel'
                                      }]);
                                      break;

                                  }
                                }, async error => {
                                  await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('mess-attach-error'), [   {
                                    text: this.translate.getFromKey('close'),
                                    role: 'cancel'
                                  }]);
                                  this.isLoading = false;
                                  filesUploaded$.next(i + 1);
                                }

                            );
                          }

                          // close modal when all attachments are saved
                          filesUploaded$.subscribe(
                              async value => {
                                if (value === this.pickedFiles.length) {
                                  currentRequests.push(newRequest);
                                  this.employeeService.timeRequests$.next(currentRequests);
                                  await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                                  await this.dismiss();
                                }
                              }
                          );



                        } else {
                          currentRequests.push(newRequest);
                          this.employeeService.timeRequests$.next(currentRequests);
                          await this.toast.presentSnackbar(this.translate.getFromKey('success'), 2000, true);
                          await this.dismiss();

                        }

                      }
                    }
                  } , async error =>  {
                    this.isLoading = false;
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
                      text: this.translate.getFromKey('close'),
                      role: 'cancel'
                    }]);
                  }
              );
            } else {
              this.isLoading = false;
              await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
              }]);
            }
          }, async error => {
            this.isLoading = false;
            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
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

  updateTimeOffInput(event: number) {
    this.timeOffRequestForm.controls.numberOfDays.setValue(event);
  }

  timeOffBalanceSource($event: CustomEvent) {

  }

  segmentChanged(event: CustomEvent) {
    this.timeOff = event.detail.value === 'timeOff';
    this.absence = event.detail.value === 'absence';
    this.overtime = event.detail.value === 'overtime';
  }

  checkHalfDay(event: CustomEvent) {
    this.halfDay = event.detail.checked;
    this.timeOffRequestForm.controls.numberOfDays.setValue(0.5);

  }

  openFilePicker() {
    this.filePicker.nativeElement.click();

  }

  onFilePicked(event: any) {
    this.pickedFiles.push(event.target.files[0]);
  }


  removeAttachment(name: string) {
    this.pickedFiles = this.pickedFiles.filter(file => file.name !== name);
  }
}
