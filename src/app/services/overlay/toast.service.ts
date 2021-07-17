import { Injectable } from '@angular/core';
import {ToastController} from '@ionic/angular';
import {MatSnackBar} from '@angular/material/snack-bar';
import {InfoComponent} from '../../components/popover/info/info.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController,
              private snackBar: MatSnackBar) { }

  async presentToast(message: string, position: any, color: string, duration?: number, buttons?: any) {
    let setDuration;
    if (duration !== null) {
      setDuration = duration;
    } else {
      setDuration = null;
    }
    let setButtons;
    if (buttons !== null) {
      setButtons = buttons;
    } else {
      setButtons = null;
    }

    const toast = await this.toastController.create({
      message: message,
      position: position,
      color: color,
      cssClass: 'ion-text-center toast-text toast-opaque',
      duration: setDuration,
      buttons: setButtons
    });
    await toast.present();
  }

  async presentSnackbar(message: string, duration: number, success: boolean) {
    await this.snackBar.open(message, '', {
      duration: duration,
      panelClass: [success ? 'success-snackbar' : 'error-snackbar']
    });
  }
}
