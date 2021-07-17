import { Injectable } from '@angular/core';
import {AlertController} from '@ionic/angular';


export interface AlertButton {
  text: string;
  role: string;
  cssClass: string;
  handler: void;
}
@Injectable({
  providedIn: 'root'
})
export class AlertService {
  presentedAlert;

  constructor(private alert: AlertController) { }

  async presentAlert(header: string, subtitle: string, message: string, buttons: any, cssClass?) {
    this.presentedAlert = await this.alert.create({
      header: header,
      subHeader: subtitle,
      message: message,
      buttons: buttons,
      cssClass: cssClass
    });

    await  this.presentedAlert.present();
  }

  async dismiss() {

    if (this.presentedAlert) {
      this.presentedAlert.dismiss();
    }

  }
}
