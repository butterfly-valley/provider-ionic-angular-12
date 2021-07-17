import {Component, Input, OnInit} from '@angular/core';
import {ContactComponent} from '../../modals/contact/contact.component';
import {toggleDarkMode} from '../../../app.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AuthService} from '../../../services/auth/auth.service';
import {Router} from '@angular/router';
import {
  faCalendarAlt,
  faCalendarCheck,
  faCommentAlt,
  faCopyright, faCreditCard,
  faUserCircle,
  faUsers, faUserTie,
  faWindowMaximize
} from '@fortawesome/free-solid-svg-icons';
import {MenuService} from '../../../services/menu/menu.service';
import {distinctUntilChanged, take} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'app-desktop-menu',
  templateUrl: './desktop-menu.component.html',
  styleUrls: ['./desktop-menu.component.scss'],
})
export class DesktopMenuComponent implements OnInit {

  darkMode;
  tutorialMode;
  help;
  copyRightIcon = faCopyright;

  messageIcon = faCommentAlt;
  appointmentIcon = faCalendarCheck;
  scheduleIcon = faCalendarAlt;
  customersIcon = faUsers;
  accountIcon = faUserCircle;
  pageIcon = faWindowMaximize;
  employeesIcon = faUserTie;
  paymentIcon = faCreditCard;

  authorities$ = new BehaviorSubject<string[]>(null);

  scheduleView = true;
  appView = true;
  customersView = true;
  messageView = true;
  profileView = true;
  pageView = true;
  employeeView = true;
  paymentsView = true;
  providerView = true;

  loggedUser;

  constructor(
      private modalService: ModalService,
      private localStorage: LocalStorageService,
      private translate: LocalizationService,
      public auth: AuthService,
      private router: Router,
      public menuService: MenuService) { }

  ngOnInit() {

    this.menuService.currentRoute = this.router.url;

    this.localStorage.getObject('BOOKanAPPDarkMode').then(
        value => {
          this.darkMode = value;
        }
    );
    this.localStorage.getObject('BOOKanAPPTutorialMode').then(
        value => {
          if (!value || value === 'true') {
            this.tutorialMode = true;
          }
        }
    );

    if (this.translate.getLocale() === 'pt-PT') {
      this.help = true;
    }

    this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
        async authorities => {
          this.authorities$.next(authorities);

          switch (this.auth.userRole(authorities)) {
            case 'admin':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.customersView = false;
              this.providerView = false;
              break;
            case 'payments':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.customersView = false;
              this.pageView = false;
              this.employeeView = false;
              this.profileView = false;
              this.providerView = false;
              break;
            case 'roster':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.customersView = false;
              this.pageView = false;
              this.paymentsView = false;
              this.profileView = false;
              this.providerView = false;
              break;
            case 'roster-view':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.customersView = false;
              this.pageView = false;
              this.paymentsView = false;
              this.profileView = false;
              this.providerView = false;
              this.employeeView = false;
              break;
            case 'schedule':
              this.pageView = false;
              this.paymentsView = false;
              this.profileView = false;
              this.employeeView = false;
              this.providerView = false;
              break;
            case 'schedule-view':
              this.pageView = false;
              this.paymentsView = false;
              this.profileView = false;
              this.employeeView = false;
              this.providerView = false;
              break;
            case 'customers':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.paymentsView = false;
              this.pageView = false;
              this.employeeView = false;
              this.profileView = false;
              this.providerView = false;
              break;
            case 'schedule-customers':
              this.scheduleView = false;
              this.messageView = false;
              this.appView = false;
              this.paymentsView = false;
              this.pageView = false;
              this.employeeView = false;
              this.profileView = false;
              this.providerView = false;
              break;
            case 'full':
              this.providerView = false;
              break;

          }

        }
    );

  }


  async signOut() {
    await this.auth.signOut();
  }

  async contact() {
    await  this.modalService.openContactUsModal(ContactComponent, 'contact-modal', undefined);

  }


  showYear() {
    const date = new Date();
    return date.getFullYear();
  }

  async toggleDarkMode(event: CustomEvent) {
    toggleDarkMode(event.detail.checked);
    await this.localStorage.writeObject('BOOKanAPPDarkMode', event.detail.checked);

  }


  async featureTour() {
    await this.localStorage.removeItem('BOOKanAPPTutorialMode');
    await this.router.navigate(['/user/management/schedule']);
    window.location.reload();

  }

  async route(url: string) {
    this.menuService.currentRoute = url;
    await this.router.navigateByUrl(url);
  }
}
