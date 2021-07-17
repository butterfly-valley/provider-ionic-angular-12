import { Injectable } from '@angular/core';
import {LocalStorageService} from '../localstorage/local-storage.service';
import {GuidedTour, GuidedTourService, Orientation} from 'ngx-guided-tour';
import {LocalizationService} from '../localization/localization.service';
import {Router} from '@angular/router';
import {mobile} from '../../app.component';

@Injectable({
  providedIn: 'root'
})
export class TourService {

  constructor(private localStorage: LocalStorageService,
              private guidedTourService: GuidedTourService,
              private translate: LocalizationService,
              private router: Router) { }

  private async guidedTour() {
    const tutorialMode = await this.localStorage.getItem('BOOKanAPPTutorialMode');
    if (tutorialMode.value === null) {
      const guidedTour: GuidedTour = {
        steps: [
          {
            // title: this.translate.getFromKey('specialist'),
            content: 'Neste campo poderá gerir a informação e as configurações da sua conta',
            skipStep: false,
            selector: '.account',
            orientation: !mobile ? Orientation.Bottom : Orientation.Top

          },
          {
            // title: this.translate.getFromKey('specialist'),
            content: 'Neste campo poderá gerir a sua página no portal www.bookanapp.com e na app BOOKanAPP',
            skipStep: false,
            selector: '.page',
            orientation: !mobile ? Orientation.Bottom : Orientation.Top

          },
          {
            // title: this.translate.getFromKey('specialist'),
            content: 'Neste campo poderá vizuliazar e gerir os seus colaboradores para lhes criar e gerir um ' +
                'perfil de acesso separado à sua conta podendo limitar acesso a determinadas agendas ou apenas dar acesso a funções administrativas etc.',
            skipStep: false,
            selector: '.employees',
            orientation: !mobile ? Orientation.Bottom : Orientation.Top

          },
          {
            // title: this.translate.getFromKey('specialist'),
            content: 'Neste campo vai gerir o seu plano e os seus pagamentos',
            skipStep: false,
            selector: '.payments',
            orientation: !mobile ? Orientation.Bottom : Orientation.Top,
            closeAction: async () => {
              await this.localStorage.writeObject('BOOKanAPPTutorialMode', 'false');
              await this.router.navigateByUrl('/user/management/schedule');
            }


          },

        ],
        tourId: '',
        resizeDialog: {
          title: 'title',
          content: 'content'
        }

      };

      this.guidedTourService.startTour(guidedTour);
    }

  }


}
