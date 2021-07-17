import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {alertPosition, mobile, tablet} from '../../../../app.component';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ModalService} from '../../../../services/overlay/modal.service';
import {LocalizationService} from '../../../../services/localization/localization.service';
import {DateTimeUtilService} from '../../../../services/util/date-time-util.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AuthService} from '../../../../services/auth/auth.service';
import {FullcalendarService} from '../../../../services/user/fullcalendar.service';
import {AlertService} from '../../../../services/overlay/alert.service';
import {ToastService} from '../../../../services/overlay/toast.service';
import {RosterSlotColor, SlotDetails} from '../../../../store/models/provider.model';
import {EmployeeService} from '../../../../services/user/employee.service';


@Component({
  selector: 'app-edit-roster-slot',
  templateUrl: './edit-roster-slot.component.html',
  styleUrls: ['./edit-roster-slot.component.scss'],
})
export class EditRosterSlotComponent implements OnInit, OnDestroy {
  @Input() slots: any[];
  mobile = mobile;
  tablet = tablet;
  slotForm: FormGroup;
  isLoading = false;
  formSubmitted = false;
  @ViewChild('submitBtn', {static: false}) submitBtn;
  modifySlotSub$: Subscription;
  fetchSlotColors$: Subscription;
  color: string;
  setCustomColor = false;
  allSlotColor$ = new BehaviorSubject<RosterSlotColor[]>(null);

  constructor(private modalService: ModalService,
              public translate: LocalizationService,
              private dateTimeUtil: DateTimeUtilService,
              private auth: AuthService,
              private fullcalendarService: FullcalendarService,
              private alert: AlertService,
              private toast: ToastService,
              private employeeService: EmployeeService) { }

  ngOnInit() {
    const slot = this.slots[0].event;

    const startTime = this.dateTimeUtil.extractLocalDateTime(slot.start).split('T')[1];
    const endTime =  this.dateTimeUtil.extractLocalDateTime(slot.end).split('T')[1];

    this.color = slot.extendedProps.slotColor;

    const slotDetails: SlotDetails[] = [];

    this.slots.forEach(
        rosterSlot => {
          slotDetails.push({
            slotId: rosterSlot.event.extendedProps.slotId,
            subdivisionId: rosterSlot.event.extendedProps.subdivisionId,
            employeeId: rosterSlot.event.extendedProps.employeeId
          });
        }
    );

    // const startTime = this.dateTimeUtil.addZeroToHour(hour.split('-')[0]);
    const start = {
      hour: +startTime.split(':')[0],
      minute: +startTime.split(':')[1]
    };

    // const endTime = this.dateTimeUtil.addZeroToHour(hour.split('-')[1]);
    const end = {
      hour: +endTime.split(':')[0],
      minute: +endTime.split(':')[1]
    };

    this.slotForm = new FormGroup({
      slotDetails: new FormControl(slotDetails, Validators.required),
      start: new FormControl(start),
      end: new FormControl(end),
      note: new FormControl(slot.extendedProps.note)
    });

    this.fetchSlotColors$ = this.auth.getCurrentToken().subscribe(
        token => {
          if (token) {
            this.employeeService.loadAllSlotColors(token).subscribe(
                response => {
                  if (response) {
                    this.allSlotColor$.next(response[1] as RosterSlotColor[]);
                  }
                }
            );
          }
        });
  }

  ngOnDestroy() {
    this.dismiss();
  }

  async onSubmit() {
    this.formSubmitted = true;
    if (this.slotForm.valid) {
      this.isLoading = true;
      this.modifySlotSub$ = this.auth.getCurrentToken().subscribe(async token => {
            if (token) {
              const form = this.slotForm.value;
              form.color = this.color;
              this.fullcalendarService.modifyRosterSlot(token, form).subscribe(
                  async response => {
                    this.isLoading = false;
                    switch (response.message) {
                      case 'bindingError':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'
                        }]);
                        break;
                      case 'invalidInterval':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-invalid-interval'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'

                        }]);
                        break;
                      case 'invalidSlot':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-invalid-timing'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'

                        }]);
                        break;
                      case 'optimisticException':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-optimisticException'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'
                        }]);
                        break;
                      case 'error':
                        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                          text: this.translate.getFromKey('close'),
                          role: 'cancel'
                        }]);
                        break;
                      default:
                        await this.toast.presentToast(this.translate.getFromKey('roster-update-success'), alertPosition, 'success', 2000);
                        this.fullcalendarService.rosters$.value.forEach(
                            roster => {
                              roster.getApi().refetchEvents();
                            }
                        );
                        await this.dismiss();
                    }

                  }, async error => {
                    await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                      text: this.translate.getFromKey('close'),
                      role: 'cancel'
                    }]);
                    this.isLoading = false;
                  }
              );
            } else {
              await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                text: this.translate.getFromKey('close'),
                role: 'cancel'
              }]);
              this.isLoading = false;

            }

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


  timePickerFormat() {
    if (this.translate.getLocale() === 'en') {
      return 'h:mm A';
    } else {
      return 'HH:mm';
    }
  }


  async dismiss() {
    await this.modalService.dismissRosterSlotModal();
    if (this.modifySlotSub$) {
      this.modifySlotSub$.unsubscribe();
    }
  }

  showDate() {
    return this.dateTimeUtil.showDate(this.translate.getLocale(), this.slots[0].event.start);
  }

  setColor(event: CustomEvent) {
    const color = event.detail.value;
    this.setCustomColor = color === 'other';
    if (color !== 'other') {
      this.color = color;
    }
  }

}
