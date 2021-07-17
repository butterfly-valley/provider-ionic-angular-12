import {Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {alertPosition, mobile, standardAnimation, tablet} from '../../../app.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {EditRosterSlotComponent} from '../../modals/employee/edit-roster-slot/edit-roster-slot.component';
import {Employee, SlotDetails} from '../../../store/models/provider.model';
import {LoadingService} from '../../../services/loading/loading.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {AuthService} from '../../../services/auth/auth.service';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {catchError, distinctUntilChanged, filter, take} from 'rxjs/operators';
import {EmployeeService} from '../../../services/user/employee.service';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {RosterService} from '../../../services/user/roster.service';
import {faUserTie} from '@fortawesome/free-solid-svg-icons';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {ActionSheetController} from '@ionic/angular';
import {animate, query, stagger, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-roster-list',
  templateUrl: './roster-list.component.html',
  styleUrls: ['./roster-list.component.scss'],
  animations: [
    standardAnimation,
    trigger(
        'listAnimation', [
          transition('* <=> *', [
            query(
                ':enter',
                [
                  style({ opacity: 0, transform: 'translateY(-15px)' }),
                  stagger(
                      '50ms',
                      animate(
                          '100ms ease-out',
                          style({ opacity: 1, transform: 'translateY(0px)' })
                      )
                  )
                ],
                { optional: true }
            ),
            query(':leave', animate('50ms', style({ opacity: 0 })), {
              optional: true
            })
          ])

        ])

  ],
})
export class RosterListComponent implements OnInit, OnDestroy {

  mobile = mobile;
  tablet = tablet;
  @Input() rosterView: boolean;
  @Input() employeeId: string;

  rosterSub$: Subscription;
  employeesSub$: Subscription;

  employeeMap$ = new BehaviorSubject<any>(null);
  allEmployeesMap$ = new BehaviorSubject<any>(null);
  allDivisionsMap$ = new BehaviorSubject<any>(null);
  employeeDivisionMap$ = new BehaviorSubject<any>(null);
  allEmployees$ = new BehaviorSubject<Employee[]>(null);
  rosterListLength: number;

  isLoading = false;
  searchingRoster = false;
  // renderRosters = false;
  noRosterSearchResults: boolean;
  employee: Employee;
  private subdivisionId: string;
  private divisionId: string;
  preferredView: any;

  employeeIcon = faUserTie;
  private approveTimeOffSub$: Subscription;

  constructor(public fullcalendarService: FullcalendarService,
              private translate: LocalizationService,
              private toast: ToastService,
              private loadingService: LoadingService,
              private modalService: ModalService,
              private alert: AlertService,
              private auth: AuthService,
              public employeeService: EmployeeService,
              private localStorage: LocalStorageService,
              private rosterService: RosterService,
              private dateTimeUtil: DateTimeUtilService,
              public actionSheetController: ActionSheetController) { }

  ngOnInit() {
    setTimeout(async () => {
      this.preferredView = await this.localStorage.getItem('BOOKanAPPPreferredRosterView');
      this.loadRosters();
    });


  }

  ngOnDestroy() {
    if (this.rosterSub$) {
      this.rosterSub$.unsubscribe();
    }

    if (this.employeesSub$) {
      this.employeesSub$.unsubscribe();
    }

    if (this.approveTimeOffSub$) {
      this.approveTimeOffSub$.unsubscribe();
    }
  }


  private loadRosters() {
    this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
        token => {
          if (token) {
            this.employeeService.getAllEmployeesForSharedRosterView(token).pipe(
                catchError((err) => {
                  this.isLoading = false;
                  return throwError(err);
                })).pipe(distinctUntilChanged(), take(1)).subscribe(
                async response => {
                  this.allEmployees$.next(response);
                  this.allEmployeesMap$.next(this.reduceGroupDivision(response));
                  this.allDivisionsMap$.next(this.reduceGroupDivision(response));

                  if (this.employeeId) {
                    this.pickEmployeeRoster({
                      value: 'employeeId=' + this.employeeId
                    });
                  }

                  this.isLoading = false;
                }
            );

          } else {

          }
        }
    );

  }

  pickEmployeeRoster(ev: any) {

    this.employeeService.renderRosters = false;
    const value = ev.value;
    this.employee = undefined;
    this.subdivisionId = undefined;
    this.divisionId = undefined;

    this.fullcalendarService.rosters$.next([]);


    const allRosters = this.allEmployees$.value;
    // if (value !== 'all') {
    const splitId = value.split('=');

    if (splitId[0] === 'employeeId') {

      const employeeList: Employee[] = allRosters.filter(emp => emp.id.toString() === splitId[1].toString());

      if (employeeList[0]) {
        this.employee = employeeList[0];
      }

      this.allDivisionsMap$.next(this.reduceGroupDivision(employeeList));
    }

    if (splitId[0] === 'subdivisionId') {

      if (splitId[1].toString() !== 'null') {
        this.allDivisionsMap$.next(this.reduceGroupDivision(allRosters.filter(emp => emp.subdivisionId && emp.subdivisionId.toString() === splitId[1].toString())));
      } else {
        this.allDivisionsMap$.next(this.reduceGroupDivision(allRosters.filter(emp => !emp.subdivisionId)));
      }

    }

    if (splitId[0] === 'divisionId') {

      if (splitId[1].toString() !== 'null') {
        this.allDivisionsMap$.next(this.reduceGroupDivision(allRosters.filter(emp => emp.divisionId && emp.divisionId.toString() === splitId[1].toString())));
      } else {
        this.allDivisionsMap$.next(this.reduceGroupDivision(allRosters.filter(emp => !emp.divisionId)));
      }
    }

    this.rosterListLength = Object.keys(this.allDivisionsMap$.value.entries().next().value[1]).length;


    setTimeout(() => {
      this.employeeService.renderRosters = true;
    }, 1);
  }

  searchRosters(ev: CustomEvent) {
    this.isLoading = true;
    const searchTerm = ev.target['value'];
    if (searchTerm && searchTerm.toString().length > 1) {
      this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
          token => {
            if (token) {
              this.employeeService.searchRosters(token, searchTerm).pipe(
                  catchError((err) => {
                    this.isLoading = false;
                    return throwError(err);
                  })).subscribe(
                  response => {
                    const employees = response as Employee[];
                    this.searchingRoster = true;
                    if (employees && employees.length > 0) {
                      this.allDivisionsMap$.next(null);
                      this.fullcalendarService.rosters$.next([]);
                      this.employeeService.renderRosters = false;

                      setTimeout(() => {
                        this.allDivisionsMap$.next(this.reduceGroupDivision(response as Employee[]));
                        this.employeeService.renderRosters = true;
                        this.noRosterSearchResults = false;
                        this.searchingRoster = false;
                      }, 10);


                    } else {
                      this.allDivisionsMap$.next(null);
                      this.noRosterSearchResults = true;
                      this.searchingRoster = false;
                    }

                    this.isLoading = false;
                  }
              );
            } else {
              this.isLoading = false;
            }
          }
      );
    } else if (!searchTerm) {
      this.allDivisionsMap$.next(null);
      this.employeeService.renderRosters = false;
      this.noRosterSearchResults = false;
    }

  }

  async editSlot() {
    if (this.fullcalendarService.selectedSlots.length > 0) {
      await this.modalService.openRosterSlotModal(EditRosterSlotComponent, '', this.fullcalendarService.selectedSlots);
      this.setOpacityBack();
    }
  }

  async deleteSlots() {
    await this.alert.presentAlert(this.translate.getFromKey('delete'), '', this.translate.getFromKey('sched-delete-slots-sure'), [
          {
            cssClass: 'actionsheet-delete',
            text: this.translate.getFromKey('delete'),
            handler: async () => {
              const loading = await this.loadingService.showLoading(this.translate.getFromKey('processing'));
              await loading.present();
              this.rosterSub$ = this.auth.getCurrentToken().subscribe(async token => {
                    if (token) {
                      const slotDetails: SlotDetails[] = [];
                      this.fullcalendarService.selectedSlots.forEach(
                          slot => {
                            slotDetails.push({
                              slotId: slot.event.extendedProps.slotId,
                              subdivisionId: slot.event.extendedProps.subdivisionId,
                              employeeId: slot.event.extendedProps.employeeId
                            });
                          }
                      );


                      this.fullcalendarService.deleteRosterSlot(token, {slotDetails: slotDetails}).subscribe(
                          async response => {
                            await this.loadingService.dismissLoading();
                            switch (response.message) {
                              case 'bindingError':
                                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
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
                                this.setOpacityBack();
                            }

                          }, async error => {
                            await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                              text: this.translate.getFromKey('close'),
                              role: 'cancel'
                            }]);
                            await this.loadingService.dismissLoading();
                          }
                      );
                    } else {
                      await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('notAuth'), [   {
                        text: this.translate.getFromKey('close'),
                        role: 'cancel'
                      }]);
                      await this.loadingService.dismissLoading();
                    }

                  }
              );
            }
          },
          {
            text: this.translate.getFromKey('close'),
            role: 'cancel'
          }
        ]
    );
  }

  async copySlot() {
    this.fullcalendarService.copiedSlots = [];
    this.fullcalendarService.copiedSlots = this.fullcalendarService.selectedSlots;
    await this.toast.presentToast(this.translate.getFromKey('slots-copied'), alertPosition, 'success', 200);
    this.setOpacityBack();
  }

  async slotInfo() {
    await this.fullcalendarService.showSlotInfo(this.fullcalendarService.selectedSlots[0]);
    this.setOpacityBack();
  }


  async editDivisionRoster(division: any) {
    let divisionId;
    const employee = this.getFirstEmployeeOfMap(division);

    if (employee && employee.divisionId) {
      divisionId = employee.divisionId;
    }


    if (divisionId) {
      await this.rosterService.editRoster(employee, false, true);
    }
  }

  async shareDivisionRoster(division: any) {

    let divisionId;
    const employee = this.getFirstEmployeeOfMap(division);

    if (employee && employee.divisionId) {
      divisionId = employee.divisionId;
    }


    if (divisionId) {
      await this.rosterService.shareRoster(division.key, 'https://provider.bookanapp.com/roster?divisionId=' + divisionId);
    }
  }

  doReorder(ev: CustomEvent) {
    ev.detail.complete();
  }

  private setOpacityBack() {
    this.fullcalendarService.selectedSlots.forEach(
        event => {
          event.el.style.opacity = 1;
        }
    );

    this.fullcalendarService.selectedTimeOffSlots.forEach(
        event => {
          event.el.style.opacity = 1;
        }
    );

    this.fullcalendarService.selectedTimeOffSlots = [];
    this.fullcalendarService.selectedSlots = [];
  }

  // group employees by subdivision name
  private reduceGroupBySubdivision(employees: Employee[], omitDivision?: boolean) {
    const list = employees.reduce((acc: {}, item) => {
      if (Object.keys(acc).includes(item.subdivision)) { return acc; }
      const divisionDetails = omitDivision ? '' : ' (' + item.division + ')';
      acc[item.subdivision !== null ? item.subdivision + divisionDetails :  this.translate.getFromKey('no-subdivision')] = employees.filter(g => g.subdivision === item.subdivision);
      return acc;
    }, {});
    if (!omitDivision) {
      this.employeeMap$.next(list);
    }
    return list;
  }

  private reduceGroupDivision(employees: Employee[]) {
    const list = employees.reduce((acc: Map<string, any>, item) => {
      if (Object.keys(acc).includes(item.division)) { return acc; }
      acc.set(item.division !== null ? item.division :  this.translate.getFromKey('no-division'), this.reduceGroupBySubdivision(employees.filter(g => g.division === item.division), true));
      return acc;
    }, new Map<string, any>());

    this.employeeDivisionMap$.next(list);
    return list;
  }

  // extract divisionId from map

  getDivisionId(division: string) {
    const allDivisions = this.allEmployeesMap$.value;
    const divisionMap = allDivisions.get(division);
    if (divisionMap) {
      const [first] = Object.keys(divisionMap);
      return divisionMap[first][0].divisionId;
    }

  }

  private getFirstEmployeeOfMap(division: any): Employee | undefined {
    const subdivisionMap = division.value as Map<string, Employee[]>;
    let employee: Employee;
    for (const [key, value] of Object.entries(subdivisionMap)) {
      if (value[0]) {
        employee = value[0];
      }
    }

    return employee;

  }


  async approveTimeOff() {
    const slots = this.fullcalendarService.selectedTimeOffSlots;
    const slotForm = [];
    this.fullcalendarService.selectedTimeOffSlots.forEach(
        slot => {
          slotForm.push(slot.event.extendedProps.slotId);
        }
    );

    const actionSheet = await this.actionSheetController.create({
      header: this.dateTimeUtil.showDateInterval(this.translate.getLocale(), slots[0].event.start, slots.length),
      buttons: [
        {text: this.translate.getFromKey('deny') + ' ' + slots.length + ' ' + this.translate.getFromKey('slots'),
          icon: 'close-outline',
          cssClass: 'actionsheet-delete',
          handler: () => {
            this.isLoading = true;
            this.approveTimeOffSub$ = this.auth.getCurrentToken().subscribe(
                token => {
                  if (token) {
                    this.fullcalendarService.denyTimeOff(token, slotForm).subscribe (
                        async response => {
                          await this.processTimeOffApprovalResponse(response);
                        }, async error => {
                          this.isLoading = false;
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                        }
                    );

                  }
                });

          }
        },
        {
          text: this.translate.getFromKey('approve') + ' ' + slots.length + ' ' + this.translate.getFromKey('slots'),
          icon: 'checkmark-outline',
          handler: () => {
            this.isLoading = true;
            this.approveTimeOffSub$ = this.auth.getCurrentToken().subscribe(
                token => {
                  if (token) {
                    this.fullcalendarService.approveTimeOff(token, slotForm).subscribe (
                        async response => {
                          await this.processTimeOffApprovalResponse(response);
                        }, async error => {
                          this.isLoading = false;
                          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
                            text: this.translate.getFromKey('close'),
                            role: 'cancel'
                          }]);
                        }
                    );

                  }
                });

          }
        },
        {
          text: this.translate.getFromKey('close'),
          icon: 'close',
          role: 'cancel',

        }
      ]
    });
    await actionSheet.present();

  }

  private async processTimeOffApprovalResponse(response: {message: string}) {
    this.isLoading = false;
    switch (response.message) {
      case 'bindingError':
        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('sched-bookingBindingErrorMessage'), [   {
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
      case 'error':
        await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('roster-update-error'), [   {
          text: this.translate.getFromKey('close'),
          role: 'cancel'
        }]);
        break;
      default:
        await this.toast.presentToast(this.translate.getFromKey('roster-update-success'), alertPosition, 'success', 2000);
        this.fullcalendarService.rosters$.value.forEach(
            roster =>  {
              roster.getApi().refetchEvents();
            }
        );
        this.setOpacityBack();

    }
  }


}
