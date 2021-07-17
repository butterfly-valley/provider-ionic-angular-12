import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {LocalizationService} from '../../../../services/localization/localization.service';
import {alertPosition, dateClass, mobile, tablet} from '../../../../app.component';
import {DateAdapter} from '@angular/material/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ModalService} from '../../../../services/overlay/modal.service';
import {ScheduleService} from '../../../../services/user/schedule.service';
import {AuthService} from '../../../../services/auth/auth.service';
import {EmployeeService} from '../../../../services/user/employee.service';
import {Employee, OpsHours, RosterPattern, RosterSlotColor} from '../../../../store/models/provider.model';
import {ToastService} from '../../../../services/overlay/toast.service';
import {AlertService} from '../../../../services/overlay/alert.service';
import {MatStepper} from '@angular/material/stepper';
import {DateTimeUtilService} from '../../../../services/util/date-time-util.service';
import {Router} from '@angular/router';
import {RosterService} from '../../../../services/user/roster.service';
import {FullcalendarService} from '../../../../services/user/fullcalendar.service';

@Component({
  selector: 'app-employee-schedule',
  templateUrl: './employee-schedule.component.html',
  styleUrls: ['./employee-schedule.component.scss'],
})
export class EmployeeScheduleComponent implements OnInit, OnDestroy {
  @Input() employee: Employee;
  @Input() subdivision: boolean;
  @Input() division: boolean;
  mobile = mobile;
  tablet = tablet;
  scheduleForm: FormGroup;
  patternForm: FormGroup;
  publishOrDeleteForm: FormGroup;

  formSubmitted = false;
  opsHoursSub$: Subscription;
  isLoading = false;

  /*  get access to button to be submitted programmatically*/
  @ViewChild('submitBtn', {static: false}) submitBtn;
  @Input() color = '#098C09';
  days = true;
  pattern = false;
  @ViewChild('stepper', {static: false}) stepper: MatStepper;
  customPattern: string;
  setCustomColor = false;
  setCustomPattern = false;
  allSlotColor$ = new BehaviorSubject<RosterSlotColor[]>(null);
  allSlotPatterns$ = new BehaviorSubject<RosterPattern[]>(null);
  addRoster = !this.division;
  publishRoster = this.division;
  deleteRoster = false;
  opsHours$ = new BehaviorSubject<OpsHours[]>([]);
  opsHoursFetched = false;


  constructor(public translate: LocalizationService,
              private dateAdapter: DateAdapter<any>,
              private modalService: ModalService,
              private scheduleService: ScheduleService,
              private auth: AuthService,
              private employeeService: EmployeeService,
              private toast: ToastService,
              private alert: AlertService,
              private dateTimeUtil: DateTimeUtilService,
              private fullcalendarService: FullcalendarService) {
    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  ngOnInit() {
    this.addRoster = !this.division;
    this.publishRoster = this.division;
    this.scheduleForm = new FormGroup({
      employeeId: new FormControl(this.employee.id, !this.subdivision ? Validators.required : []),
      subdivisionId: new FormControl(this.employee.subdivisionId, this.subdivision ? Validators.required : []),
      note: new FormControl(null),
      schedule: new FormGroup({
        startDate: new FormControl(new Date(), [Validators.required]),
        endDate: new FormControl(null, [Validators.required]),
        days: new FormGroup({
          day: new FormArray([], Validators.required)
        },  Validators.required)
      }),
      colorName: new FormControl(null)
    });

    this.patternForm = new FormGroup({
      employeeId: new FormControl(this.employee.id, !this.subdivision ? Validators.required : []),
      subdivisionId: new FormControl(this.employee.subdivisionId, this.subdivision ? Validators.required : []),
      note: new FormControl(null),
      schedule: new FormGroup({
        startDate: new FormControl(new Date(), [Validators.required]),
        endDate: new FormControl(null, [Validators.required]),
        days: new FormGroup({
          day: new FormArray([])
        }),
      }),
      pattern: new FormControl(null, Validators.required),
      patternStart: new FormControl(null, Validators.required),
      patternEnd: new FormControl(null, Validators.required),
      patternName: new FormControl(null),
      colorName: new FormControl(null),
    });

    this.publishOrDeleteForm = new FormGroup({
      employeeId: new FormControl(null),
      subdivisionId: new FormControl(null),
      divisionId: new FormControl(null),
      startDate: new FormControl(new Date(), [Validators.required]),
      endDate: new FormControl(null, [Validators.required]),
    });

    this.opsHoursSub$ = this.auth.getCurrentToken().subscribe(
        token => {
          if (token) {
            this.scheduleService.getOpsHoursAndSchedules(token).subscribe(
                response => {
                  if (response) {
                    if (response.opsHours && response.opsHours.length > 0) {
                      this.opsHours$.next(response.opsHours);
                      this.opsHoursFetched = true;
                    }
                  }
                }
            );

            this.employeeService.loadAllSlotColors(token).subscribe(
                response => {
                  if (response) {
                    this.allSlotPatterns$.next(response[0] as RosterPattern[]);
                    this.allSlotColor$.next(response[1] as RosterSlotColor[]);
                  }
                }
            );
          }
        });

  }

  ngOnDestroy() {
    if (this.opsHoursSub$) {
      this.opsHoursSub$.unsubscribe();
    }
  }

  async dismiss() {
    await this.modalService.dismissEmployeeScheduleModal();
  }


  async onSubmitForm() {
    this.formSubmitted = true;
    if (this.days && !this.scheduleForm.valid) {
      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [   {
        text: this.translate.getFromKey('close'),
        role: 'cancel'
      }]);
      return;
    }

    if (this.pattern && !this.patternForm.valid) {
      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [   {
        text: this.translate.getFromKey('close'),
        role: 'cancel'
      }]);
      return;
    }
    this.isLoading = true;

    this.opsHoursSub$ = this.auth.getCurrentToken().subscribe(
        token => {
          if (token) {
            let form = this.scheduleForm.value;

            if (this.pattern) {
              form = this.patternForm.value;
              if (this.customPattern) {
                form.pattern = this.customPattern;
              }
            }

            form.color = this.color;

            this.employeeService.uploadRoster(token, form, this.subdivision).subscribe(
                async response => {
                  this.isLoading = false;
                  switch (response.message) {
                    case 'invalidHour':
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-choose-hours-error'), [   {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'
                      }]);
                      break;
                    case 'uploadRosterError':
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-upload-error'), [   {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'
                      }]);
                      break;
                    case 'invalidEmployee':
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('emp-invalid'), [   {
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
                    default:
                      this.isLoading = true;
                      await this.toast.presentToast(this.translate.getFromKey('roster-upload-success'), alertPosition, 'success' , 2000);
                      await this.refresh();
                  }


                }, async error => {
                  this.isLoading = false;
                  await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-upload-error'), [   {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'
                  }]);
                }
            );
          }});

  }

  dateClass() {
    return dateClass();
  }


  submitForm() {
    this.submitBtn.nativeElement.click();
  }

  segmentChanged(event: CustomEvent) {
    this.days = event.detail.value === 'days';
    this.pattern = event.detail.value === 'pattern';

    if (!this.days) {
      this.scheduleForm.reset();
    }

  }

  patternChange(event: CustomEvent) {
    if (event.detail.value === 'other') {
      this.customPattern = '1/1';
    } else {
      this.customPattern = undefined;
    }
  }

  nextStep() {
    this.stepper.next();
  }

  prevStep() {
    this.stepper.previous();
  }

  customPatternSetter(event: number, onOff: number) {

    const splitPattern = this.customPattern.split('/');

    if (onOff === 1) {
      this.customPattern = event + '/' + splitPattern[1];
    } else {
      this.customPattern = splitPattern[0] + '/' + event;

    }


  }

  setColor(event: CustomEvent) {
    const color = event.detail.value;
    this.setCustomColor = color === 'other';
    if (color !== 'other') {
      this.color = color;
    }
  }

  setPattern(event: CustomEvent) {
    const pattern = event.detail.value;

    this.setCustomPattern = pattern === 'other';

    if (pattern !== 'other') {
      let currentPatterns = this.allSlotPatterns$.value;
      currentPatterns = currentPatterns.filter(pat => pat.name === pattern);
      const currentPattern = currentPatterns[0];
      this.patternForm.controls.patternName.setValue(currentPattern.name);
      this.patternForm.controls.patternStart.setValue(this.assembleDateTimeForExistingPattern(currentPattern.start));
      this.patternForm.controls.patternEnd.setValue(this.assembleDateTimeForExistingPattern(currentPattern.end));
      this.patternForm.controls.pattern.setValue(currentPattern.pattern);
    } else {
      this.setCustomPattern = true;
      this.patternForm.controls.patternName.setValue(null);
      this.patternForm.controls.patternStart.setValue(null);
      this.patternForm.controls.patternEnd.setValue(null);
      this.patternForm.controls.pattern.setValue(null);
    }
  }

  /**
   * Separates LocalTime into hours and minutes
   * @param time from persisted patterns as Java LocalTime
   */
  private assembleDateTimeForExistingPattern(time: string) {

    const parsedTime = time.split(':');
    return   {
      hour: +parsedTime[0],
      minute: +parsedTime[1]
    };

  }
  showPatternTime(patternTime: string) {
    return this.dateTimeUtil.showLocalTime(this.translate.getLocale(), '2099-01-01T' + patternTime);
  }

  mainSegmentChanged(event: CustomEvent) {
    this.addRoster = event.detail.value === 'add';
    this.publishRoster = event.detail.value === 'publish';
    this.deleteRoster = event.detail.value === 'delete';
  }

  async onSubmitPublishOrDeleteForm(deleteRoster: boolean) {
    this.formSubmitted = true;
    if (this.publishOrDeleteForm.valid) {
      this.isLoading = true;

      this.opsHoursSub$ = this.auth.getCurrentToken().subscribe(
          token => {
            if (token) {
              const form = this.publishOrDeleteForm.value;

              if (this.division) {
                form.divisionId = this.employee.divisionId;
              }

              if (this.subdivision) {
                form.subdivisionId = this.employee.subdivisionId;
              }

              if (!this.subdivision && !this.division) {
                form.employeeId = this.employee.id;
              }

              form.delete = deleteRoster;
              form.startDate = this.dateTimeUtil.getDate(form.startDate);
              form.endDate = this.dateTimeUtil.getDate(form.endDate);



              this.employeeService.publishOrDeleteRoster(token, form).subscribe(
                  async response => {
                    this.isLoading = false;
                    switch (response.message) {
                      case 'error':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-upload-error'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'
                        }]);
                        break;
                      default:
                        this.isLoading = true;
                        await this.toast.presentSnackbar(this.translate.getFromKey('roster-update-success'), 2000, true);
                        await this.refresh();
                    }


                  }, async error => {
                    this.isLoading = false;
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-upload-error'), [   {
                      text: this.translate.getFromKey('close'),
                      role: 'cancel'
                    }]);
                  }
              );
            }});

    } else {
      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('reg-errors'), [   {
        text: this.translate.getFromKey('close'),
        role: 'cancel'
      }]);
      return;
    }

  }

  private async refresh() {
    this.employeeService.renderRosters = false;
    this.fullcalendarService.rosters$.next([]);
    setTimeout(async () => {
      this.employeeService.renderRosters = true;
      await this.dismiss();
    }, 300);

  }

}
