import { Injectable } from '@angular/core';
import {LoadingController} from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    loading: Promise<HTMLIonLoadingElement>;

    constructor(private loadingController: LoadingController) { }

    async showLoading(message: string) {
        if (this.loading) {
            this.loading = undefined;
        }
        this.loading = this.loadingController.create({
            message: message,
        });
        return await this.loading;
    }


    async dismissLoading() {
        if (this.loading) {
            await (await this.loading).dismiss();
            this.loading = undefined;
        }
    }

}
