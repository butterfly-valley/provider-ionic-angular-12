import { Injectable } from '@angular/core';
import {AuthService} from '../auth/auth.service';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, filter, take} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthGuardService {
    authState = new BehaviorSubject<boolean>(false);

    constructor(private router: Router,
                private auth: AuthService) { }

    autoAuth(redirect: boolean, redirectToLogin: boolean) {
        if (this.auth.isAuthenticated()) {
                this.authState.next(true);
        } else {
            this.auth.getCurrentTokenForAuth().pipe(
                take(2),
                filter(token => token !== undefined),
                ).subscribe(
                async response => {

                    if (response && response !== 'Invalid token') {
                        await this.fetchUser(response, redirect, redirectToLogin);
                        this.authState.next(true);
                    } else {
                        this.authState.next(false);
                    }
                }
            );
        }
        return this.authState;
    }

    private async fetchUser(token: string, redirect: boolean, redirectToLogin: boolean) {
        this.auth.loadProviderFromServer(token).subscribe(
            user => {
                if (user) {
                    this.auth.setLoggedUser(user);
                    if (redirect) {
                        this.auth.userAuthorities$.pipe(distinctUntilChanged(), take(1)).subscribe(
                            async authorities => {
                                switch (this.auth.userRole(authorities)) {
                                    case "admin":
                                        await this.router.navigateByUrl('/user/profile/account');
                                        break;
                                    case "payments":
                                        await this.router.navigateByUrl('/user/profile/payments');
                                        break;
                                    case "roster":
                                        await this.router.navigateByUrl('/user/profile/employees');
                                        break;
                                    case "roster-view":
                                        await this.router.navigateByUrl('/user/profile/employee-profile');
                                        break;
                                    default:
                                        await this.router.navigateByUrl('/user/management/schedule');


                                }
                            });
                    }
                } else {
                    if (redirectToLogin) {
                        this.router.navigateByUrl('/login');
                    }
                }
            }, error => {
                if (redirectToLogin) {
                    this.router.navigateByUrl('/login');
                }
            }
        )

    }

}


