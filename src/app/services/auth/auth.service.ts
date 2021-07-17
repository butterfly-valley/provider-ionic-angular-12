import { Injectable } from '@angular/core';
import {LoginRequest, RefreshToken} from '../../components/rest/loginrequest.model';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {LocalStorageService} from '../localstorage/local-storage.service';
import {BASE_URL} from '../../app.component';
import {distinctUntilChanged, filter, take} from 'rxjs/operators';
import {NavController} from "@ionic/angular";
import {Provider} from "../../store/models/provider.model";
import {Router} from "@angular/router";
import {UserStats} from "../../store/models/user.model";
import {LocalizationService} from "../localization/localization.service";
import {LoadingService} from "../loading/loading.service";


@Injectable({
    providedIn: 'root'
})
export class AuthService {

    BASE_URL = 'http://localhost:8082/provider';
    PROVIDER_SERVICE_URL = 'http://localhost:8083';

    authenticationState = new BehaviorSubject(false);
    userAuthorities$ = new BehaviorSubject<string[]>(null);
    userId$ = new BehaviorSubject<string>(null);
    userStats$ = new BehaviorSubject<UserStats>(null);

    authToken$ = new BehaviorSubject<string>(undefined);
    private currentToken$ = new BehaviorSubject<string>(undefined);
    private loggedUser$ = new BehaviorSubject<Provider>(null);
    timezoneId$ = new BehaviorSubject<string>(null);

    constructor(private http: HttpClient,
                private localStorage: LocalStorageService,
                private navCtrl: NavController,
                private router: Router,
                private translate: LocalizationService,
                private loading: LoadingService) { }

    /*  request new Bearer from server*/
    requestToken(loginRequest: LoginRequest) {
        return this.http.post(this.BASE_URL + '/jwt/token', loginRequest);
    }

    /*  refresh Bearer from server*/
    refreshToken(refreshToken: RefreshToken) {
        return this.http.post(this.BASE_URL + '/jwt/token/refresh', refreshToken);
    }

    /*load provider entity from server*/
    loadProviderFromServer(token: string, complete?) {
        let params = new HttpParams();
        if (complete) {
            params = params.append('complete', 'true');
        }
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + token);
        return this.http.post<Provider>(this.PROVIDER_SERVICE_URL + '/user/load', '', { headers: tokenHeaders, params: params});
    }

    /*load logged user entity from server*/
    loadLoggedUserFromServer(token: string, complete?) {
        let params = new HttpParams();
        if (complete) {
            params = params.append('complete', 'true');
        }
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + token);
        return this.http.post<Provider>(this.PROVIDER_SERVICE_URL + '/user/load/logged', '', { headers: tokenHeaders, params: params});
    }

    setLoggedUser(provider: Provider) {
        this.loggedUser$.next(provider);
    }

    getLoggedUser() {
        return this.loggedUser$;
    }
    async signOut() {
        const loading = await this.loading.showLoading(this.translate.getFromKey('processing'));
        await loading.present();
        this.authenticationState.next(false);
        /*delete refresh token from server*/
        this.localStorage.getItem('bookanappRefreshProviderJWT').then(
            token => {
                if (token.value) {
                    this.getCurrentToken().pipe(distinctUntilChanged(), take(1)).subscribe(
                        authToken => {
                            if (authToken) {
                                this.logoutFromServer(authToken, JSON.parse(token.value)).subscribe(
                                    response => {
                                        this.loading.dismissLoading();
                                        this.logoutHelper();
                                    }, error => {
                                        this.loading.dismissLoading();
                                        this.logoutHelper();
                                    }
                                )
                            } else {
                                this.loading.dismissLoading();
                                this.logoutHelper();
                            }
                        }, error => {
                            this.loading.dismissLoading();
                            this.logoutHelper();
                        }
                    );
                }
            }

        )

    }

    private logoutHelper() {
        this.localStorage.removeItem('bookanappProviderJWT').then(
            () => {
                this.localStorage.removeItem('bookanappRefreshProviderJWT').then(
                    async () => {
                        this.authToken$.next(undefined);
                        this.setLoggedUser(undefined);
                        this.authenticationState.next(undefined);
                        await this.navCtrl.navigateRoot('/');
                        window.location.reload();
                    }
                );
            }
        );
    }

    /*verify and return latest valid token if available for services only to avoid redirecting*/
    getCurrentToken() {
        return this.getTokenFromLocalStorage(this.currentToken$).pipe(
            filter(token => token !== undefined),
            take(1));
    }

    /*verify and return latest valid token if available for authentication*/
    getCurrentTokenForAuth() {
        return this.getTokenFromLocalStorage(this.authToken$).pipe(
            filter(token => token !== undefined),
            take(1));
    }

    getTokenFromLocalStorage(tokenSub: BehaviorSubject<string>) {
        tokenSub.next(undefined);
        this.localStorage.getItem('bookanappProviderJWT').then(
            token => {
                /*verify currently stored token*/
                const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + JSON.parse(token.value));
                this.http.get<any>(this.BASE_URL + '/jwt/token/verify', { headers: tokenHeaders}).subscribe(
                    async response => {
                        if (response['authorities']) {
                            this.userAuthorities$.next(response['authorities']);
                            tokenSub.next(JSON.parse(token.value));
                            if (response['id']){
                                this.userId$.next(response['id']);
                            }
                        } else if (response['forcePasswordChange']) {
                            tokenSub.next(JSON.parse(token.value));
                            await this.router.navigateByUrl('/login?forcePasswordChange=true');
                        }  else {
                            this.localStorage.getItem('bookanappRefreshProviderJWT').then(
                                refreshToken => {
                                    if (refreshToken) {
                                        this.refreshToken({refresh_token: JSON.parse(refreshToken.value)}).subscribe(
                                            serverResponse => {
                                                this.userAuthorities$.next(serverResponse['authorities']);
                                                const receivedToken = serverResponse['accessToken'];
                                                this.localStorage.writeObject('bookanappProviderJWT', receivedToken);
                                                this.localStorage.writeObject('bookanappRefreshProviderJWT', serverResponse['refresh_token']);
                                                tokenSub.next(receivedToken);
                                            }, refreshTokenError => {
                                                tokenSub.next('Invalid token');
                                            }
                                        );
                                    } else {
                                        tokenSub.next('Invalid token');
                                    }
                                }
                            );

                        }


                    }, error => {
                        tokenSub.next('Invalid token');
                    });
            }
        );

        return tokenSub;
    }

    setAuthenticated(value: boolean) {
        this.authenticationState.next(value) ;
    }

    isAuthenticated() {
        return this.authenticationState.value;
    }


    resendVerificationEmail(email: string) {
        return this.http.post<any>(BASE_URL + '/reset/verif_email/rest', {username: email});
    }

    sendPasswordResetEmail(form: any) {
        return this.http.post<any>(BASE_URL + '/reset/user_password/send/rest', form);
    }

    processPasswordReset(passwordForm: any) {
        return this.http.post<any>(BASE_URL + '/reset/password/rest', passwordForm);
    }

    processEmployeePasswordReset(token, passwordForm: any) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization',    'Bearer ' + token);
        return this.http.post<any>(BASE_URL + '/reset/employee/password', passwordForm, { headers: tokenHeaders});
    }

    verifyEmailAddress(emailVerificationToken: string) {
        return this.http.post<any>(BASE_URL + '/signup/verify/rest', {emailVerificationToken: emailVerificationToken});
    }

    async redirectUnauthorizedUser(userRole: string) {
        if (userRole === 'payments') {
            await this.router.navigateByUrl('/user/profile/payments');
        } else if (userRole === 'admin') {
            await this.router.navigateByUrl('/user/profile/account');
        } else if (userRole === 'roster') {
            await this.router.navigateByUrl('/user/profile/employees');
        } else if (userRole === 'roster-view') {
            await this.router.navigateByUrl('/user/profile/employee-profile');
        } else {
            await this.router.navigateByUrl('/user/management/schedule');
        }
    }

    userPlan(authorities: string[]) {
        if (authorities) {
            if (authorities.includes('ROLE_ENTERPRISE')) {
                return 'ENTERPRISE';
            }
            if (authorities.includes('ROLE_PRO')) {
                return 'PRO';
            }
            if (authorities.includes('ROLE_BUSINESS')) {
                return 'BUSINESS';

            } else if (authorities.includes('ROLE_PLUS')) {
                return 'PLUS';
            } else {
                return 'BASIC';
            }
        }
    }

    userRole(authorities: string[]) {
        if (authorities) {
            if (!authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_SCHED')
                && !authorities.includes('SUBPROVIDER_SCHED_VIEW') && authorities.includes('SUBPROVIDER_ADMIN')) {
                return 'admin';
            } else if (!authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_ADMIN')
                && !authorities.includes('SUBPROVIDER_PAY') && !authorities.includes('PROVIDER') && !authorities.includes('SUBPROVIDER_SCHED')
                && !authorities.includes('SUBPROVIDER_SCHED_VIEW')  && authorities.includes('SUBPROVIDER_CUSTOMERS')) {
                return 'customers';
            } else if (!authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_ADMIN')
                && !authorities.includes('SUBPROVIDER_PAY') && !authorities.includes('PROVIDER') && (authorities.includes('SUBPROVIDER_SCHED')
                    || authorities.includes('SUBPROVIDER_SCHED_VIEW'))  && authorities.includes('SUBPROVIDER_CUSTOMERS')) {
                return 'schedule-customers';
            } else if ((!authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_SCHED')
                && !authorities.includes('SUBPROVIDER_SCHED_VIEW')) && !authorities.includes('SUBPROVIDER_ADMIN') && !authorities.includes('PROVIDER')
                && !authorities.includes('SUBPROVIDER_ROSTER') && authorities.includes('SUBPROVIDER_PAY')) {
                return 'payments';
            }  else if (!authorities.includes('PROVIDER') && authorities.includes('SUBPROVIDER_ROSTER')
                && !authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_SCHED_VIEW') && !authorities.includes('SUBPROVIDER_SCHED')) {
                return 'roster';
            } else if (authorities.includes('SUBPROVIDER_SCHED_VIEW') && !authorities.includes('SUBPROVIDER_SCHED')) {
                return 'schedule-view';
            } else if (!authorities.includes('SUBPROVIDER_SCHED_VIEW') && authorities.includes('SUBPROVIDER_SCHED')) {
                return 'schedule';
            } else if (authorities.includes('SUBPROVIDER_FULL')) {
                return 'full';
            } else if (!authorities.includes('PROVIDER') && !authorities.includes('SUBPROVIDER_ROSTER')
                && !authorities.includes('SUBPROVIDER_FULL') && !authorities.includes('SUBPROVIDER_SCHED_VIEW') && !authorities.includes('SUBPROVIDER_SCHED')
                && !authorities.includes('SUBPROVIDER_ROSTER')) {
                return 'roster-view';
            } else {
                return 'provider';
            }
        }
    }

    private logoutFromServer(token: string, refresh_token: string) {
        const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', 'Bearer ' + token);
        return this.http.post(BASE_URL + '/rest/user/logout', { value: refresh_token}, {headers: tokenHeaders});
    }
}
