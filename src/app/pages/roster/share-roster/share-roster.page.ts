import {Component, ViewChild} from '@angular/core';
import {mobile} from '../../../app.component';
import {catchError, distinctUntilChanged, take} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {AuthService} from '../../../services/auth/auth.service';
import {SignInForm} from '../../../components/forms/signin.model';
import {FormGroup} from '@angular/forms';
import {ResetpasswordComponent} from '../../../components/modals/resetpassword/resetpassword.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {IonRouterOutlet} from '@ionic/angular';
import {AlertService} from '../../../services/overlay/alert.service';
import {PlatformDetectionService} from '../../../services/platformdetection/platformdetection.service';
import {Employee} from '../../../store/models/provider.model';
import {faUserTie} from '@fortawesome/free-solid-svg-icons';
import {FullcalendarService} from '../../../services/user/fullcalendar.service';
import {EmployeeService} from '../../../services/user/employee.service';

@Component({
  selector: 'app-share-roster',
  templateUrl: './share-roster.page.html',
  styleUrls: ['./share-roster.page.scss'],
})
export class ShareRosterPage {

  mobile = mobile;
  employeeId;
  subdivisionId;
  divisionId;
  preferredView;
  employeesSub$: Subscription;
  anonymous;
  signInForm: FormGroup;
  isLoading = true;
  loginFailure;
  showLoginPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;
  @ViewChild('submitBtn', {static: false}) submitBtn;
  employeeMap$ = new BehaviorSubject<any>(null);
  employeeDivisionMap$ = new BehaviorSubject<any>(null);
  allDivisionsMap$ = new BehaviorSubject<any>([]);
  allEmployees$ = new BehaviorSubject<Employee[]>(null);
  allEmployeesMap$ = new BehaviorSubject<any>(null);
  employeeIcon = faUserTie;

  constructor(private route: ActivatedRoute,
              private localStorage: LocalStorageService,
              private auth: AuthService,
              private formHolder: SignInForm,
              private translate: LocalizationService,
              private modalService: ModalService,
              private routerOutlet: IonRouterOutlet,
              private alert: AlertService,
              private platformService: PlatformDetectionService,
              private fullcalendarService: FullcalendarService,
              public employeeService: EmployeeService) { }

  async ionViewWillEnter() {
    this.route.queryParams.pipe(distinctUntilChanged(), take(1)).subscribe(async params => {
      this.employeeId = params.employeeId;
      this.subdivisionId = params.subdivisionId;
      this.divisionId = params.divisionId;

      if ( this.employeeId || this.subdivisionId || this.divisionId) {
        this.preferredView = await this.localStorage.getItem('BOOKanAPPPreferredRosterView');
        this.employeesSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
            token => {

              if (token && token !== 'Invalid token') {
                this.anonymous = false;
                this.employeeService.getAllEmployeesForSharedRosterView(token, this.employeeId, this.subdivisionId, this.divisionId).pipe(
                    catchError((err) => {
                      this.isLoading = false;
                      return throwError(err);
                    })).pipe(distinctUntilChanged(), take(1)).subscribe(
                    async response => {
                      this.extractResponse(response);
                      this.isLoading = false;
                    }
                );
              } else {
                this.anonymous = true;
                this.signInForm = this.formHolder.getSignInForm();
                this.employeeService.getAllAnonymousEmployeesForRosterView(this.employeeId, this.subdivisionId, this.divisionId).pipe(
                    catchError((err) => {
                      this.isLoading = false;
                      return throwError(err);
                    })).pipe(distinctUntilChanged(), take(1)).subscribe(
                    async response => {
                      if (response) {
                        this.extractResponse(response);
                        this.isLoading = false;
                      } else {
                        this.isLoading = false;

                                      }
                    }, error => {
                      this.isLoading = false;
                      return throwError(error);
                    }
                );
              }
            }, error => {
              this.isLoading = false;
            }
        );
      } else {
        this.isLoading = false;
      }

    });
  }

  private extractResponse(response: Employee[]) {
    this.allEmployees$.next(response);
    this.allEmployeesMap$.next(this.reduceGroupDivision(response));
    this.allDivisionsMap$.next(this.reduceGroupDivision(response));
  }

  async ionViewWillLeave() {
    if (this.employeesSub$) {
      this.employeesSub$.unsubscribe();
    }

  }

  onSignIn() {
    this.isLoading = true;
    this.auth.requestToken({username: this.signInForm.value.username, password: this.signInForm.value.password, deviceInfo: this.platformService.returnDeviceInfo() }).subscribe(
        async response => {
          if (!response.hasOwnProperty('loginFailure')) {
            this.loginFailure = undefined;
            const jwtToken = response['accessToken'];

            /*store token in local storage*/
            await this.localStorage.writeObject('bookanappProviderJWT', jwtToken);
            await this.localStorage.writeObject('bookanappRefreshProviderJWT', response['refresh_token']);

            // store obtained token in subscription
            this.auth.authToken$.next(jwtToken);

            /*set user to authenticated*/
            this.auth.setAuthenticated(true);

            // store authorities
            this.auth.userAuthorities$.next(response['authorities']);

            /*redirect to user page*/
            if (!response['forcePasswordChange']) {
              this.isLoading = true;
              window.location.reload();
            } else {
              await this.modalService.openResetPasswordModal(ResetpasswordComponent, null, '', this.routerOutlet.nativeEl);
            }
            this.isLoading = false;

          } else {
            this.isLoading = false;
            /*handle login failure*/
            switch (response['loginFailure']) {
              case 'Bad credentials':
                this.loginFailure = this.translate.getFromKey('login-failure-credentials');
                break;
              case  'User account has expired':
                this.loginFailure = this.translate.getFromKey('login-failure-expired');
                break;
              case  'User account is locked':
                this.loginFailure = this.translate.getFromKey('login-failure-locked');
                break;
              case  'User credentials have expired':
                this.loginFailure = this.translate.getFromKey('login-failure-credentials-expired');
                break;
              case  'User is disabled':
                this.loginFailure = this.translate.getFromKey('login-failure-locked');
                break;
              case  'User is userPrincipal':
                window.location.href = 'https://www.bookanapp.com/login';
                break;
              default :
                await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('login-failure'), [   {
                  text: this.translate.getFromKey('close'),
                  role: 'cancel'
                }]);
            }
          }

        }
        , async error => {
          this.isLoading = false;
          /*handle connection errors*/
          await this.alert.presentAlert(this.translate.getFromKey('error'), undefined, this.translate.getFromKey('login-failure'), [   {
            text: this.translate.getFromKey('close'),
            role: 'cancel'
          }]);
        });
  }

  showPassword(field: string) {
    if (field === 'login') {
      if (this.showLoginPassword) {
        return 'text';
      } else {
        return 'password';
      }
    }

  }


  setShowPassword(field: string) {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    }

    if (field === 'register') {
      this.showRegisterPassword = !this.showRegisterPassword;
    }

    if (field === 'confirmRegister') {
      this.showRegisterConfirmPassword = !this.showRegisterConfirmPassword;
    }
  }


  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
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

  pickEmployeeRoster(ev: any) {

    const value = ev.value;
    this.subdivisionId = undefined;
    this.divisionId = undefined;

    this.fullcalendarService.rosters$.next([]);


    const allRosters = this.allEmployees$.value;
    if (value !== 'all') {
      const splitId = value.split('=');

      if (splitId[0] === 'employeeId') {

        const employeeList: Employee[] = allRosters.filter(emp => emp.id.toString() === splitId[1].toString());
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
    } else {
      this.allDivisionsMap$.next(this.reduceGroupDivision(allRosters));
    }

  }

  doReorder(ev: CustomEvent) {
    ev.detail.complete();
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

}
