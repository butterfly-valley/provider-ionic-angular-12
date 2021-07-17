import { Component } from '@angular/core';
import {LocalStorageService} from '../../../services/localstorage/local-storage.service';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
})
export class TermsComponent  {
    accepted = false;
    constructor(private localStorage: LocalStorageService) {}

    async accept() {
        this.accepted = true;
        await this.localStorage.writeObject('BOOKanAPPProviderTerms', 'accepted');
    }

}
