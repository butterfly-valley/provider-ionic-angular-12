import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {Subscription} from 'rxjs';
import {ScheduleService} from '../../../services/user/schedule.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';


@Component({
  selector: 'app-modifyslot',
  templateUrl: './modify-slot.component.html',
  styleUrls: ['./modify-slot.component.scss'],
})
export class ModifySlotComponent implements OnInit, OnDestroy {

  @Input() selectedSlots: Array<any>;
  @Input() scheduleId: string;
  @Input() locale: string;
  @Input() deleteSlots: boolean;
  @Input() modifySlots: boolean;
  @ViewChild('submitBtn', {static: false}) submitBtn;
  @Input() fullCalendar;

  modifySlotSub$: Subscription;

  mobile = mobile;
  tablet = tablet;

  slotForm;
  isLoading = false;
  formSubmitted = false;
  noDuration = false;
  multipleSpots: string;

  constructor(private modalService: ModalService,
              private fullcalendarService: FullcalendarService,
              private toast: ToastService,
              public translate: LocalizationService,
              private auth: AuthService,
              private scheduleService: ScheduleService,
              private dateTimeService: DateTimeUtilService) { }

  ngOnInit() {
    const slotIds = [];
    const slot = this.selectedSlots[0].event;
    const data = slot.extendedProps;
    if (!this.modifySlots) {
      if (!this.deleteSlots) {
        if (this.selectedSlots[0]) {
          if (data.noDuration) {
            this.noDuration = true;
            this.pushModifyStartControls(slotIds, null);
          } else {
            this.pushDeleteControls(slotIds);
          }
        } else {
          this.pushDeleteControls(slotIds);
        }
      } else {
        this.pushDeleteControls(slotIds);
      }
    } else {
      const numberOfSpots = data.numberOfSpots;
      if (numberOfSpots) {
        this.multipleSpots = numberOfSpots;
        this.pushModifyStartControls(slotIds, numberOfSpots);
      } else {
        this.pushModifyStartControls(slotIds, null);
      }
    }

  }

  ngOnDestroy(): void {
    if (this.modifySlotSub$) {
      this.modifySlotSub$.unsubscribe();
    }

    this.dismiss();
  }

  async dismiss() {
    await this.modalService.dismissModifySlotModal();
  }

  async onSubmit() {
    this.formSubmitted = true;
    if (this.slotForm.valid) {
      this.isLoading = true;
      this.modifySlotSub$ = this.auth.getCurrentToken().subscribe(token => {
            if (token) {
              this.isLoading = false;
              let url = '/update/slot';
              if (this.deleteSlots) {
                url = '/delete/slot';
              }
              if (this.modifySlots) {
                url = '/modify/slot';
              }


              this.scheduleService.modifySlot(token, this.slotForm.value, url).subscribe(
                  async response => {
                    switch (response.message) {
                      case 'bindingError':
                        await this.toast.presentToast(this.translate.getFromKey('sched-bookingBindingErrorMessage'), alertPosition, 'danger' , 6000);
                        break;
                      case 'hasBooking':
                        await this.toast.presentToast(this.translate.getFromKey('sched-hasBookingMessage'), alertPosition, 'danger' , 6000);
                        break;
                      case 'invalidInterval':
                        await this.toast.presentToast(this.translate.getFromKey('sched-invalid-interval'), alertPosition, 'danger' , 6000);
                        break;
                      case 'optimisticException':
                        await this.toast.presentToast(this.translate.getFromKey('sched-optimisticException'), alertPosition, 'danger' , 6000);
                        break;
                      case 'schedError':
                        await this.toast.presentToast(this.translate.getFromKey('sched-specialistUpdateError'), alertPosition, 'danger', 6000);
                        break;
                      case 'invalidTiming':
                        await this.toast.presentToast(this.translate.getFromKey('sched-invalid-timing'), alertPosition, 'danger', 6000);
                        break;
                      default:
                        if (!this.fullCalendar) {
                          if (!this.deleteSlots) {
                            this.scheduleService.setOpacityBack();
                          } else {
                            this.scheduleService.selectedSlots = [];
                          }
                          this.fullcalendarService.refetchSlots();
                        } else {
                          this.fullcalendarService.refetchSlotsForCalender(this.fullCalendar);
                        }
                        await this.toast.presentToast(this.translate.getFromKey('sched-schedSuccessMessage'), alertPosition, 'success', 2000);
                        await this.dismiss();
                    }

                  }, async error => {
                    this.isLoading = false;
                    await this.toast.presentToast(this.translate.getFromKey('provider-schedError'), alertPosition, 'danger', 6000);
                  }
              );
            }
          }
      );

    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
      return;
    }

  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }


  private pushModifyStartControls(slotIds, numberOfSpots) {
    const slot = this.selectedSlots[0].event;
    slotIds.push(slot.id);
    const slotStart = slot.start.toISOString().split('T')[1];
    const slotEnd = slot.end.toISOString().split('T')[1];



    const start = {
      hour: +slotStart.split(':')[0],
      minute: +slotStart.split(':')[1]
    };

    const end = {
      hour: +slotEnd.split(':')[0],
      minute: +slotEnd.split(':')[1]
    };


    const slotDateTimes = [];
    const slotDurations = [];

    if (slot.id === '0') {
      slotDateTimes.push(slot.extendedProps.dateTime);
      slotDurations.push(slot.extendedProps.slotDuration);
    }


    this.slotForm = new FormGroup({
      events: new FormControl(slotIds, [Validators.required]),
      start: new FormControl(start),
      finish: new FormControl(end),
      numberOfSpots: new FormControl(numberOfSpots),
      scheduleId: new FormControl(slot.extendedProps.scheduleId),
      slotDateTimes: new FormControl(slot.id === '0' ? slotDateTimes: null),
      slotDurations: new FormControl(slot.id === '0'  ? slotDurations : null),
      date: new FormControl(slot.start.toISOString().split('T')[0])
    });



  }

  private pushDeleteControls(slotIds) {
    this.selectedSlots.forEach(
        slot => {
          slotIds.push(slot.event.id);
        }
    );
    this.slotForm = new FormGroup({
      events: new FormControl(slotIds, [Validators.required]),
    });
  }

  updateNumberInput(control: any, ev: number) {
    control.setValue(ev);
  }

}
