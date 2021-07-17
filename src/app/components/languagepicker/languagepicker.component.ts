import {Component, Input, OnInit} from '@angular/core';
import {ActionSheetController} from '@ionic/angular';
import {LocalizationService} from '../../services/localization/localization.service';
import {mobile} from '../../app.component';

@Component({
  selector: 'app-languagepicker',
  templateUrl: './languagepicker.component.html',
  styleUrls: ['./languagepicker.component.scss'],
})
export class LanguagePickerComponent {

  mobile = mobile;
  @Input() color: string;

  constructor(public actionSheetController: ActionSheetController,
              public localizationService: LocalizationService) {}


  async changeLocale() {
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'English',
        icon: 'globe',
        handler: () => {
          this.localizationService.changeLocale('en-US');
          window.location.reload();
        }
      }, {
        text: 'Português (Portugal)',
        icon: 'globe',
        handler: () => {
          this.localizationService.changeLocale('pt-PT');
          window.location.reload();
        }
      }, {
        text: 'Русский',
        icon: 'globe',
        handler: () => {
          this.localizationService.changeLocale('ru-RU');
          window.location.reload();
        }
      },
        {
          text: this.localizationService.getFromKey('cancel'),
          icon: 'close',
          role: 'cancel',

        }
      ]
    });
    await actionSheet.present();
  }

}
