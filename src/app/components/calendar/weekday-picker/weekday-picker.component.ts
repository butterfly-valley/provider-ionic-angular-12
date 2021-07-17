import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {LocalizationService} from '../../../services/localization/localization.service';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {mobile, tablet} from '../../../app.component';
import {OpsHours} from '../../../store/models/provider.model';

@Component({
  selector: 'app-weekday-picker',
  templateUrl: './weekday-picker.component.html',
  styleUrls: ['./weekday-picker.component.scss'],
})
export class WeekdayPickerComponent implements OnInit {
  mobile = mobile;
  tablet = tablet;

  @Input() formSubmitted: boolean;
  @Input() days: boolean;
  @Input() scheduleForm: FormGroup;
  @Input() opsHours: OpsHours[];

  weekdays = [
    {
      name:  'MONDAY',
      checked: false
    },
    {
      name:  'TUESDAY',
      checked: false
    },
    {
      name:  'WEDNESDAY',
      checked: false
    },
    {
      name:  'THURSDAY',
      checked: false
    },
    {
      name:  'FRIDAY',
      checked: false
    },
    {
      name:  'SATURDAY',
      checked: false
    },
    {
      name:  'SUNDAY',
      checked: false
    },

  ];

  pickedWeekdays = [];


  copyHours = {
    index: 0,
    on: false
  };
  hoursCopied = false;

  constructor(public translate: LocalizationService,
              private ref: ChangeDetectorRef) { }

  ngOnInit() {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;

    this.opsHours.forEach(
        hours => {
          const weekday = hours.dayOfWeek;
          const opsHours = hours.opening;
          this.pushToDayControl(control, weekday, opsHours);
          this.weekdays.filter(day => day.name === weekday)[0].checked = true;

        }
    );

  }

  addWeekday(value, hours) {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
    this.pushToDayControl(control, value, hours);
  }

  private pushToDayControl(control: FormArray, value, hours) {
    if (!hours) {
      control.push(
          new FormGroup({
            weekday: new FormControl(value),
            schedule: new FormArray([
              new FormGroup({
                start: new FormControl(undefined, [Validators.required]),
                end: new FormControl(undefined, [Validators.required])
              })
            ], [Validators.required])
          })
      );
    } else {
      const prefilledHours = [];
      hours.forEach(
          hour => {

            const startTime = this.addZeroToHour(hour.split('-')[0]);
            const start = {
              hour: +startTime.split(':')[0],
              minute: +startTime.split(':')[1]
            };

            const endTime = this.addZeroToHour(hour.split('-')[1]);
            const end = {
              hour: +endTime.split(':')[0],
              minute: +endTime.split(':')[1]
            };

            prefilledHours.push(
                new FormGroup({
                  start: new FormControl(start, [Validators.required]),
                  end: new FormControl(end, [Validators.required])
                })
            );
          }
      );
      control.push(
          new FormGroup({
            weekday: new FormControl(value),
            schedule: new FormArray(prefilledHours, [Validators.required])
          })
      );
    }
  }



  private addZeroToHour(hour: string) {
    if (hour.length === 4) {
      return 0 + hour;
    } else {
      return hour;
    }
  }

  deleteDay(weekday: string) {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
    const day = control.controls.filter(ctrl => ctrl.value.weekday === weekday)[0];
    control.removeAt(control.controls.indexOf(day));
  }

  deleteHour(weekday: string, index: number) {
    const weekDayFormArray = this.scheduleForm.get('schedule.days.day') as FormArray;
    const day = weekDayFormArray.controls.filter(ctrl => ctrl.value.weekday === weekday)[0];
    if (day) {
      const hourControls = day['controls'].schedule as FormArray;
      hourControls.removeAt(index);
    }
  }

  weekDaysHourControls(i: number) {
    const formArray = this.scheduleForm.get('schedule.days.day') as FormArray;
    if (formArray.controls[i]) {
      return formArray.controls[i]['controls'].schedule.controls;
    }
  }


  addTimeInterval(weekday: string) {
    const formArray = this.scheduleForm.get('schedule.days.day') as FormArray;
    const day = formArray.controls.filter(ctrl => ctrl.value.weekday === weekday)[0];
    if (day) {
      const intervalArray =  day['controls'].schedule as FormArray;
      intervalArray.push(new FormGroup({
        start: new FormControl(undefined, Validators.required),
        end: new FormControl(undefined, Validators.required)
      }));
    }
  }

  pushWeekday(event: any, weekday: any, index: number) {
    const checked = event.detail.checked;

    if (checked) {
      const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
      if (control) {
        const day = control.controls.filter(ctrl => ctrl.value.weekday === weekday.name)[0];
        if (!day) {
          this.addWeekday(weekday.name, null);
        }
      } else {
        this.addWeekday(weekday.name, null);
      }
    } else {
      this.deleteDay(weekday.name)
    }
    this.weekdays.filter(day => day.name === weekday.name)[0].checked = checked;

  }

  prepopulatedDay(i: number) {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
    return !!control.value[i];
  }

  prepopulatedHours(i: number) {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
    return !!control.value[i] && !!control.value[i].schedule;
  }

  dayScheduleControls(i: number) {
    const control = this.scheduleForm.controls.schedule['controls'].days.controls.day as FormArray;
    return control.controls[i]['controls'].schedule.name;

  }

  /**
   * Copies hour interval from one weekday to all picked weekdays
   * @param weekday
   * @param index
   * @param event
   */
  copyHour(weekday: any, index: number, event: CustomEvent) {
    const formArray = this.scheduleForm.get('schedule.days.day') as FormArray;
    if (event.detail.checked) {
      this.hoursCopied = false;
      this.ref.detectChanges();
      this.copyHours.on = true;
      this.copyHours.index = index;
      const day = formArray.controls.filter(ctrl => ctrl.value.weekday === weekday.name)[0];
      if (day) {
        const intervalArray = day['controls'].schedule as FormArray;

        for (let i = 0; i < formArray.length; i++) {
          const dayControls = formArray.at(i);
          if (dayControls.value.weekday !== weekday.name) {

            const hourControls = formArray.at(i)['controls'].schedule as FormArray;
            for (let j = 0; j < hourControls.length; j++) {
              hourControls.removeAt(j);
            }

            for (let j = 0; j < intervalArray.length; j++) {

              hourControls.push(new FormGroup({
                start: new FormControl(intervalArray.at(j).value.start, Validators.required),
                end: new FormControl(intervalArray.at(j).value.end, Validators.required)
              }));
            }

          }
        }

      }
      this.ref.detectChanges();
      this.hoursCopied = true;

    } else {
      this.hoursCopied = false;
      this.copyHours.on = false;
      this.copyHours.index = undefined;
    }

  }

}
