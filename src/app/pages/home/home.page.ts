import {Component, OnDestroy} from '@angular/core';
import {SearchForm} from '../../components/forms/searchform';
import {PlatformDetectionService} from '../../services/platformdetection/platformdetection.service';
import {LocalizationService} from '../../services/localization/localization.service';
import {IonRouterOutlet, MenuController, NavController} from '@ionic/angular';
import {mobile, tablet} from '../../app.component';
import {AuthGuardService} from '../../services/guards/auth.service';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {Subscription} from 'rxjs';
import {LocalStorageService} from '../../services/localstorage/local-storage.service';
import {InfoComponent} from '../../components/popover/info/info.component';
import {InfoPopoverService} from '../../services/util/info-popover.service';
import {faCopyright} from '@fortawesome/free-solid-svg-icons';
import {ContactComponent} from '../../components/modals/contact/contact.component';
import {ModalService} from '../../services/overlay/modal.service';
import {Meta, Title} from "@angular/platform-browser";
import {DomSanitizer} from '@angular/platform-browser';
import {LoadingService} from '../../services/loading/loading.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnDestroy {

  mobile = mobile;
  tablet = tablet;

  /*authentication subscription*/
  authSub$: Subscription;

  showTermsContainer = false;

  copyRightIcon = faCopyright;
  isAndroid: boolean;
  isIos: boolean;
  videoSrc: any;
  videoWidth: any;
  videoHeight: any;
  videoStyle: any;

  slideOpts = {
    initialSlide: 0,
    speed: 400
  };


  constructor(private searchFormService: SearchForm,
              private platformService: PlatformDetectionService,
              public translate: LocalizationService,
              private menu: MenuController,
              private authGuard: AuthGuardService,
              private router: Router,
              private auth: AuthService,
              private localStorage: LocalStorageService,
              private popoverService: InfoPopoverService,
              private modalService: ModalService,
              private routerOutlet: IonRouterOutlet,
              private titleService: Title,
              private metaService: Meta,
              private sanitizer: DomSanitizer,
              private loadingService: LoadingService,
              private nav: NavController) {}


  async ionViewWillEnter() {
    /*redirect if user is logged*/
    this.videoSrc = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/9WkVdL4eBrI?autoplay=1&cc_load_policy=1&cc_lang_pref=' + this.translate.getLocale());

    if (!mobile) {
      this.videoWidth = 640;
      this.videoHeight = 320
      this.videoStyle = "margin-bottom: 32px; margin-left: 32px";
    } else {
      if (tablet) {
        this.videoWidth = 460;
        this.videoHeight = 230;
        this.videoStyle = "margin-top: 32px";
      } else {
        this.videoWidth = 300;
        this.videoHeight = 150;
        this.videoStyle = "margin-top: 32px";
      }
    }



    if (this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/user/management/schedule');
      window.location.reload();
    } else {
      this.authSub$ = this.authGuard.autoAuth(true, false).subscribe();
    }
    if (mobile) {
      await this.menu.enable(true, 'home');
    }

    /* check if cookies have been accepted*/
    this.localStorage.getItem('BOOKanAPPProviderTerms').then(
        value => {
          if (!value.value) {
            this.showTermsContainer = true;
          }
        }
    );

    this.titleService.setTitle('BOOKanAPP - ' + this.translate.getFromKey('smart-management'));
    this.metaService.addTags([
      {name: 'keywords', content: this.translate.getFromKey('specialist')},
      {name: 'description', content: this.translate.getFromKey('welcome-h1-desc')},
    ]);

    this.platformService.getCurrentPlatforms().forEach(
        platform => {
          if (platform === 'android') {
            this.isAndroid = true;
          }
        }
    );

    this.platformService.getCurrentPlatforms().forEach(
        platform => {
          if (platform === 'ios') {
            this.isIos = true;
          }
        }
    );

  }

  ionViewWillLeave() {
    this.videoSrc = undefined;
    this.videoSrc =  this.videoSrc = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/9WkVdL4eBrI?autoplay=1&cc_load_policy=1&mute=1&cc_lang_pref=' + this.translate.getLocale());
    if (this.authSub$) {
      this.authSub$.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.authSub$) {
      this.authSub$.unsubscribe();
    }
  }



  async infoPopover(info: string, event: any) {
    await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event);
  }

  showYear() {
    const date = new Date();
    return date.getFullYear();
  }

  show(field: string) {
    const el = document.getElementById(field);
    el.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
  }

  async contact(sales?: boolean) {
    this.menu.close().then(() => {
      let cssClass = '';
      if (!mobile) {
        cssClass = 'contact-modal';
      }
      this.modalService.openContactUsModal(ContactComponent, cssClass, this.routerOutlet.nativeEl, sales);
    });
  }

  closeAppDownload() {
    this.isAndroid = false;
    this.isIos = false;
  }


  /*handle link clicks*/
  public async navigate(url: string) {
    const loading = await this.loadingService.showLoading(this.translate.getFromKey('loading'));
    await loading.present();
    this.menu.close().then(() => {
      this.nav.navigateForward(url).then(
          async completed => await loading.dismiss()
      );
    });
  }

}
