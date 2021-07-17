import { Injectable } from '@angular/core';
import {
    CanLoad,
    Route, Router,
    UrlSegment,
} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthGuardService} from './auth.service';
import {filter, map, take} from 'rxjs/operators';
import {AuthService} from "../auth/auth.service";

@Injectable({
    providedIn: 'root'
})
export class UserGuard implements CanLoad {

    constructor(private authGuard: AuthGuardService, private router: Router, private auth: AuthService) {
    }

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {

        if (this.auth.isAuthenticated()) {
            return true;
        } else {
            return this.auth.getCurrentTokenForAuth().pipe(
                take(2),
                filter(token => token !== undefined),
                map(
                    response => {
                        if (response && response !== 'Invalid token') {
                            return true;
                        } else {
                            this.router.navigateByUrl('');
                            return false;
                        }
                    }
                ));
        }
    }
}


