import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AlertService} from '../../../services/overlay/alert.service';
import {EmployeeService} from '../../../services/user/employee.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {Subscription} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {AuthService} from '../../../services/auth/auth.service';
import {ToastService} from '../../../services/overlay/toast.service';

@Component({
  selector: 'app-edit-subdivision',
  templateUrl: './edit-subdivision.component.html',
  styleUrls: ['./edit-subdivision.component.scss'],
})
export class EditSubdivisionComponent implements OnInit {

  @Input() divisionId;
  @Input() subdivisionId;
  @Input() divisionName;
  @Input() subdivisionName;


  submitSub$: Subscription;
  mobile = mobile;
  tablet = tablet;
  isLoading = false;
  editDivisionForm: FormGroup;
  formSubmitted = false;
  @ViewChild('submitBtn', {static: false}) submitBtn;


  constructor(private modalService: ModalService,
              private alert: AlertService,
              private employeeService: EmployeeService,
              private translate: LocalizationService,
              private auth: AuthService,
              private toast: ToastService) { }

  ngOnInit() {

    this.editDivisionForm = new FormGroup({
      subdivisionName: new FormControl(this.subdivisionName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
      divisionName: new FormControl(this.divisionName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
      divisionId: new FormControl(this.divisionId, [Validators.required]),
      subdivisionId: new FormControl(this.subdivisionId, [Validators.required]),
    });
  }

  async dismiss() {
    await this.modalService.dismissEditSubdivisionModal();
  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }


  async onSubmit() {
    this.formSubmitted = true;
    if (this.editDivisionForm.valid) {
      this.isLoading = true;
      this.submitSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          async token => {
            if (token) {
              this.employeeService.uploadDivision(token, this.editDivisionForm.value).subscribe(
                  async response => {
                    if (response.message) {
                      this.isLoading = false;
                      switch (response.message) {
                        case 'success':
                          this.isLoading = true;
                          await this.toast.presentToast(this.translate.getFromKey('success'), alertPosition, 'success' , 2000);
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                          break;
                        case 'bindingError':
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                          break;
                        case 'invalid-division':
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
                    } else {
                      this.isLoading = false;
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('prof-editError'), [   {
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
              )

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
      return;
    }

  }
}
