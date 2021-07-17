import { Injectable } from '@angular/core';
import {IonContent} from "@ionic/angular";

@Injectable({
    providedIn: 'root'
})
export class SidenavService {

    scheduleSideNav = true;
    appointmentsSideNav = true;
    schedulePageActive = false;
    appointmentsPageActive = false;

    hideSideNav() {
        if (this.schedulePageActive) {
            this.scheduleSideNav = false;
        }

        if (this.appointmentsPageActive) {
            this.appointmentsSideNav = false;
        }
    }

    async showScheduleSidenav(content: IonContent) {
        this.schedulePageActive = true;
        this.scheduleSideNav = true;
        if (content) {
            await content.scrollToTop();
        }
    }

    async showAppSidenav(content: IonContent) {
        this.appointmentsSideNav = true;
        this.appointmentsPageActive = true;
        if (content) {
            await content.scrollToTop();
        }
    }


}
