import {Component, Input, OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth/auth.service';
import {IonRouterOutlet, MenuController, NavController} from '@ionic/angular';
import {ModalService} from '../../../services/overlay/modal.service';
import {ContactComponent} from '../../modals/contact/contact.component';
import {mobile, toggleDarkMode} from '../../../app.component';
import {faCopyright} from '@fortawesome/free-solid-svg-icons';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';
import {LocalizationService} from '../../../services/localization/localization.service';
import {GuidedTour, GuidedTourService, Orientation} from 'ngx-guided-tour';
import {Router} from '@angular/router';
import {LoadingService} from '../../../services/loading/loading.service';

@Component({
  selector: 'app-mainmenu',
  templateUrl: './mainmenu.component.html',
  styleUrls: ['./mainmenu.component.scss'],
})
export class MainmenuComponent implements OnInit {

  @Input() menuId;
  @Input() isAuthenticated;
  @Input() management: boolean;
  @Input() profile: boolean;
  @Input() authority: string;

  help;
  darkMode;
  tutorialMode;

  copyRightIcon = faCopyright;

  profileUrl = 'account';

  constructor(private auth: AuthService,
              private nav: NavController,
              private menu: MenuController,
              private modalService: ModalService,
              private routerOutlet: IonRouterOutlet,
              private localStorage: LocalStorageService,
              private translate: LocalizationService,
              private guidedTourService: GuidedTourService,
              private router: Router,
              private loadingService: LoadingService
  ) { }

  ngOnInit() {


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


    if (this.authority === 'provider' || this.authority === 'admin' || this.authority === 'full') {
      this.profileUrl = 'account';
    } else if (this.authority === 'payments') {
      this.profileUrl = 'payments';
    } else {
      this.profileUrl = 'employee-profile';
    }



  }

  async signOut() {
    await this.auth.signOut();
  }

  /*handle link clicks*/
  public async navigate(url: string) {
    const loading = await this.loadingService.showLoading(this.translate.getFromKey('loading'));
    await loading.present();
    this.menu.close().then(() => {
      this.nav.navigateRoot(url).then(
         async completed => await loading.dismiss()
      );
    });
  }

  async redirectToAppointments() {
    this.menu.close().then(() => {
      this.nav.navigateRoot('/user/management/schedule');
    });
  }

  async contact() {
    this.menu.close().then(() => {
      let cssClass = '';
      if (!mobile) {
        cssClass = 'contact-modal';
      }
      this.modalService.openContactUsModal(ContactComponent, cssClass, this.routerOutlet.nativeEl);
    });
  }

  show(field: string) {
    this.menu.close().then(() => {
      const el = document.getElementById(field);
      el.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
    });
  }

  showYear() {
    const date = new Date();
    return date.getFullYear();
  }

  async toggleDarkMode(event: CustomEvent) {
    toggleDarkMode(event.detail.checked);
    await this.localStorage.writeObject('BOOKanAPPDarkMode', event.detail.checked);
    await this.menu.close();
  }


  async featureTour() {
    await this.localStorage.removeItem('BOOKanAPPTutorialMode');
    this.menu.close().then(async () => {
      await this.router.navigate(['/user/management/schedule']);
      window.location.reload();
    });
  }
}
