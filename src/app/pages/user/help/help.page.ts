import {Component, OnDestroy} from '@angular/core';
import {HelpVideo, helpVideosPt} from "../../../services/help/videos";
import {mobile, tablet} from "../../../app.component";
import {AuthService} from "../../../services/auth/auth.service";
import {ModalService} from "../../../services/overlay/modal.service";
import {VideoComponent} from "../../../components/modals/video/video.component";
import {distinctUntilChanged} from "rxjs/operators";
import {Provider} from "../../../store/models/provider.model";
import {Subscription} from "rxjs";
import {MenuController} from "@ionic/angular";

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
})
export class HelpPage implements OnDestroy{
  mobile = mobile;
  tablet = tablet;
  loggedUser$ = this.auth.getLoggedUser();
  providerSub$: Subscription;


  helpLinks;

  constructor(private auth: AuthService,
              private modalService: ModalService,
              private menu: MenuController) { }

  async ionViewWillEnter() {
    this.helpLinks = helpVideosPt;
    await this.menu.enable(true, 'help');
    this.providerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
        token => {
          if (token) {
            this.auth.loadProviderFromServer(token).subscribe(
                response => {
                  const user = response as Provider;
                  this.auth.setLoggedUser(user);
                  this.auth.timezoneId$.next(response.timezoneId);
                }
            )
          }
        }
    )

  }

  ionViewWillLeave() {
    if (this.providerSub$) {
      this.providerSub$.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.providerSub$) {
      this.providerSub$.unsubscribe();
    }
  }

  search(ev: CustomEvent) {
    const term = ev.target['value'];
    function filterByTerm(element, index, array) {
      return (element.snippet.title.toLowerCase().includes(term.toLowerCase()));
    }
    this.helpLinks = helpVideosPt.filter(filterByTerm)
  }

  async openVideo(video: HelpVideo) {
    await this.modalService.openVideoModal(VideoComponent, 'https://www.youtube.com/embed/' + video.snippet.resourceId.videoId)
  }
}
