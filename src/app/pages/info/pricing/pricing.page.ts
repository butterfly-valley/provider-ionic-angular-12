import { Component } from '@angular/core';
import {mobile, tablet} from '../../../app.component';
import {ContactComponent} from '../../../components/modals/contact/contact.component';
import {ModalService} from '../../../services/overlay/modal.service';
import {IonRouterOutlet, MenuController} from '@ionic/angular';
import {InfoPopoverService} from '../../../services/util/info-popover.service';
import {InfoComponent} from '../../../components/popover/info/info.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {faCopyright} from '@fortawesome/free-solid-svg-icons';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.page.html',
  styleUrls: ['./pricing.page.scss'],
})
export class PricingPage {

  mobile = mobile;
  tablet = tablet;
  copyRightIcon = faCopyright;
  showTermsContainer = false;

  constructor(private modalService: ModalService,
              private routerOutlet: IonRouterOutlet,
              private menu: MenuController,
              private popoverService: InfoPopoverService,
              private translate: LocalizationService,
              private localStorage: LocalStorageService) { }

  async ionViewWillEnter() {
    /* check if cookies have been accepted*/
    this.localStorage.getItem('BOOKanAPPProviderTerms').then(
        value => {
          if (!value.value) {
            this.showTermsContainer = true;
          }
        }
    );

    if (mobile) {
      await this.menu.enable(true, 'pricing');
    }
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

  async infoPopover(info: string, event: any) {
    await this.popoverService.openPopover(InfoComponent, this.translate.getFromKey(info), event);
  }

  showYear() {
    const date = new Date();
    return date.getFullYear();
  }


}
