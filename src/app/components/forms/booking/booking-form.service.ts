import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class BookingForm {

  getBookingForm(numberOfSpots: string, name: string, start, slot, scheduleId: string, duration: string, date: string) {

    return new FormGroup({
      slotId: new FormControl(slot.id, [Validators.required]),
      serviceTypes: new FormControl([]),
      remark: new FormControl(null, Validators.maxLength(255)),
      time: new FormControl(start),
      start: new FormControl(null),
      end: new FormControl(null),
      bookedSpots: new FormControl(numberOfSpots),
      client: new FormControl(name, [Validators.minLength(3), Validators.maxLength(30)]),
      email: new FormControl(null, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
      phone: new FormControl(null, [Validators.pattern('^[0-9]+$')]),
      phoneCode: new FormControl(null),
      customerId: new FormControl(null),
      sendSms: new FormControl(true),
      saveCustomer: new FormControl(false),
      internationalPhone: new FormControl(null),
      additionalSlots: new FormControl([]),
      additionalDateTimes: new FormControl([]),
      scheduleId: new FormControl(scheduleId, [Validators.required, Validators.minLength(1)]),
      duration: new FormControl(duration, [Validators.required, Validators.minLength(1)]),
      slotDateTime: new FormControl(slot['extendedProps'].dateTime + '.000Z'),
      date: new FormControl(date)
    });
  }

  getMultipleBookingsForm(numberOfSpots: string, name: string, scheduleId: string) {
    return new FormGroup({
      serviceTypes: new FormControl([]),
      remark: new FormControl(null, Validators.maxLength(255)),
      time: new FormControl(null),
      bookedSpots: new FormControl(numberOfSpots),
      client: new FormControl(name, [Validators.minLength(3), Validators.maxLength(30)]),
      email: new FormControl(null, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
      phone: new FormControl(null, [Validators.pattern('^[0-9]+$')]),
      phoneCode: new FormControl(null),
      customerId: new FormControl(null),
      sendSms: new FormControl(true),
      saveCustomer: new FormControl(false),
      internationalPhone: new FormControl(null),
      interval: new FormGroup({
        startDate: new FormControl(new Date(), [Validators.required]),
        days: new FormGroup({
          day: new FormArray([], Validators.required)
        })
      }),
      scheduleId: new FormControl(scheduleId, [Validators.required, Validators.minLength(1)]),
      numberOfAppointments: new FormControl('1'),
      offset: new FormControl(new Date().getTimezoneOffset())
    });
  }
}
