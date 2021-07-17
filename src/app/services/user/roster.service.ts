import { Injectable } from '@angular/core';
import {Employee} from '../../store/models/provider.model';
import {alertPosition, mobile, tablet} from '../../app.component';
import {EmployeeScheduleComponent} from '../../components/modals/employee/employee-schedule/employee-schedule.component';
import {ModalService} from '../overlay/modal.service';
import {Plugins} from '@capacitor/core';
import {LocalizationService} from '../localization/localization.service';
import {ActionSheetController} from '@ionic/angular';
import {ToastService} from '../overlay/toast.service';
const { Browser } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class RosterService {


  constructor(private modalService: ModalService,
              private translate: LocalizationService,
              private actionSheet: ActionSheetController,
              private toast: ToastService) { }

  async editRoster(employee: Employee, subdivision?: boolean, division?: boolean) {
    let cssClass = '';
    if (!mobile || tablet) {
      cssClass = 'customer-modal';
    }

    await this.modalService.openEmployeeScheduleModal(EmployeeScheduleComponent, cssClass, employee, subdivision, division);

  }

  async shareRoster(name: string, link: string) {

    let shareButtons = [
      {
        text: this.translate.getFromKey('login-email'),
        icon: 'mail-outline',
        handler: () => {
          this.emailLink(link);
        }
      },
      {
        text: this.translate.getFromKey('prof-copy-link'),
        icon: 'copy-outline',
        handler: () => {
          this.copyLink(link);
        }
      },

      {
        text: this.translate.getFromKey('cancel'),
        icon: 'close',
        handler: () => {
        }
      }
    ];

    if (mobile) {
      shareButtons =  [
        {
          text: 'Whatsapp',
          icon: 'logo-whatsapp',
          handler: () => {
            this.whatsappLink(link);
          }
        },
        {
          text: this.translate.getFromKey('login-email'),
          icon: 'mail-outline',
          handler: () => {
            this.emailLink(link);
          }
        },
        {
          text: this.translate.getFromKey('prof-copy-link'),
          icon: 'copy-outline',
          handler: () => {
            this.copyLink(link);
          }
        },
        {
          text: this.translate.getFromKey('cancel'),
          icon: 'close',
          // @ts-ignore
          role: 'cancel',
          handler: () => {
          }
        }
      ];
    }

    const actionSheet = await this.actionSheet.create({
      header: name,
      buttons: shareButtons
    });

    await actionSheet.present();

  }

  async whatsappLink(link: string) {
    await Browser.open({ url: link});
  }

  async emailLink(link: string) {
    await Browser.open({ url: 'mailto:?subject=' + this.translate.getFromKey('roster') + '&body=' +
          this.translate.getFromKey('roster') + ': ' + link});
  }

  async copyLink(link: string) {
    navigator.clipboard.writeText(link)
        .then(async () => { await this.toast.presentToast(this.translate.getFromKey('copied'), alertPosition, 'primary', 2000); })
        .catch((error) => { alert(`Copy failed! ${error}`); });

  }


}
