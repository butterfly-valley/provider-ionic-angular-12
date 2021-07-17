import {Component, OnInit} from '@angular/core';
import {mobile} from '../../../app.component';
import {AuthService} from '../../../services/auth/auth.service';
import {tap} from 'rxjs/operators';
import {MenuController} from '@ionic/angular';
import {CookieService} from "ngx-cookie-service";
import {LocalStorageService} from "../../../services/localstorage/local-storage.service";

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit{

  mobile = mobile;
  loggedUser$;
  showTermsContainer = false;

  constructor(private auth: AuthService,
              private menu: MenuController,
              private localStorage: LocalStorageService
              ) { }

  ngOnInit(): void {
    /* check if cookies have been accepted*/
    this.localStorage.getItem('BOOKanAPPTerms').then(
        value => {
          if (!value.value) {
            this.showTermsContainer = true;
          }
        }
    )
  }

  async ionViewWillEnter() {
    await this.menu.enable(true, 'about');
    this.loggedUser$ = this.auth.getLoggedUser();
  }


}
