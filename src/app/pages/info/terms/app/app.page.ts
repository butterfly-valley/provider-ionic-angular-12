import { Component, OnInit } from '@angular/core';
import {mobile} from "../../../../app.component";
import {Router} from "@angular/router";
import {AuthService} from "../../../../services/auth/auth.service";

@Component({
  selector: 'app-app',
  templateUrl: './app.page.html',
  styleUrls: ['./app.page.scss'],
})
export class AppPage {

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
