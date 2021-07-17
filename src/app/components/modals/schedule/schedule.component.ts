import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatStepper} from '@angular/material';
import {ModalService} from '../../../services/overlay/modal.service';
import {alertPosition, dateClass, mobile, tablet} from '../../../app.component';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ActionSheetController} from '@ionic/angular';
import {DateAdapter} from '@angular/material/core';
import {converterDataURItoBlob, OpsHours, Service, ShortSchedule} from '../../../store/models/provider.model';
import {ToastService} from '../../../services/overlay/toast.service';
import {ScheduleService} from '../../../services/user/schedule.service';
import {AuthService} from '../../../services/auth/auth.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {InfoPopoverService} from '../../../services/util/info-popover.service';
import {InfoComponent} from '../../popover/info/info.component';
import {distinctUntilChanged, take} from 'rxjs/operators';
import {ImageComponent} from '../image/image.component';
import {EditImageComponent} from '../edit-image/edit-image.component';
import {AlertService} from '../../../services/overlay/alert.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
})
export class ScheduleComponent implements OnInit, OnDestroy {
  @ViewChild('stepper', {static: false}) stepper: MatStepper;

  @Input() freeSchedule;

  mobile = mobile;
  tablet = tablet;
  scheduleForm: FormGroup;
  copyScheduleForm: FormGroup;
  opsHoursSub$: Subscription;
  existingScheduleList: ShortSchedule[] = [];
  serviceScheduleList: ShortSchedule[] = [];
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

  formSubmitted = false;

  multipleServices = true;
  multipleSpots = false;
  services: Service[] = [];
  isLoading = false;

  submitSchedule$: Subscription;

  serviceControls;
  notifEmail = false;
  copyFromSchedule = false;
  copyForm;
  linkServiceSchedule = false;
  plan: string;


  @ViewChild('imagePicker', {static: false}) imagePicker: any;
  @ViewChild('submitBtn', {static: false}) submitBtn;
  private selectedAvatar;
  serviceSchedule: boolean;
  opsHours$ = new BehaviorSubject<OpsHours[]>([]);

  constructor(private modalService: ModalService,
              public translate: LocalizationService,
              private actionSheetController: ActionSheetController,
              private dateAdapter: DateAdapter<any>,
              private toast: ToastService,
              public scheduleService: ScheduleService,
              private auth: AuthService,
              private router: Router,
              private popoverService: InfoPopoverService,
              private alert: AlertService) {
    this.dateAdapter.setLocale(this.translate.getLocale());
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  ngOnInit() {

    this.scheduleService.imageSrc = undefined;
    this.setScheduleType();
  }

  ngOnDestroy(): void {
    if (this.opsHoursSub$) {
      this.opsHoursSub$.unsubscribe();
    }

    if (this.submitSchedule$) {
      this.submitSchedule$.unsubscribe();
    }

    this.dismiss();

  }

  nextStep() {
    this.stepper.next();
  }

  prevStep() {
    this.stepper.previous();
  }

  async dismiss() {
    await this.modalService.dismissScheduleModal();
  }

  async onSubmitForm() {
    this.formSubmitted = true;
    if (this.linkServiceSchedule || this.copyFromSchedule || this.freeSchedule) {
      this.scheduleForm.get('schedule.days').setValidators([]);
      this.scheduleForm.get('schedule.days').updateValueAndValidity();
      this.scheduleForm.get('schedule.days.day').setValidators([]);
      this.scheduleForm.get('schedule.days.day').updateValueAndValidity();
    }

    if (this.scheduleForm.valid) {
      this.isLoading = true;
      if (!this.copyFromSchedule && !this.linkServiceSchedule) {
        this.submitSchedule$ = this.auth.getCurrentToken().subscribe(
            token => {
              if (token) {
                let url = '/upload/schedule/new';
                if (this.freeSchedule) {
                  url = '/upload/schedule/free';
                }
                this.scheduleService.uploadNewSchedule(token, this.scheduleForm.value, url).subscribe(
                    async response => {
                      await this.processResponse(response);
                    }, async error => {
                      this.isLoading = false;
                      await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
                    }
                );
              }
            }
        );
      } else if (this.copyFromSchedule) {
        if (!this.scheduleForm.get('name.name').valid) {
          await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 4000);
          return;
        }
        this.copyForm = {
          scheduleType: this.scheduleForm.get('scheduleType').value,
          name: this.scheduleForm.get('name.name').value,
          category: this.scheduleForm.get('name.category').value,
          scheduleId: this.scheduleForm.get('vacancyType.copySchedule').value,
          misc: this.scheduleForm.get('misc').value,

        };

        if (!this.copyForm.scheduleId) {
          await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
          this.isLoading = false;
          return;
        } else if (!this.copyForm.name || this.copyForm.name.length < 3) {
          await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
          this.isLoading = false;
          return;
        } else {
          this.submitSchedule$ = this.auth.getCurrentToken().subscribe(
              token => {
                if (token) {
                  const url = '/upload/schedule/new/copy';
                  this.scheduleService.uploadNewScheduleCopy(token, this.copyForm, url).subscribe(
                      async response => {
                        await this.processResponse(response);
                      }, async error => {
                        this.isLoading = false;
                        await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
                      }
                  );
                }
              }
          );
        }
      } else if (this.linkServiceSchedule) {
        if (!this.scheduleForm.get('name.name').valid) {
          await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 4000);
          return;
        }
        this.copyForm = {
          scheduleType: this.scheduleForm.get('scheduleType').value,
          name: this.scheduleForm.get('name.name').value,
          category: this.scheduleForm.get('name.category').value,
          scheduleId: this.scheduleForm.get('vacancyType.serviceSchedule').value,
          misc: this.scheduleForm.get('misc').value,

        };

        if (!this.copyForm.scheduleId) {
          await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
          this.isLoading = false;
          return;
        } else if (!this.copyForm.name || this.copyForm.name.length < 3) {
          await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
          this.isLoading = false;
          return;
        } else {
          this.submitSchedule$ = this.auth.getCurrentToken().subscribe(
              token => {
                if (token) {
                  const url = '/upload/schedule/new/copy?service=true';
                  this.scheduleService.uploadNewScheduleCopy(token, this.copyForm, url).subscribe(
                      async response => {
                        await this.processResponse(response);
                      }, async error => {
                        this.isLoading = false;
                        await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
                      }
                  );
                }
              }
          );
        }
      }
    } else {
      const invalid = [];
      const controls = this.scheduleForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }
      }

      const dismissToast = [
        {
          text: 'X',
          role: 'cancel',
        }
      ];

      let errorMessage;

      if (invalid.length > 0) {
        errorMessage = '<p>' + this.translate.getFromKey('reg-errors') + ':' + '</p>';
      }

      // tslint:disable-next-line:forin
      for (const control in invalid) {
        const field = invalid[control];

        if (field === 'name') {
          errorMessage = errorMessage + '<p>' + this.translate.getFromKey('navbar-nameBindError') + '</p>';

        }
        if (field === 'schedule') {
          errorMessage = errorMessage + '<p>' + this.translate.getFromKey('sched-choose-day-error') + '</p>';
        }

      }

      if (errorMessage) {

        await this.toast.presentToast(errorMessage, alertPosition, 'danger', null, dismissToast);
      } else {

        await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 4000);
      }

      return;

    }
  }


  pickVacancyType(event: any) {
    const value = event.detail.value;
    this.multipleServices = value === '1';
    this.multipleSpots = value === '3';
    this.copyFromSchedule = value === '4';
    this.linkServiceSchedule = value === '5';
    if (this.multipleSpots) {
      this.scheduleForm.get('vacancyType.duration').setValue('30');
      this.scheduleForm.get('vacancyType.numberOfSpots').setValue('5')
    }
    if (!this.multipleSpots && !this.multipleServices) {
      this.scheduleForm.get('vacancyType.duration').setValue('30')
    }

    if (this.multipleServices) {
      this.scheduleForm.get('vacancyType.duration').setValue(null);
      this.scheduleForm.get('vacancyType.numberOfSpots').setValue(null)
    }

  }

  pickScheduleType(event: any) {
    const value = event.detail.value;
    this.serviceSchedule = value === '2';
    this.freeSchedule = value === '0';

  }

  addService(services: Service[]) {
    const control = this.scheduleForm.get('vacancyType.services') as FormArray;
    control.push(this.pushServiceValues(undefined, '30'));
    services.push({service: undefined, duration: '30'});
  }

  deleteService(index: number, services: Service[]) {
    const control = this.scheduleForm.get('vacancyType.services') as FormArray;
    control.removeAt(index);
    services.splice(index, 1);
  }


  private pushServiceValues(description, duration) {
    return new FormGroup({
      service: new FormControl(description, [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
      duration: new FormControl(duration, [Validators.required, Validators.pattern('^[1-9][0-9]*$')])
    });
  }


  notifEmailToggle(event: any) {
    const notifYByEmail = event.detail.checked;
    this.notifEmail = notifYByEmail;
  }

  async infoPopover(info: string, event: any, link?: string) {
    let videoLink;
    const locale = this.translate.getLocale();
    if (link === 'sched-type-1') {
      if (locale.includes('pt')) {
        videoLink = 'https://youtu.be/Extk_mE6S58';
      }
    }

    if (link === 'slot-type-2') {
      if (locale.includes('pt')) {
        videoLink = 'https://youtu.be/EDM1Ylb_gFY';
      }
    }

    if (link === 'slot-type-3') {
      if (locale.includes('pt')) {
        videoLink = 'https://youtu.be/rP7w891ApxM';
      }
    }

    await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event, videoLink);
  }

  private async processResponse(response: any) {
    this.isLoading = false;
    if (response.scheduleId) {
      if (this.scheduleService.imageSrc) {
        this.submitSchedule$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            async token => {
              if (token) {
                if (this.scheduleService.imageSrc) {
                  const b: any = converterDataURItoBlob(this.scheduleService.imageSrc);
                  b.lastModifiedDate = new Date();
                  b.name = 'avatar.jpg';
                  this.scheduleService.uploadAvatar(token, b, response.scheduleId).subscribe(
                      async response => {
                        await this.onSubmitSuccess();
                      }, async error => {
                        await this.onSubmitSuccess();
                      }
                  );
                }
              } else {
                await this.onSubmitSuccess();
              }
            }, async error => {
              await this.onSubmitSuccess();
            }
        );
      } else {
        await this.onSubmitSuccess();
      }
    } else {
      switch (response.message) {
        case 'success':
          await this.onSubmitSuccess();
          return;
        case 'invalidDuration':
          await this.toast.presentToast(this.translate.getFromKey('sched-invalid-duration'), alertPosition, 'danger', 4000);
          break;
        case 'invalidHour':
          await this.toast.presentToast(this.translate.getFromKey('sched-invalidTime'), alertPosition, 'danger', 4000);
          break;
        case 'bindingError':
          await this.toast.presentToast(this.translate.getFromKey('sched-choose-hours-error'), alertPosition, 'danger', 4000);
          break;
        case 'noServices':
          await this.toast.presentToast(this.translate.getFromKey('sched-no-services'), alertPosition, 'danger', 4000);
          break;
        case 'noSchedulesAllowed':
          await this.toast.presentToast(this.translate.getFromKey('schedule-over-limit'), alertPosition, 'danger', 4000);
          break;
        case 'limitExceeded':
          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('upgrade-more-schedules'), [
            {
              text: this.translate.getFromKey('close'),
              role: 'destructive'

            },
            {
              text: this.translate.getFromKey('upgrade-plan'),
              handler: async () => {
                await this.router.navigateByUrl('/user/profile/payments');
              }

            },

          ]);
          await this.dismiss();
          break;
        default:
          await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveError'), alertPosition, 'danger', 4000);
      }
    }

  }

  private async onSubmitSuccess() {
    await this.dismiss();
    await this.toast.presentToast(this.translate.getFromKey('sched-scheduleSaveSuccess'), alertPosition, 'success', 2000);
    this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
        this.router.navigateByUrl('/user/management/schedule?refresh=true'));
  }
  scheduleType(event: any) {
    const value = event.detail.value;
    this.freeSchedule = value === '2';
    this.setScheduleType();
  }

  setScheduleType() {
    if (!this.freeSchedule) {
      this.scheduleForm = new FormGroup({
        scheduleType: new FormControl('1', Validators.required),
        vacancyType: new FormGroup({
          type: new FormControl('1', [Validators.required]),
          services: new FormArray([]),
          duration: new FormControl(undefined),
          numberOfSpots: new FormControl(undefined),
          copySchedule: new FormControl(null),
          serviceSchedule: new FormControl(null),
        }),
        name: new FormGroup({
          name: new FormControl(undefined, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
          category: new FormControl(undefined, [Validators.minLength(3), Validators.maxLength(50)])
        }),
        schedule: new FormGroup({
          startDate: new FormControl(new Date(), [Validators.required]),
          endDate: new FormControl(new Date(2099, 11, 31, 10, 33, 30, 0), [Validators.required]),
          days: new FormGroup({
            day: new FormArray([], Validators.required)
          },  Validators.required)
        }),
        misc: new FormGroup({
          visible: new FormControl(false),
          note: new FormControl(undefined, [Validators.minLength(3), Validators.maxLength(255)]),
          mandatoryPhone: new FormControl(false, [Validators.required]),
          smsReminder: new FormControl(true, [Validators.required]),
          minimumNotice: new FormControl(2, [Validators.required]),
          notif: new FormControl(false, [Validators.required]),
          notifEmail: new FormControl(undefined, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
        })
      });

      // get ops hours from the server to prefill the hour fields
      this.opsHoursSub$ = this.auth.getCurrentToken().subscribe(
          token => {
            if (token) {
              this.scheduleService.getOpsHoursAndSchedules(token).subscribe(
                  response => {

                    if (response) {
                      if (response.opsHours && response.opsHours.length > 0 ) {
                          this.opsHours$.next(response.opsHours);
                      }

                      response.schedules.forEach(
                          (schedule: ShortSchedule) => {
                            if (schedule.categoryName === '###') {
                              this.serviceScheduleList.push(schedule);
                            }
                            this.existingScheduleList.push(schedule);

                          }
                      );
                    }

                  }
              );

              this.auth.userAuthorities$.pipe(take(1)).subscribe(
                  authorities => {
                    this.plan = this.auth.userPlan(authorities);
                  }
              );
            }
          });

    } else {
      this.scheduleForm = new FormGroup({
        name: new FormGroup({
          name: new FormControl(undefined, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
          category: new FormControl(undefined, [Validators.minLength(3), Validators.maxLength(50)])
        }),
        vacancyType: new FormGroup({
          services: new FormArray([]),
        }),
        misc: new FormGroup({
          note: new FormControl(undefined, [Validators.minLength(3), Validators.maxLength(255)]),
          smsReminder: new FormControl(true, [Validators.required]),
          notif: new FormControl(false, [Validators.required]),
          notifEmail: new FormControl(undefined, [Validators.pattern('^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\\.([a-zA-Z])+([a-zA-Z])+')]),
        })
      });

    }

    this.serviceControls = this.scheduleForm.get('vacancyType.services')['controls'];

  }

  async editPickedPic() {
    if (!this.scheduleService.imageSrc) {
      this.imagePicker.nativeElement.click();
    } else {
      const actionSheet = await this.actionSheetController.create({
        buttons: [
          {
            text: this.translate.getFromKey('upload'),
            icon: 'camera',
            handler: () => {
              this.imagePicker.nativeElement.click();
            }
          },
          {
            text: this.translate.getFromKey('delete'),
            icon: 'trash',
            cssClass: 'actionsheet-delete',
            handler: () => {
              this.selectedAvatar = undefined;
              this.scheduleService.imageSrc = undefined;
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

  updateServiceDuration(control: any, ev: number) {
    control.controls.duration.setValue(ev);
  }

  updateNumberInput(control: any, ev: number) {
    control.setValue(ev);
  }

  submit() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();

  }

  servicesSize() {
    if (this.scheduleForm.get('vacancyType.services').value.length > 0) {
      return true;
    }
    return false;
  }

  async showAvatar(imageSrc: string | ArrayBuffer) {
    if (typeof imageSrc === 'string') {
      await this.modalService.openImageModal(ImageComponent, imageSrc);
    }
  }

  dateClass() {
    return dateClass();
  }


  onImagePicked(event: any) {
    const reader = new FileReader();
    // tslint:disable-next-line:no-shadowed-variable
    reader.onload = async (event: any) => {
      let cssClass = '';
      if (!this.mobile && !this.tablet) {
        cssClass = 'edit-image-modal';
      } else if (this.tablet) {
        cssClass = 'edit-image-modal-tablet';
      }
      await this.modalService.openEditImageModal(EditImageComponent, reader.result, cssClass, undefined, undefined,
          undefined, undefined, false, undefined, false, undefined, true);

    };
    reader.readAsDataURL(event.target.files[0]);
  }
  //
  // async guidedTour() {
  //   const guidedTour: GuidedTour = {
  //     steps: [
  //       {
  //         title: this.translate.getFromKey('specialist'),
  //         content: '<p>' + 'Agenda com vagas' + ' - ' + 'Agenda com vagas predefenidas onde poderá agendar marcações apenas nas vagas que criar' + '</p>' +
  //             '<p>' + 'Agenda livre' + ' - ' + 'Agenda sem vagas predefenidas onde poderá criar vagas e agendar arrastando o rato ou o dedo sobre o calendário' + '</p>',
  //         skipStep: false,
  //         selector: '.type',
  //         orientation: Orientation.Bottom,
  //         closeAction: async () => {
  //           this.stepper.next();
  //           setTimeout(async () => {
  //             const step2 =  {
  //               // title: this.translate.getFromKey('specialist'),
  //               content: 'Neste campo poderá gerir a sua página no portal www.bookanapp.com e na app BOOKanAPP',
  //               skipStep: false,
  //               selector: '.name',
  //               orientation: !mobile ? Orientation.Bottom : Orientation.Top,
  //               closeAction: async () => {
  //                 this.stepper.next();
  //                 setTimeout(async () => {
  //                   const step3 =  {
  //                     // title: this.translate.getFromKey('specialist'),
  //                     content: 'Neste campo poderá gerir a sua página no portal www.bookanapp.com e na app BOOKanAPP',
  //                     skipStep: false,
  //                     selector: '.slot-type',
  //                     orientation: !mobile ? Orientation.Bottom : Orientation.Top,
  //                     closeAction: async () => {
  //                       this.stepper.next();
  //                       setTimeout(async () => {
  //                         const step4 =  {
  //                           // title: this.translate.getFromKey('specialist'),
  //                           content: 'Neste campo poderá gerir a sua página no portal www.bookanapp.com e na app BOOKanAPP',
  //                           skipStep: false,
  //                           selector: '.hours',
  //                           orientation: !mobile ? Orientation.Bottom : Orientation.Top,
  //                           closeAction: async () => {
  //                             this.stepper.next();
  //                             setTimeout(async () => {
  //                               const step5 =  {
  //                                 // title: this.translate.getFromKey('specialist'),
  //                                 content: 'Neste campo poderá gerir a sua página no portal www.bookanapp.com e na app BOOKanAPP',
  //                                 skipStep: false,
  //                                 selector: '.misc',
  //                                 orientation: Orientation.Top,
  //                                 closeAction: async () => {
  //                                   this.stepper.reset();
  //                                 }
  //
  //                               };
  //                               await this.nextTutorialStep(step5);
  //                             }, 200);
  //                           }
  //
  //                         };
  //                         await this.nextTutorialStep(step4);
  //                       }, 200);
  //                     }
  //
  //                   };
  //                   await this.nextTutorialStep(step3);
  //                 }, 200);
  //               }
  //
  //             };
  //             await this.nextTutorialStep(step2);
  //           }, 200);
  //
  //         }
  //
  //       },
  //
  //     ],
  //     tourId: '',
  //     resizeDialog: {
  //       title: 'title',
  //       content: 'content'
  //     }
  //
  //   };
  //
  //   this.guidedTourService.startTour(guidedTour);
  //
  //
  // }
  //
  // private async nextTutorialStep(step: TourStep) {
  //   const guidedTour: GuidedTour = {
  //     tourId: '',
  //     steps: [
  //       step
  //     ]
  //
  //   };
  //   this.guidedTourService.startTour(guidedTour);
  // }


}
