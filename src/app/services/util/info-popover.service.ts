import { Injectable } from '@angular/core';
import {PopoverController} from '@ionic/angular';
import {ViewconfigComponent} from '../../components/popover/viewconfig/viewconfig.component';

@Injectable({
    providedIn: 'root'
})
export class InfoPopoverService {

    constructor(private popoverCtrl: PopoverController) { }

    async openPopover(component: any, info: string, event: any, link?: string) {
        const popover = await this.popoverCtrl.create({
            component: component,
            event: event,
            translucent: true,
            mode: 'ios',
            componentProps: {'info' : info, link: link},
            cssClass: 'info-popover'
        });
        return await popover.present();
    }



}
