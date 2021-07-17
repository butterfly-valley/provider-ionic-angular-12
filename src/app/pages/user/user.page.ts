import {Component, OnDestroy, OnInit} from '@angular/core';
import {mobile} from '../../app.component';
import {faCalendarAlt, faCalendarCheck, faCommentAlt, faUsers,} from '@fortawesome/free-solid-svg-icons';
import {BehaviorSubject, Subscription} from 'rxjs';
import {MenuController} from '@ionic/angular';
import {AuthService} from '../../services/auth/auth.service';
import {Employee, Provider} from '../../store/models/provider.model';
import {Router} from '@angular/router';
import {distinctUntilChanged} from 'rxjs/operators';
import {GuidedTour, GuidedTourService, Orientation, TourStep} from 'ngx-guided-tour';
import {LocalStorageService} from '../../services/localstorage/local-storage.service';
import {LocalizationService} from '../../services/localization/localization.service';

export const messageIcon = faCommentAlt;
export const appointmentIcon = faCalendarCheck;
export const scheduleIcon = faCalendarAlt;


@Component({
    selector: 'app-user',
    templateUrl: './user.page.html',
    styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnDestroy, OnInit {

    providerSub$: Subscription;

    loading: any;
    mobile = mobile;

    messageIcon = messageIcon;
    appointmentIcon = appointmentIcon;
    scheduleIcon = scheduleIcon;
    customersIcon = faUsers;

    menuToggleButton = true;

    schedulePageActive = false;
    appointmentsPageActive = false;
    authority$ = new BehaviorSubject<string>(null);
    user$ = new BehaviorSubject<Provider>(null);
    loggedUser$ = new BehaviorSubject<Provider | Employee>(null);

    constructor(public auth: AuthService,
                private menu: MenuController,
                private router: Router,
                private localStorage: LocalStorageService,
                private guidedTourService: GuidedTourService,
                private translate: LocalizationService) { }


    ngOnInit() {
        this.initPage(true);
    }


    async ionViewWillEnter() {
        await this.initPage(false);
    }

    private async initPage(demo: boolean) {
        await this.menu.enable(true, 'management');
        this.providerSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.auth.loadProviderFromServer(token).subscribe(
                        response => {
                            const user = response as Provider;
                            this.auth.setLoggedUser(user);
                            this.auth.timezoneId$.next(response.timezoneId);
                            this.user$.next(user);
                            this.auth.userAuthorities$.pipe(distinctUntilChanged()).subscribe(
                                async authorities => {
                                    this.authority$.next(this.auth.userRole(authorities));
                                });
                            if (demo) {
                                setTimeout(() => {
                                    this.guidedTour();
                                }, 500);
                            }
                        }
                    );

                    this.auth.loadLoggedUserFromServer(token).subscribe(
                        response => {
                            this.loggedUser$.next(response);
                        }
                    );
                }
            }
        );
    }

    private async guidedTour() {
        // if (mobile) {
        const tutorialMode = await this.localStorage.getItem('BOOKanAPPTutorialMode');
        if (tutorialMode.value === null) {
            const guidedTour: GuidedTour = {
                skipCallback: async () => {
                    await this.localStorage.writeObject('BOOKanAPPTutorialMode', 'false');
                    await this.router.navigateByUrl('/user/management/schedule');
                },
                steps: this.tourSteps(),
                tourId: '',
                resizeDialog: {
                    title: 'title',
                    content: 'content'
                }

            };

            this.guidedTourService.startTour(guidedTour);
        }
        // }

    }

    private async showTourInMenu() {

        const tutorialMode = await this.localStorage.getItem('BOOKanAPPTutorialMode');
        if (tutorialMode.value === null) {
            const guidedTour: GuidedTour = {
                steps: [{
                    content: this.translate.getFromKey('tour-5'),
                    skipStep: false,
                    selector: '.profile',
                    orientation: Orientation.Bottom,
                    closeAction: async () => {
                        await this.router.navigate(['/user/profile/account']);
                    }

                }

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

    private tourSteps(): TourStep[] {

        const steps: TourStep[] = [];

        steps.push({
                content: this.translate.getFromKey('tour-1'),
                skipStep: false,
                selector: '.schedule',
                orientation: !mobile ? Orientation.Bottom : Orientation.Top

            },
            {
                content: this.translate.getFromKey('tour-2'),
                skipStep: false,
                selector: '.appointments',
                orientation: !mobile ? Orientation.Bottom : Orientation.Top

            },
            {
                content: this.translate.getFromKey('tour-3'),
                skipStep: false,
                selector: '.customers',
                orientation: !mobile ? Orientation.Bottom : Orientation.Top

            },
            {
                content: this.translate.getFromKey('tour-4'),
                skipStep: false,
                selector: '.messages',
                orientation: !mobile ? Orientation.Bottom : Orientation.Top

            }
            );

        if (!mobile) {
            steps.push(
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
                    }

                },
            )

        } else {
            steps.push(              {
                content: this.translate.getFromKey('tour-4'),
                skipStep: false,
                selector: '.messages',
                orientation: !mobile ? Orientation.Bottom : Orientation.Top,
                closeAction: async () => {
                    await this.menu.open();
                    setTimeout(async () => {
                        await this.showTourInMenu();
                    }, 100);
                }

            })
        }

        return steps;
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

    // handle menu navigation
    async segmentChanged(event: CustomEvent) {
        await this.router.navigateByUrl(event.detail.value);
    }

    showMenuToggle(page: string) {
        if (page === 'schedule') {
            this.schedulePageActive = true;
            this.appointmentsPageActive = false;
            this.menuToggleButton = true;
        } else  if (page === 'appointments') {
            this.appointmentsPageActive = true;
            this.schedulePageActive = false;
            this.menuToggleButton = true;
        } else {
            this.appointmentsPageActive = false;
            this.schedulePageActive = false;
            this.menuToggleButton = false;
        }
    }

    showManagement(authority: string) {
        return !(!authority.includes('schedule') && !authority.includes('customers'));
    }

}
