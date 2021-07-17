import {Component, OnDestroy} from '@angular/core';
import {mobile} from '../../app.component';
import {faCreditCard, faUserCircle, faUserTie, faWindowMaximize} from '@fortawesome/free-solid-svg-icons';
import {AuthService} from '../../services/auth/auth.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {distinctUntilChanged, take} from 'rxjs/operators';
import {MenuController} from '@ionic/angular';
import {GuidedTour, GuidedTourService, Orientation} from 'ngx-guided-tour';
import {Router} from '@angular/router';
import {LocalStorageService} from '../../services/localstorage/local-storage.service';
import {LocalizationService} from '../../services/localization/localization.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnDestroy {
    mobile = mobile;
    accountIcon = faUserCircle;
    pageIcon = faWindowMaximize;
    employeesIcon = faUserTie;
    paymentIcon = faCreditCard;

    authSub$: Subscription;
    authority$ = new BehaviorSubject<string>(null);
    tutorialMode = true;

    constructor(private auth: AuthService,
                private menu: MenuController,
                private router: Router,
                private localStorage: LocalStorageService,
                private guidedTourService: GuidedTourService,
                private translate: LocalizationService) { }

    async ionViewWillEnter() {
        await this.menu.enable(true, 'profile');
        this.authSub$ = this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
            async authorities => {
                this.authority$.next(this.auth.userRole(authorities));
                setTimeout(() => {
                    this.guidedTour();
                }, 500);
            });
    }

    private async guidedTour() {
        const tutorialMode = await this.localStorage.getItem('BOOKanAPPTutorialMode');
        if (tutorialMode.value === null) {
            const guidedTour: GuidedTour = {
                skipCallback: async () => {
                    await this.localStorage.writeObject('BOOKanAPPTutorialMode', 'false');
                    await this.router.navigateByUrl('/user/management/schedule');
                },
                steps: [
                    {
                        content: this.translate.getFromKey('tour-6'),
                        skipStep: false,
                        selector: '.account',
                        orientation: !mobile ? Orientation.Bottom : Orientation.Top

                    },
                    {
                        content: this.translate.getFromKey('tour-7'),
                        skipStep: false,
                        selector: '.page',
                        orientation: !mobile ? Orientation.Bottom : Orientation.Top

                    },
                    {
                        content: this.translate.getFromKey('tour-8'),
                        skipStep: false,
                        selector: '.employees',
                        orientation: !mobile ? Orientation.Bottom : Orientation.Top

                    },
                    {
                        content: this.translate.getFromKey('tour-9'),
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



    ionViewWillLeave() {
        this.cancelSubs();
    }

    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        if (this.authSub$) {
            this.authSub$.unsubscribe();
        }

    }

    showMenuToggle(s: string) {

    }

    showManagement(authority: string) {
        return !(authority !== 'payments' && authority !== 'admin' && authority !== 'roster-view' && authority !== 'roster');
    }
}
