import { Component, OnInit } from '@angular/core';
import {PlatformDetectionService} from '../../../services/platformdetection/platformdetection.service';
import {Router} from '@angular/router';
import {mobile} from '../../../app.component';
import {AuthService} from '../../../services/auth/auth.service';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
})
export class TermsPage {

  mobile = mobile;
  loggedUser$;

  constructor(private router: Router, private auth: AuthService) {}


  /*navigate automatically to privacy*/
  ionViewWillEnter() {
    this.loggedUser$ = this.auth.getLoggedUser();
    if (this.router.url === '/info/terms#privacy') {
      const el = document.getElementById('privacy');
      el.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    }

  }
}
